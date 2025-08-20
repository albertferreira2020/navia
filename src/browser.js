import { chromium } from "playwright";

const initBrowser = async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    return { browser, page };
};

const navigate = async (page, url) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
};

const executeAction = async (page, action) => {
    console.log("Executando ação:", action);
    const { id, action: actionType, value } = action;
    const selector = `[data-browser-use="${id}"]`;

    try {
        const element = page.locator(selector);
        await element.scrollIntoViewIfNeeded({ timeout: 5000 });
        await page.waitForTimeout(500);

        switch (actionType) {
            case "click":
                await element.click({ timeout: 8000, force: false });
                break;
            case "type": {
                // Verify element can receive text input
                const elementInfo = await page.evaluate(sel => {
                    const el = document.querySelector(sel);
                    if (!el) return { exists: false };

                    const tagName = el.tagName.toLowerCase();
                    const type = el.type?.toLowerCase() || '';
                    const isInput = tagName === 'input' && ['text', 'search', 'email', 'password', '', undefined].includes(type);
                    const isTextarea = tagName === 'textarea';
                    const isEditable = el.contentEditable === 'true';

                    return {
                        exists: true,
                        tagName,
                        type,
                        canType: isInput || isTextarea || isEditable,
                        placeholder: el.placeholder || '',
                        className: el.className || ''
                    };
                }, selector);

                if (!elementInfo.exists) {
                    throw new Error(`Elemento ${id} não encontrado`);
                }

                if (!elementInfo.canType) {
                    throw new Error(`Elemento ${id} (${elementInfo.tagName}[${elementInfo.type}]) não pode receber texto. Use um campo de input apropriado.`);
                }

                await element.fill(value);
                break;
            }
            case "select":
                await element.selectOption(value);
                break;
            default:
                throw new Error(`Ação não suportada: ${actionType}`);
        }
    } catch (error) {
        console.log(`Erro ao executar ação ${actionType} no elemento ${id}:`, error.message);

        if (actionType === "click") {
            try {
                console.log("Tentando com JavaScript nativo...");
                const success = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return false;

                    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });

                    window.setTimeout(() => {
                        if (el.click) {
                            el.click();
                        } else {
                            el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        }
                    }, 200);

                    return true;
                }, selector);

                if (success) {
                    await page.waitForTimeout(1000);
                    console.log("✅ Clique executado via JavaScript!");
                    return;
                }
            } catch (jsError) {
                console.log("Erro no método JavaScript:", jsError.message);
            }
        }

        throw new Error(`Falha ao executar ação ${actionType}: ${error.message}`);
    }
}; const closeBrowser = async (browser) => {
    await browser.close();
};

export {
    initBrowser,
    navigate,
    executeAction,
    closeBrowser,
};
