# Gromit 🐕

Ferramenta CLI para análise de mudanças git e geração de commits via IA.

## Funcionalidades

- ✅ Análise de arquivos modificados no repositório git
- ✅ Visualização de estatísticas de mudanças (inserções/deleções)
- ✅ Preview das diferenças (diff)
- ✅ Geração de prompts para IA criar mensagens de commit
- ✅ Integração com IA para geração automática de commits
- ✅ Commit automático com mensagens geradas por IA
- ✅ **Proteção de branches principais** (master, main, develop)
- ✅ **Revisão de commits pendentes** antes do push
- ✅ **Preview de push** com validação prévia
- ✅ Validação de boas práticas de desenvolvimento  
- ✅ Suporte multilíngue (pt-BR, es-UY, en-US)
- ✅ Configuração flexível de IA (URL, API Key, modelo)

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

⚠️ **IMPORTANTE**: Os comandos `analyze --commit` e `commit` exigem configuração prévia da IA.
💡 **INDEPENDENTES**: Os comandos `analyze --push`, `review` e `push` não requerem configuração e funcionam apenas com git.

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
Analisa mudanças no repositório git para diferentes propósitos:

#### `gromit analyze --commit` (padrão)
⚠️ **Requer configuração obrigatória** (URL da IA + API Key)

Analisa mudanças locais para commit:
- Lista de arquivos modificados
- Quantidade de linhas alteradas por arquivo
- Resumo total das mudanças
- Preview do diff das alterações
- **Copia automaticamente** o prompt para o clipboard
- Gera prompt contextualizado para IA criar mensagem de commit

#### `gromit analyze --push`
💡 **Não requer configuração** - funciona apenas com git

Gera prompt para IA criar título e descrição do Pull Request:
- Analisa commits pendentes vs remote
- Inclui informações completas dos commits
- Lista arquivos modificados com estatísticas
- **Inclui diff detalhado** para contexto da IA
- Usa template do projeto (CENÁRIO, PROBLEMA, SOLUÇÃO)
- **Copia automaticamente** o prompt para o clipboard

```bash
# Análise para commit (comportamento padrão)
gromit analyze
gromit analyze --commit

# Análise com exibição do prompt na tela
gromit analyze --commit --show-prompt

# Análise para Pull Request
gromit analyze --push

# Exemplo de saída --commit:
# 📁 ARQUIVOS MODIFICADOS:
# ──────────────────────────────────────────────────
# 📄 src/auth.ts
#    +25 -3 linhas alteradas
# 📋 PROMPT COPIADO PARA O CLIPBOARD!
#
# Exemplo de saída --push:
# 📝 PROMPT PARA PULL REQUEST GERADO!
# ──────────────────────────────────────────────────
# 📊 INFORMAÇÕES ANALISADAS:
# 📦 Commits pendentes: 3
# 📂 Arquivos modificados: 5
# ✅ Prompt copiado para o clipboard!
```

### `gromit commit`
⚠️ **Requer configuração obrigatória** (URL da IA + API Key)

Funcionalidade completa de commit automático:
- **Valida branch protegida** - Impede commits em master, main ou develop
- Analisa as mudanças no repositório
- Gera prompt otimizado para IA
- Consulta a IA para criar mensagem de commit
- Exibe a mensagem gerada para aprovação
- Adiciona arquivos ao stage (`git add .`)
- Faz o commit automaticamente

**🚫 Proteção de Branches:**
- Não permite commits diretos em: `master`, `main`, `develop`
- Exibe mensagens informativas com sugestões de branches alternativas
- Garante boas práticas de desenvolvimento com feature branches

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

### `gromit review`
Revisa commits locais pendentes antes do push para o repositório remoto:
- Lista commits que ainda não foram enviados ao remote
- Mostra resumo das mudanças (arquivos, linhas inseridas/removidas)  
- Exibe arquivos modificados com ícones por tipo
- Opção para preview das mudanças (diff)
- Instruções claras dos próximos passos

**🔍 Informações Exibidas:**
- **Commits pendentes**: Lista numerada com hash, mensagem, autor e data
- **Estatísticas**: Quantidade de arquivos, linhas adicionadas/removidas
- **Arquivos modificados**: Lista com ícones específicos por tipo de arquivo
- **Preview opcional**: Diff das mudanças (limitado a 50 linhas)

