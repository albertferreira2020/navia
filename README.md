# 🤖 NAVIA - Navegador Automático com IA

Sistema de automação de navegador que usa IA (Groq/OpenAI) para interpretar comandos em linguagem natural e executar ações automaticamente em páginas web.

## ✨ Características

- 🎯 **Comandos em linguagem natural**: "Faça uma busca por JavaScript e clique no primeiro resultado"
- 🔍 **Detecção inteligente de elementos**: Encontra automaticamente campos de busca, botões e links relevantes
- 🎨 **Marcação visual**: Elementos interativos são destacados com números e cores (estilo Browser Use)
- 🔄 **Execução sequencial**: Executa múltiplas ações em sequência para completar tarefas complexas
- ⚙️ **Configurável**: Cenários pré-definidos ou comandos personalizados
- 🚀 **Suporte múltiplas APIs**: Groq (recomendado) ou OpenAI

## 🚀 Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd navia

# Instale dependências
npm install

# Configure as chaves de API
cp .env.example .env
# Edite .env e adicione sua chave GROQ_KEY ou OPENAI_API_KEY

# Instale navegadores Playwright
npx playwright install
```

## 🎮 Como Usar

### Cenários Pré-definidos

```bash
# Busca por notebook no Mercado Livre
npm run mercado

# Abre Gmail e lê emails
npm run gmail

# Busca vídeo no YouTube
npm run youtube

# Busca produto na Amazon
npm run amazon

# Ver todos os cenários disponíveis
npm run help
```

### Comandos Personalizados

```bash
# URL e comando personalizados
node src/index.js custom "https://github.com" "Procure por 'machine learning' e clique no primeiro repositório"

# Usar cenário específico
node src/index.js mercado_livre_notebook

# Comando direto
node src/index.js custom "https://twitter.com" "Faça login e publique um tweet dizendo 'Hello World'"
```

## 📝 Exemplos de Comandos

- `"Faça uma busca por 'JavaScript tutorial' e clique no primeiro resultado"`
- `"Entre na minha conta e vá para configurações"`
- `"Adicione este produto ao carrinho e finalize a compra"`
- `"Procure por 'machine learning' e ordene por relevância"`
- `"Abra os primeiros 3 emails da caixa de entrada"`

## ⚙️ Configuração

Edite `config.json` para:
- Adicionar novos cenários
- Alterar configurações padrão
- Ajustar delays e timeouts

```json
{
  "scenarios": {
    "meu_cenario": {
      "url": "https://example.com",
      "command": "Faça algo específico",
      "description": "Descrição do cenário"
    }
  },
  "settings": {
    "maxSteps": 10,
    "stepDelay": 2000
  }
}
```

## 🎨 Marcação Visual

O sistema marca elementos interativos com:
- 🟢 **Verde**: Campos de input
- 🔵 **Azul**: Botões  
- 🟠 **Laranja**: Links
- 🟣 **Roxo**: Selects
- **Números**: Indicam a ordem/ID dos elementos

## 🔧 Configuração de APIs

### Chaves de API

#### Groq (Recomendado - Mais rápido e gratuito)
```bash
# .env
GROQ_KEY=sua_chave_groq_aqui
```

#### OpenAI (Fallback)
```bash
# .env  
OPENAI_API_KEY=sua_chave_openai_aqui
```

### Configurações Avançadas

Você pode personalizar os modelos e provedores através de variáveis de ambiente:

```bash
# Configurações do Groq (opcional)
GROQ_MODEL=llama3-70b-8192          # Modelo padrão
GROQ_PROVIDER_NAME=Groq             # Nome do provedor
GROQ_API_URL=https://api.groq.com/openai/v1

# Configurações do OpenAI (opcional)
OPENAI_MODEL=gpt-3.5-turbo          # Modelo padrão  
OPENAI_PROVIDER_NAME=OpenAI         # Nome do provedor
OPEN_API_URL=https://api.openai.com/v1/chat/completions
```

### Modelos Disponíveis

#### Groq (Gratuito)
- `llama3-70b-8192` - Recomendado (melhor performance)
- `llama3-8b-8192` - Mais rápido
- `mixtral-8x7b-32768` - Contexto maior (32k tokens)
- `gemma-7b-it` - Alternativa

#### OpenAI (Pago)
- `gpt-3.5-turbo` - Rápido e econômico
- `gpt-4` - Melhor qualidade
- `gpt-4-turbo-preview` - Mais recente

### Exemplo de .env Completo

```bash
# Chaves obrigatórias
GROQ_KEY=gsk_...
OPENAI_API_KEY=sk-...

# Personalizações (opcional)
GROQ_MODEL=llama3-70b-8192
OPENAI_MODEL=gpt-4
```

## 🛠️ Desenvolvimento

```bash
# Executar com logs detalhados
DEBUG=* node src/index.js

# Linting
npm run lint

# Ajuda
npm run help
```

## 🎯 Como Funciona

1. **Navegação**: Abre a página especificada
2. **Detecção**: Encontra elementos interativos (inputs, botões, links)
3. **Marcação**: Adiciona IDs únicos e marcação visual
4. **IA**: Analisa o comando e escolhe a ação apropriada  
5. **Execução**: Realiza a ação (clicar, digitar, selecionar)
6. **Repetição**: Continua até completar a tarefa

## 🔍 Troubleshooting

- **Timeout de elementos**: Elementos podem não estar visíveis, aguarde carregamento
- **IDs não encontrados**: A IA pode estar retornando IDs inexistentes, verifique logs
- **API Errors**: Verifique se as chaves estão corretas no .env

## 📄 Licença

MIT - Use livremente para projetos pessoais e comerciais.
