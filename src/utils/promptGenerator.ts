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

export function generatePRPrompt(changedFiles: FileChange[], diff: string, prTemplate: string | null): string {
  const config = loadConfig();
  const language = config.language || 'en-US';
  
  const filesList = changedFiles.map(file => 
    `- ${file.file} (+${file.insertions}/-${file.deletions})`
  ).join('\n');
  
  const diffPreview = diff.split('\n').slice(0, 150).join('\n');
  
  let prompt = '';
  
  if (prTemplate) {
    // Se existe template, usa o template como base
    if (language === 'pt-BR') {
      prompt = `Baseado no template de Pull Request e nas mudanças realizadas, gere uma descrição de PR em português:

TEMPLATE DE PR:
${prTemplate}

MUDANÇAS REALIZADAS:
${filesList}

DIFF DAS MUDANÇAS:
${diffPreview}

INSTRUÇÕES:
1. Use o template como estrutura base
2. Preencha as seções do template com informações relevantes das mudanças
3. Seja específico e técnico onde necessário
4. Use formato markdown
5. Escreva em português
6. Substitua placeholders como "Item 1", "Item 2" com informações reais

Responda apenas com a descrição do PR preenchida.`;
    } else if (language.startsWith('es')) {
      prompt = `Basado en el template de Pull Request y los cambios realizados, genera una descripción de PR en español:

TEMPLATE DE PR:
${prTemplate}

CAMBIOS REALIZADOS:
${filesList}

DIFF DE LOS CAMBIOS:
${diffPreview}

INSTRUCCIONES:
1. Usa el template como estructura base
2. Completa las secciones del template con información relevante de los cambios
3. Sé específico y técnico donde sea necesario
4. Usa formato markdown
5. Escribe en español
6. Reemplaza placeholders como "Item 1", "Item 2" con información real

Responde únicamente con la descripción del PR completada.`;
    } else {
      prompt = `Based on the Pull Request template and the changes made, generate a PR description in English:

PR TEMPLATE:
${prTemplate}

CHANGES MADE:
${filesList}

DIFF OF CHANGES:
${diffPreview}

INSTRUCTIONS:
1. Use the template as base structure
2. Fill the template sections with relevant information from the changes
3. Be specific and technical where necessary
4. Use markdown format
5. Write in English
6. Replace placeholders like "Item 1", "Item 2" with real information

Respond only with the filled PR description.`;
    }
  } else {
    // Se não existe template, usa o padrão Cenário, Problema, Solução
    if (language === 'pt-BR') {
      prompt = `Baseado nas mudanças realizadas, gere uma descrição de Pull Request em português usando o formato Cenário, Problema, Solução:

MUDANÇAS REALIZADAS:
${filesList}

DIFF DAS MUDANÇAS:
${diffPreview}

INSTRUÇÕES:
1. Use o formato:
   #### Cenário
   - Descreva o contexto/situação atual
   
   #### Problema
   - Explique o problema que estava sendo resolvido
   
   #### Solução
   - Descreva como o problema foi resolvido

2. Seja específico e técnico
3. Use formato markdown
4. Escreva em português
5. Base-se nas mudanças do código para inferir contexto

Responda apenas com a descrição do PR.`;
    } else if (language.startsWith('es')) {
      prompt = `Basado en los cambios realizados, genera una descripción de Pull Request en español usando el formato Escenario, Problema, Solución:

CAMBIOS REALIZADOS:
${filesList}

DIFF DE LOS CAMBIOS:
${diffPreview}

INSTRUCCIONES:
1. Usa el formato:
   #### Escenario
   - Describe el contexto/situación actual
   
   #### Problema
   - Explica el problema que se estaba resolviendo
   
   #### Solución
   - Describe cómo se resolvió el problema

2. Sé específico y técnico
3. Usa formato markdown
4. Escribe en español
5. Basáte en los cambios del código para inferir contexto

Responde únicamente con la descripción del PR.`;
    } else {
      prompt = `Based on the changes made, generate a Pull Request description in English using the Scenario, Problem, Solution format:

CHANGES MADE:
${filesList}

DIFF OF CHANGES:
${diffPreview}

INSTRUCTIONS:
1. Use the format:
   #### Scenario
   - Describe the current context/situation
   
   #### Problem
   - Explain the problem that was being solved
   
   #### Solution
   - Describe how the problem was solved

2. Be specific and technical
3. Use markdown format
4. Write in English
5. Base on code changes to infer context

Respond only with the PR description.`;
    }
  }
  
  return prompt;
} 