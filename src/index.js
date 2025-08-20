import { initBrowser, navigate, executeAction, closeBrowser } from "./browser.js";
import { markElements } from "./elementMarker.js";
import { generateAction, createExecutionPlan } from "./llmClient.js";
import fs from "fs";
import path from "path";

const loadConfig = () => {
    const configPath = path.join(process.cwd(), 'config.json');
    return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
};

const getSettings = (config) => ({
    maxSteps: 15,
    stepDelay: 2000,
    headless: false,
    ...config?.settings
});

const main = async () => {
    try {
        const config = loadConfig();
        const command = process.argv.slice(2).join(' ') ||
            'Entre no mercado livre e faça uma busca por ar condicionado, ordene pelo menor preço e clique no primeiro resultado para abrir o produto';

        const settings = getSettings(config);

        console.log(`🚀 Comando: ${command}`);
        console.log("=".repeat(80));

        // Primeira fase: IA cria o plano de execução
        console.log("📋 Criando plano de execução...");
        const plan = await createExecutionPlan(command);

        console.log("\n� PLANO DE EXECUÇÃO:");
        plan.steps.forEach((step, index) => {
            console.log(`${index + 1} - ${step}`);
        });
        console.log(`🌐 URL inicial: ${plan.startUrl}`);
        console.log("=".repeat(80));

        // Segunda fase: Executar o plano
        const { browser, page } = await initBrowser();
        await navigate(page, plan.startUrl);
        await page.waitForTimeout(1000);

        await executePlan(page, plan, settings);

        console.log("🎉 Processo concluído!");
        console.log("Pressione Ctrl+C para fechar ou aguarde 10s...");
        await page.waitForTimeout(10000);
        await closeBrowser(browser);
    } catch (error) {
        console.error("❌ Erro:", error.message);
    }
};

const executePlan = async (page, plan, settings) => {
    let currentStep = 0;

    for (const stepDescription of plan.steps) {
        currentStep++;

        try {
            console.log(`\n=== PASSO ${currentStep} ===`);
            console.log(`Executando: ${stepDescription}`);

            const elements = await markElements(page);
            if (elements.length === 0) {
                console.log("⚠️ Nenhum elemento interativo encontrado. Continuando...");
                continue;
            }

            const action = await generateAction(stepDescription, elements);
            console.log(`Ação: ${action.action} em elemento ${action.id}`);

            await executeAction(page, action);
            console.log("✅ Passo concluído!");

            await page.waitForTimeout(settings.stepDelay);

        } catch (error) {
            console.log(`❌ Erro no passo ${currentStep}: ${error.message}`);

            if (error.message.includes('outside of the viewport') ||
                error.message.includes('Timeout')) {
                console.log("🔄 Continuando para o próximo passo...");
                continue;
            }

            // Para erros críticos, tenta recuperar
            if (currentStep < plan.steps.length) {
                console.log("🔄 Tentando continuar com próximo passo...");
                continue;
            }

            throw error;
        }
    }
};

main();
