import OpenAI from "openai";
import "dotenv/config";

const createClient = () => {
  if (process.env.GROQ_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_KEY,
        baseURL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1",
      }),
      model: process.env.GROQ_MODEL || "llama3-70b-8192",
      provider: "Groq"
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_API_URL
      }),
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      provider: "OpenAI"
    };
  }

  throw new Error("GROQ_KEY ou OPENAI_API_KEY deve ser configurado no .env");
};

const { client: aiClient, model: modelName, provider } = createClient();
console.log(`Usando ${provider} com modelo: ${modelName}`);

const createExecutionPlan = async (command) => {
  const prompt = `
Analise este comando e crie um plano de execução detalhado:

COMANDO: "${command}"

Você deve extrair:
- O site/domínio mencionado (ex: mercado livre → mercadolivre.com.br)
- O termo de busca exato
- As ações específicas solicitadas (buscar, ordenar, clicar, etc.)
- O critério de ordenação se mencionado (menor preço, maior preço, etc.)

Retorne um JSON com:
1. "startUrl": URL completa para começar (identifique baseado no comando)
2. "steps": array de passos detalhados e específicos

IMPORTANTE: 
- Se mencionar "mercado livre" → use "https://www.mercadolivre.com.br/"
- Se mencionar "amazon" → use "https://www.amazon.com.br/"
- Extraia o termo de busca exato do comando
- Se mencionar "menor preço", seja específico nos passos de ordenação

EXEMPLO para "busque notebook no mercado livre, ordene por menor preço":
{
  "startUrl": "https://www.mercadolivre.com.br/",
  "steps": [
    "Localizar e clicar no campo de busca (input de texto, não botão)",
    "Digitar 'notebook' no campo de busca",
    "Pressionar Enter ou clicar no botão de busca para iniciar a pesquisa",
    "Aguardar o carregamento da página de resultados",
    "Localizar e clicar nas opções de ordenação dos resultados",
    "Selecionar a opção 'Menor preço' na lista de ordenação",
    "Clicar no primeiro produto da lista de resultados ordenados"
  ]
}

Analise o comando fornecido e crie o plano específico. Responda apenas com o JSON:`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Resposta da IA não contém JSON válido");
    }

    const plan = JSON.parse(jsonMatch[0]);

    if (!plan.startUrl || !plan.steps || !Array.isArray(plan.steps)) {
      throw new Error("Plano inválido - deve conter startUrl e steps");
    }

    return plan;
  } catch (error) {
    console.error("Erro ao criar plano:", error.message);
    throw new Error(`Falha ao criar plano de execução: ${error.message}`);
  }
};

const buildActionPrompt = (stepDescription, elements) => `
PASSO ATUAL: "${stepDescription}"

ELEMENTOS DISPONÍVEIS (ordenados por relevância):
${elements.slice(0, 20).map((el, index) =>
  `${index + 1}. ID: "${el.id}" | ${el.tag}[${el.type || ''}] | Text: "${(el.text || '').slice(0, 50)}" | Class: "${(el.className || '').slice(0, 30)}" | Score: ${el.relevanceScore}`
).join("\n")}

REGRAS IMPORTANTES:
1. Para DIGITAR texto: use action="type" com o valor exato
2. Para CLICAR: use action="click" 
3. SEMPRE prefira INPUT FIELDS para digitar (não buttons)
4. Para busca, procure por inputs com type="search", "text" ou que contenham "search", "busca" no nome/classe
5. Para clicar em botões de busca, procure por buttons ou inputs type="submit" próximos ao campo de busca
6. Use APENAS os IDs listados acima

EXEMPLO para digitar busca:
- Se o passo for "Digitar 'ar condicionado'" → escolha um INPUT field, não um BUTTON
- {"action": "type", "id": "bu-X", "value": "ar condicionado"}

Responda apenas com JSON:
{"action": "type|click", "id": "ID_DA_LISTA", "value": "texto_se_necessário"}
`;

const generateAction = async (stepDescription, elements) => {
  const prompt = buildActionPrompt(stepDescription, elements);

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error("Resposta não contém JSON válido");
    }

    const action = JSON.parse(jsonMatch[0]);

    if (!action.action || !action.id) {
      throw new Error("Ação inválida - deve conter action e id");
    }

    if (!elements.some(el => el.id === action.id)) {
      throw new Error(`ID ${action.id} não encontrado nos elementos`);
    }

    return {
      action: action.action,
      id: action.id,
      value: action.value || action.text || action.texto
    };

  } catch (error) {
    throw new Error(`Erro ao processar ação: ${error.message}`);
  }
};

export { generateAction, createExecutionPlan };
