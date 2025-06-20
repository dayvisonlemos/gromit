import { FileChange } from '../commands/analyze.js';

export function generateCommitPrompt(changedFiles: FileChange[], diff: string): string {
  const totalFiles = changedFiles.length;
  const totalInsertions = changedFiles.reduce((sum, file) => sum + file.insertions, 0);
  const totalDeletions = changedFiles.reduce((sum, file) => sum + file.deletions, 0);
  
  // Lista dos arquivos modificados
  const filesList = changedFiles.map(file => 
    `- ${file.file} (+${file.insertions}/-${file.deletions})`
  ).join('\n');
  
  // Pega um preview limitado do diff para não sobrecarregar a IA
  const diffPreview = diff.split('\n').slice(0, 100).join('\n');
  
  const prompt = `Por favor, gere uma mensagem de commit concisa e descritiva baseada nas seguintes mudanças:

RESUMO DAS MUDANÇAS:
- Arquivos modificados: ${totalFiles}
- Linhas inseridas: ${totalInsertions}
- Linhas removidas: ${totalDeletions}

ARQUIVOS ALTERADOS:
${filesList}

PREVIEW DAS MUDANÇAS (DIFF):
${diffPreview}

INSTRUÇÕES:
1. Gere uma mensagem de commit seguindo as convenções:
   - Use o formato: tipo(escopo): descrição
   - Tipos válidos: feat, fix, docs, style, refactor, test, chore
   - Mensagem deve ser em português
   - Máximo de 50 caracteres no título
   - Use presente do indicativo (ex: "adiciona", "corrige", "atualiza")

2. A mensagem deve ser clara e explicar O QUE foi feito, não COMO

3. Exemplos de boas mensagens:
   - feat(auth): adiciona autenticação via JWT
   - fix(api): corrige validação de entrada de dados
   - refactor(utils): simplifica função de formatação
   - docs(readme): atualiza instruções de instalação

Responda APENAS com a mensagem de commit, sem explicações adicionais.`;

  return prompt;
}

export function generatePRPrompt(changedFiles: FileChange[], diff: string, commitMessage: string): string {
  const prompt = `Baseado nas mudanças realizadas e na mensagem de commit, gere uma descrição de Pull Request em português:

MENSAGEM DE COMMIT:
${commitMessage}

MUDANÇAS REALIZADAS:
${changedFiles.map(file => `- ${file.file} (+${file.insertions}/-${file.deletions})`).join('\n')}

DIFF DAS MUDANÇAS:
${diff.split('\n').slice(0, 150).join('\n')}

INSTRUÇÕES:
1. Gere uma descrição clara e profissional
2. Inclua:
   - Resumo das mudanças
   - Motivação/contexto
   - Lista de alterações principais
   - Impacto esperado (se relevante)

3. Use formato markdown
4. Seja conciso mas informativo
5. Escreva em português

Responda apenas com a descrição do PR.`;

  return prompt;
} 