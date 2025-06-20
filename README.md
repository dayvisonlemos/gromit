# Gromit 🐕

Ferramenta CLI para análise de mudanças git e geração de commits via IA.

## Funcionalidades

- ✅ Análise de arquivos modificados no repositório git
- ✅ Visualização de estatísticas de mudanças (inserções/deleções)
- ✅ Preview das diferenças (diff)
- ✅ Geração de prompts para IA criar mensagens de commit
- 🚧 Integração com IA para geração automática de commits (em desenvolvimento)
- 🚧 Geração de descrições de Pull Request (em desenvolvimento)

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Compile o projeto:
```bash
npm run build
```

4. Para uso global, faça o link:
```bash
npm link
```

## Uso

### Desenvolvimento
```bash
npm run dev analyze
```

### Produção
```bash
# Após fazer npm link
gromit analyze
```

## Configuração Obrigatória

⚠️ **IMPORTANTE**: Os comandos `analyze` e `commit` exigem configuração prévia da IA.

Antes de usar o gromit, você deve configurar:
1. **URL da API da IA** (ex: OpenAI, Claude, etc.)
2. **Chave da API** (sua chave secreta)

```bash
# Configuração completa
gromit config --url https://api.openai.com/v1/chat/completions --key sk-sua-chave

# Verificar configuração
gromit config --show
```

## Comandos Disponíveis

### `gromit analyze`
⚠️ **Requer configuração obrigatória** (URL da IA + API Key)

Analisa as mudanças no repositório git atual e exibe:
- Lista de arquivos modificados
- Quantidade de linhas alteradas por arquivo
- Resumo total das mudanças
- Preview do diff das alterações
- **Copia automaticamente** o prompt para o clipboard
- Opções:
  - `--show-prompt` - Exibe o prompt completo na tela

```bash
# Análise básica (prompt copiado automaticamente)
gromit analyze

# Análise com exibição do prompt
gromit analyze --show-prompt
```

### `gromit commit`
⚠️ **Requer configuração obrigatória** (URL da IA + API Key)

Funcionalidade completa de commit automático:
- Analisa as mudanças no repositório
- Gera prompt otimizado para IA
- Consulta a IA para criar mensagem de commit
- Exibe a mensagem gerada para aprovação
- Adiciona arquivos ao stage (`git add .`)
- Faz o commit automaticamente

```bash
# Commit automático com IA
gromit commit

# O processo:
# 1. 🔍 Analisa mudanças
# 2. 🤖 Consulta IA 
# 3. 💬 Mostra mensagem gerada
# 4. ⏸️  Aguarda confirmação (Enter)
# 5. ➕ Adiciona arquivos (git add .)
# 6. 📝 Faz commit
```

### `gromit config`
Gerencia configurações da IA (URL, chave da API, modelo e linguagem):
- `--url <url>` - Define a URL da API da IA
- `--key <key>` - Define a chave da API da IA
- `--model <model>` - Define o modelo da IA (ex: gpt-4-turbo, gpt-3.5-turbo)
- `--language <language>` - Define a linguagem dos commits (ex: pt-BR, en-US, es-UY)
- `--show` - Mostra as configurações atuais
- `--reset` - Remove todas as configurações

**Padrões:**
- **Modelo:** `gpt-4.1` (usado se não configurado)
- **Linguagem:** `en-US` (inglês americano - usado se não configurado)

Exemplos:
```bash
# Configurar URL da IA
gromit config --url https://api.openai.com/v1/chat/completions

# Configurar chave da API
gromit config --key sk-sua-chave-da-api

# Configurar modelo específico
gromit config --model gpt-4-turbo

# Configurar linguagem para português brasileiro
gromit config --language pt-BR

# Configurar linguagem para espanhol uruguayo
gromit config --language es-UY

# Configurar tudo de uma vez
gromit config --url https://api.openai.com/v1/chat/completions --key sk-sua-chave --model gpt-4-turbo --language pt-BR

# Mostrar configurações atuais
gromit config --show

# Resetar configurações
gromit config --reset
```

## Estrutura do Projeto

```
src/
├── index.ts              # Entrada principal da CLI
├── commands/
│   └── analyze.ts        # Comando de análise de mudanças
└── utils/
    └── promptGenerator.ts # Gerador de prompts para IA
```

## Desenvolvimento

- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Compila o projeto
- `npm run type-check` - Verifica tipos TypeScript

## Dependências

- **commander** - Framework para CLI
- **simple-git** - Interface para comandos git
- **chalk** - Colorização de terminal
- **ora** - Spinners para feedback visual 