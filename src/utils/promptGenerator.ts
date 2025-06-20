import { FileChange } from '../commands/analyze.js';
import { loadConfig } from './config.js';

interface Instructions {
  header: string;
  guidelines: string;
  examples: string;
  footer: string;
}

function getInstructionsByLanguage(language: string): Instructions {
  if (language === 'pt-BR') {
    return {
      header: "Por favor, gere uma mensagem de commit concisa e descritiva baseada nas seguintes mudanças:",
      guidelines: `INSTRUÇÕES:
1. Gere uma mensagem de commit seguindo as convenções:
   - Use o formato: tipo(escopo): descrição
   - Tipos válidos: feat, fix, docs, style, refactor, test, chore
   - Mensagem deve ser em português
   - Máximo de 50 caracteres no título
   - Use presente do indicativo (ex: "adiciona", "corrige", "atualiza")

2. A mensagem deve ser clara e explicar O QUE foi feito, não COMO`,
      examples: `3. Exemplos de boas mensagens:
   - feat(auth): adiciona autenticação via JWT
   - fix(api): corrige validação de entrada de dados
   - refactor(utils): simplifica função de formatação
   - docs(readme): atualiza instruções de instalação`,
      footer: "Responda APENAS com a mensagem de commit, sem explicações adicionais."
    };
  } else if (language.startsWith('es')) {
    // Spanish (supports es, es-ES, es-UY, es-AR, etc.)
    return {
      header: "Por favor, genera un mensaje de commit conciso y descriptivo basado en los siguientes cambios:",
      guidelines: `INSTRUCCIONES:
1. Genera un mensaje de commit siguiendo las convenciones:
   - Usa el formato: tipo(alcance): descripción
   - Tipos válidos: feat, fix, docs, style, refactor, test, chore
   - El mensaje debe estar en español
   - Máximo 50 caracteres para el título
   - Usa presente de indicativo (ej: "añade", "corrige", "actualiza")

2. El mensaje debe ser claro y explicar QUÉ se hizo, no CÓMO`,
      examples: `3. Ejemplos de buenos mensajes:
   - feat(auth): añade autenticación via JWT
   - fix(api): corrige validación de datos de entrada
   - refactor(utils): simplifica función de formato
   - docs(readme): actualiza instrucciones de instalación`,
      footer: "Responde ÚNICAMENTE con el mensaje de commit, sin explicaciones adicionales."
    };
  } else {
    // Default: English
    return {
      header: "Please generate a concise and descriptive commit message based on the following changes:",
      guidelines: `INSTRUCTIONS:
1. Generate a commit message following conventions:
   - Use format: type(scope): description
   - Valid types: feat, fix, docs, style, refactor, test, chore
   - Message should be in English
   - Maximum 50 characters for the title
   - Use imperative mood (e.g., "add", "fix", "update")

2. The message should be clear and explain WHAT was done, not HOW`,
      examples: `3. Examples of good messages:
   - feat(auth): add JWT authentication
   - fix(api): correct input data validation
   - refactor(utils): simplify format function
   - docs(readme): update installation instructions`,
      footer: "Respond ONLY with the commit message, no additional explanations."
    };
  }
}

export function generateCommitPrompt(changedFiles: FileChange[], diff: string): string {
  const config = loadConfig();
  const language = config.language || 'en-US';
  const totalFiles = changedFiles.length;
  const totalInsertions = changedFiles.reduce((sum, file) => sum + file.insertions, 0);
  const totalDeletions = changedFiles.reduce((sum, file) => sum + file.deletions, 0);
  
  // Lista dos arquivos modificados
  const filesList = changedFiles.map(file => 
    `- ${file.file} (+${file.insertions}/-${file.deletions})`
  ).join('\n');
  
  // Pega um preview limitado do diff para não sobrecarregar a IA
  const diffPreview = diff.split('\n').slice(0, 100).join('\n');
  
  // Define instruções baseadas na linguagem
  const instructions = getInstructionsByLanguage(language);
  
  const prompt = `${instructions.header}

RESUMO DAS MUDANÇAS:
- Arquivos modificados: ${totalFiles}
- Linhas inseridas: ${totalInsertions}
- Linhas removidas: ${totalDeletions}

ARQUIVOS ALTERADOS:
${filesList}

PREVIEW DAS MUDANÇAS (DIFF):
${diffPreview}

${instructions.guidelines}

${instructions.examples}

${instructions.footer}`;

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