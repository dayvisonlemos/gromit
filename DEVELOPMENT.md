# Guia de Desenvolvimento - Gromit CLI

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ 
- npm 8+

### Instalação
```bash
npm install
```

## Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev        # Executa em modo de desenvolvimento com tsx
npm run build      # Compila TypeScript para JavaScript
npm run start      # Executa versão compilada
```

### Verificações de Qualidade
```bash
npm run type-check    # Verifica tipos TypeScript
npm run lint          # Executa ESLint
npm run lint:fix      # Corrige problemas ESLint automaticamente
npm run lint:check    # ESLint sem avisos (para CI)
```

### Formatação
```bash
npm run format        # Formata código com Prettier
npm run format:check  # Verifica formatação (para CI)
```

### Verificação Completa
```bash
npm run check         # Executa type-check + lint:check + format:check
npm run fix           # Executa lint:fix + format
```

## Configuração do Editor

### VSCode (Recomendado)
As configurações já estão incluídas em `.vscode/`:
- Formatação automática ao salvar
- ESLint fix automático ao salvar  
- Extensões recomendadas

### Extensões Necessárias
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TypeScript** (`ms-vscode.vscode-typescript-next`)

## Regras de Qualidade

### ESLint
- Configuração em `eslint.config.js`
- Foco em qualidade de código e boas práticas
- Permite `console.log` (CLI tool)
- Variáveis não utilizadas com `_` prefix são ignoradas

### Prettier
- Configuração em `.prettierrc`
- Aspas simples, ponto e vírgula obrigatório
- Sem trailing commas
- Largura máxima: 100 caracteres

### TypeScript
- Configuração em `tsconfig.json`
- Strict mode ativado
- Module resolution: Node
- Target: ES2022

## Fluxo de Desenvolvimento

1. **Desenvolvimento Local**
   ```bash
   npm run dev analyze  # Testa comando específico
   ```

2. **Antes de Commit**
   ```bash
   npm run check        # Verifica tudo
   npm run fix          # Corrige automaticamente
   ```

3. **Build de Produção**
   ```bash
   npm run build
   npm run start
   ```

## Estrutura do Projeto

```
src/
├── index.ts           # CLI entry point
├── commands/          # Comandos da CLI
│   ├── analyze.ts     # gromit analyze
│   ├── commit.ts      # gromit commit  
│   ├── config.ts      # gromit config
│   ├── push.ts        # gromit push
│   └── review.ts      # gromit review
└── utils/             # Utilitários
    ├── aiClient.ts    # Cliente IA
    ├── config.ts      # Gerenciamento config
    └── promptGenerator.ts # Geração de prompts
```

## Adicionando Novos Comandos

1. Criar arquivo em `src/commands/`
2. Implementar função principal
3. Adicionar no `src/index.ts`
4. Executar `npm run check`
5. Testar com `npm run dev`

## Troubleshooting

### ESLint não está funcionando
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Prettier conflitando com ESLint
- As configurações já estão alinhadas
- Use `npm run fix` para resolver automaticamente

### TypeScript não compila
```bash
npm run type-check  # Ver erros específicos
``` 