**📋 Casos de Uso:**
- Revisar mudanças antes do `git push`
- Verificar se há commits esquecidos localmente
- Validar alterações antes de enviar para review
- Entender o impacto das mudanças

```bash
# Revisão básica dos commits pendentes
gromit review

# Revisão com preview das mudanças
gromit review --show-diff

# Exemplo de saída:
# 📋 COMMITS PENDENTES PARA PUSH (2):
# ──────────────────────────────────────────────────
# 1. a1b2c3d feat(auth): adiciona autenticação JWT
#    por João Silva em 20/06/2025
# 2. d4e5f6g fix(ui): corrige layout responsivo
#    por Maria Santos em 20/06/2025
# 
# 📊 RESUMO DAS MUDANÇAS:
# ──────────────────────────────────────────────────
# 📂 Arquivos modificados: 5
# ➕ Linhas adicionadas: 127
# ➖ Linhas removidas: 23
```

### `gromit push`
⚠️ **Requer configuração obrigatória** (URL da IA + API Key)

**Comando completo de push com geração automática de Pull Request:**
- **Valida mudanças não commitadas** - Impede push se há arquivos pendentes de commit
- Lista commits que serão enviados ao remote
- Mostra resumo detalhado das mudanças
- **Gera título e descrição via IA** usando template do projeto
- **Faz push automático** para o repositório remoto
- **Cria URL de PR automática** (GitHub/GitLab)
- **Copia URL para clipboard** para criação instantânea do PR

**🚀 Processo Automático (5 etapas):**
1. **📝 Geração de prompt** - Cria contexto completo das mudanças
2. **🤖 Consulta à IA** - Gera título e descrição personalizados
3. **📤 Push automático** - Envia commits para o repositório remoto
4. **🔗 Geração de URL** - Cria link direto para PR (GitHub/GitLab)
5. **📋 Cópia para clipboard** - URL pronta para uso

**🔍 Validações Realizadas:**
- **Mudanças não commitadas**: Detecta arquivos modificados que precisam de commit
- **Remote configurado**: Verifica se existe origin configurado
- **Commits pendentes**: Compara local vs remote para mostrar o que será enviado
- **Configuração da IA**: Valida URL e API Key antes de processar

**✨ Características:**
- **Processo ponta-a-ponta** - Do código ao PR em um comando
- **IA integrada** - Título e descrição contextualizados
- **Multi-plataforma** - Suporte a GitHub e GitLab
- **Template personalizado** - Usa template do projeto (CENÁRIO, PROBLEMA, SOLUÇÃO)
- **URL automática** - Link direto para criar PR no navegador

```bash
# Push completo com geração automática de PR
gromit push

# Push forçado (ignora mudanças não commitadas)
gromit push --force

# Push com visualização detalhada do diff
gromit push --show-diff

# Combinar opções
gromit push --force --show-diff

# Exemplo de saída:
# 🚀 INICIANDO PROCESSO AUTOMÁTICO:
# ──────────────────────────────────────────────────
# 1. 📝 Gerando prompt para IA...
# 2. 🤖 Consultando IA para criar título e descrição...
# ✅ Título e descrição gerados!
# 📋 Título: feat(auth): implementa autenticação JWT
# 📝 Descrição: #### Cenário...
# 3. 📤 Fazendo push para o repositório...
# ✅ Push realizado com sucesso!
# 4. 🔗 Gerando URL automática do Pull Request...
# 
# 🎉 PROCESSO CONCLUÍDO!
# ──────────────────────────────────────────────────
# 📤 Commits enviados: 3
# 📂 Arquivos modificados: 5
# 🌐 Remote: origin/master
# 
# 🔗 URL DO PULL REQUEST COPIADA PARA O CLIPBOARD!
# Cole a URL no navegador para criar o PR automaticamente:
# https://github.com/user/repo/compare/master...feature/auth?quick_pull=1&title=...
#
# Se a descrição for muito longa (>800 caracteres):
# ⚠️  DESCRIÇÃO TRUNCADA NA URL
# 1. Abra a URL no navegador (título e parte da descrição preenchidos)
# 2. Cole a descrição completa mostrada no terminal
#
# 💡 Para apenas análise: gromit analyze --push
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