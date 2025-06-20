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

## Comandos Disponíveis

### `gromit analyze`
Analisa as mudanças no repositório git atual e exibe:
- Lista de arquivos modificados
- Quantidade de linhas alteradas por arquivo
- Resumo total das mudanças
- Preview do diff das alterações
- Prompt otimizado para IA gerar mensagem de commit

### `gromit commit` (em desenvolvimento)
Gerará automaticamente uma mensagem de commit usando IA baseada nas mudanças atuais.

### `gromit config`
Gerencia configurações da IA (URL e chave da API):
- `--url <url>` - Define a URL da API da IA
- `--key <key>` - Define a chave da API da IA  
- `--show` - Mostra as configurações atuais
- `--reset` - Remove todas as configurações

Exemplos:
```bash
# Configurar URL da IA
gromit config --url https://api.openai.com/v1/chat/completions

# Configurar chave da API
gromit config --key sk-sua-chave-da-api

# Configurar ambos de uma vez
gromit config --url https://api.openai.com/v1/chat/completions --key sk-sua-chave

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