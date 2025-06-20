import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import clipboardy from 'clipboardy';
import fs from 'fs';
import { generateCommitPrompt } from '../utils/promptGenerator.js';
import { validateConfig } from '../utils/config.js';

export interface FileChange {
  file: string;
  insertions: number;
  deletions: number;
  changes: number;
}

export async function analyzeChanges(showPrompt: boolean = false): Promise<void> {
  // Verifica se a configuração é válida antes de prosseguir
  const configValidation = validateConfig();
  if (!configValidation.isValid) {
    console.error(chalk.red('❌ Configuração necessária:'));
    console.error(chalk.yellow(configValidation.message));
    console.log('');
    console.log(chalk.blue('💡 Exemplos de configuração:'));
    console.log(`${chalk.cyan('gromit config --url')} https://api.openai.com/v1/chat/completions`);
    console.log(`${chalk.cyan('gromit config --key')} sk-sua-chave-da-api`);
    console.log(`${chalk.cyan('gromit config --show')} ${chalk.gray('# verificar configuração atual')}`);
    return;
  }

  const spinner = ora('Analisando mudanças no repositório...').start();
  
  try {
    const git = simpleGit();
    
    // Verifica se estamos em um repositório git
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      spinner.fail('Este diretório não é um repositório git válido');
      return;
    }

    // Obtém o status dos arquivos
    const status = await git.status();
    
    if (status.files.length === 0) {
      spinner.succeed('Não há mudanças para analisar');
      return;
    }

    spinner.text = 'Obtendo diferenças dos arquivos...';
    
    // Obtém o diff dos arquivos modificados
    const diff = await git.diff(['--staged']);
    const diffStats = await git.diffSummary(['--staged']);
    
    // Se não há arquivos staged, verifica working directory
    let finalDiff = diff;
    let finalStats = diffStats;
    
    if (!diff) {
      finalDiff = await git.diff();
      finalStats = await git.diffSummary();
    }

    spinner.succeed('Análise concluída!');
    
    // Exibe informações dos arquivos modificados
    console.log(chalk.blue.bold('\n📁 ARQUIVOS MODIFICADOS:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const changedFiles: FileChange[] = [];
    
    status.files.forEach((file) => {
      const fileStats = finalStats.files.find(f => f.file === file.path);
      const insertions = (fileStats && 'insertions' in fileStats) ? fileStats.insertions : 0;
      const deletions = (fileStats && 'deletions' in fileStats) ? fileStats.deletions : 0;
      
      const changes: FileChange = {
        file: file.path,
        insertions,
        deletions,
        changes: insertions + deletions
      };
      
      changedFiles.push(changes);
      
      let statusIcon = '';
      let statusColor = chalk.white;
      
      switch (file.index || file.working_dir) {
        case 'M':
          statusIcon = '📝';
          statusColor = chalk.yellow;
          break;
        case 'A':
          statusIcon = '➕';
          statusColor = chalk.green;
          break;
        case 'D':
          statusIcon = '❌';
          statusColor = chalk.red;
          break;
        case 'R':
          statusIcon = '🔄';
          statusColor = chalk.blue;
          break;
        default:
          statusIcon = '📄';
      }
      
      console.log(`${statusIcon} ${statusColor(file.path)}`);
      if (changes.changes > 0) {
        console.log(`   ${chalk.green(`+${changes.insertions}`)} ${chalk.red(`-${changes.deletions}`)} linhas alteradas`);
      }
    });
    
    // Resumo das mudanças
    const totalInsertions = changedFiles.reduce((sum, file) => sum + file.insertions, 0);
    const totalDeletions = changedFiles.reduce((sum, file) => sum + file.deletions, 0);
    const totalChanges = totalInsertions + totalDeletions;
    
    console.log(chalk.blue.bold('\n📊 RESUMO DAS MUDANÇAS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`📂 Arquivos modificados: ${chalk.bold(changedFiles.length)}`);
    console.log(`📈 Total de linhas alteradas: ${chalk.bold(totalChanges)}`);
    console.log(`${chalk.green(`➕ Inserções: ${totalInsertions}`)}`);
    console.log(`${chalk.red(`➖ Deleções: ${totalDeletions}`)}`);
    
    // Exibe diff das mudanças (limitado para não ser muito verboso)
    if (finalDiff && finalDiff.length > 0) {
      console.log(chalk.blue.bold('\n🔍 PREVIEW DAS MUDANÇAS:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const diffLines = finalDiff.split('\n');
      const previewLines = diffLines.slice(0, 50); // Limita a 50 linhas para preview
      
      previewLines.forEach((line) => {
        if (line.startsWith('+++') || line.startsWith('---')) {
          console.log(chalk.bold(line));
        } else if (line.startsWith('+')) {
          console.log(chalk.green(line));
        } else if (line.startsWith('-')) {
          console.log(chalk.red(line));
        } else if (line.startsWith('@@')) {
          console.log(chalk.cyan(line));
        } else {
          console.log(chalk.gray(line));
        }
      });
      
      if (diffLines.length > 50) {
        console.log(chalk.yellow(`\n... e mais ${diffLines.length - 50} linhas`));
      }
    }
    
    // Gera prompt para IA
    const prompt = generateCommitPrompt(changedFiles, finalDiff);
    
    // Copia o prompt para o clipboard automaticamente
    try {
      await clipboardy.write(prompt);
      console.log(chalk.green.bold('\n📋 PROMPT COPIADO PARA O CLIPBOARD!'));
      console.log(chalk.gray('Cole o prompt em sua IA favorita para gerar a mensagem de commit.'));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Não foi possível copiar para o clipboard:'), error);
    }
    
    // Exibe o prompt apenas se solicitado
    if (showPrompt) {
      console.log(chalk.blue.bold('\n🤖 PROMPT PARA IA:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.cyan(prompt));
    }
    
  } catch (error) {
    spinner.fail(`Erro ao analisar repositório: ${error}`);
    throw error;
  }
}

export async function analyzeForPush(): Promise<void> {
  const spinner = ora('Analisando mudanças para Push/Pull Request...').start();
  
  try {
    const git = simpleGit();
    
    // Verifica se estamos em um repositório git
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      spinner.fail('Este diretório não é um repositório git válido');
      return;
    }

    // Verifica se existe remote origin
    spinner.text = 'Verificando remote origin...';
    let hasRemote = true;
    let remoteBranch = '';
    
    try {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');
      
      if (!origin) {
        hasRemote = false;
      } else {
        // Obtém a branch atual
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
        remoteBranch = `origin/${currentBranch.trim()}`;
        
        // Verifica se a branch remota existe
        try {
          await git.revparse([remoteBranch]);
        } catch {
          hasRemote = false;
          remoteBranch = 'origin/master'; // fallback para master
          try {
            await git.revparse([remoteBranch]);
            hasRemote = true;
          } catch {
            remoteBranch = 'origin/main'; // fallback para main  
            try {
              await git.revparse([remoteBranch]);
              hasRemote = true;
            } catch {
              hasRemote = false;
            }
          }
        }
      }
    } catch (error) {
      hasRemote = false;
    }

    if (!hasRemote) {
      spinner.fail('Nenhum remote origin configurado');
      console.log(chalk.yellow('\n⚠️  NENHUM REMOTE CONFIGURADO'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('💡 Este repositório não tem remote origin configurado.'));
      console.log('');
      console.log(chalk.cyan('Para adicionar um remote:'));
      console.log(`${chalk.green('git remote add origin')} <URL_DO_REPOSITORIO>`);
      return;
    }

    // Verifica se há mudanças não commitadas
    spinner.text = 'Verificando mudanças pendentes...';
    const status = await git.status();
    
    if (status.files.length > 0) {
      spinner.fail('Existem mudanças não commitadas');
      console.log(chalk.red.bold('\n🚫 MUDANÇAS NÃO COMMITADAS DETECTADAS'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Lista os arquivos modificados
      status.files.forEach((file) => {
        const icon = getFileIcon(file.path);
        let statusIcon = '';
        
        if (file.index === 'M' || file.working_dir === 'M') statusIcon = '📝';
        else if (file.index === 'A' || file.working_dir === 'A') statusIcon = '➕';
        else if (file.index === 'D' || file.working_dir === 'D') statusIcon = '➖';
        else if (file.index === '?' || file.working_dir === '?') statusIcon = '❓';
        else statusIcon = '📄';
        
        console.log(`${statusIcon} ${icon} ${chalk.yellow(file.path)}`);
      });
      
      console.log(chalk.blue.bold('\n💡 VOCÊ PRECISA COMMITÁ-LAS PRIMEIRO:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.cyan('gromit commit')} ${chalk.gray('# commit automático com IA')}`);
      console.log(`${chalk.cyan('git add . && git commit -m "mensagem"')} ${chalk.gray('# commit manual')}`);
      return;
    }

    // Obtém commits locais que não estão no remote
    spinner.text = 'Comparando com remote...';
    const pendingCommits = await git.log([`${remoteBranch}..HEAD`]);
    
    if (pendingCommits.total === 0) {
      spinner.succeed('Verificação concluída!');
      console.log(chalk.green('\n✅ NENHUM COMMIT PENDENTE PARA PUSH'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('🎉 Todos os commits já foram enviados para o remote.'));
      console.log(chalk.gray(`   Remote: ${remoteBranch}`));
      return;
    }

    spinner.succeed('Análise concluída!');

    // Obtém estatísticas das mudanças
    const diffStats = await git.diffSummary([`${remoteBranch}..HEAD`]);
    
    const currentBranch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
    
    // Gera prompt baseado nas mudanças
    const prPrompt = await generatePullRequestPrompt(git, pendingCommits, diffStats, remoteBranch, currentBranch, true);
    
    // Copia para clipboard
    await clipboardy.write(prPrompt);
    
    console.log(chalk.green.bold('\n📝 PROMPT PARA PULL REQUEST GERADO!'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('✅ Prompt copiado para o clipboard!'));
    console.log('');
    
    // Exibe resumo das informações utilizadas
    console.log(chalk.cyan.bold('📊 INFORMAÇÕES ANALISADAS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`📋 Branch atual: ${chalk.yellow(currentBranch)}`);
    console.log(`🎯 Branch destino: ${chalk.yellow(remoteBranch.replace('origin/', ''))}`);
    console.log(`📦 Commits pendentes: ${chalk.cyan(pendingCommits.total)}`);
    console.log(`📂 Arquivos modificados: ${chalk.cyan(diffStats.files.length)}`);
    console.log(`➕ Linhas adicionadas: ${chalk.green(diffStats.insertions)}`);
    console.log(`➖ Linhas removidas: ${chalk.red(diffStats.deletions)}`);
    
    console.log(chalk.blue.bold('\n🎯 PRÓXIMOS PASSOS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('1. Cole o prompt na sua IA preferida (ChatGPT, Claude, etc.)');
    console.log('2. A IA gerará o título e descrição do PR');
    console.log('3. Use o resultado ao criar o Pull Request no GitHub/GitLab');
    console.log('');
    console.log(chalk.yellow('💡 O prompt foi copiado automaticamente para o clipboard!'));
    
  } catch (error) {
    spinner.fail(`Erro ao analisar mudanças para push: ${error}`);
    throw error;
  }
}

function getFileIcon(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts': case 'tsx': return '🟦';
    case 'js': case 'jsx': return '🟨';
    case 'json': return '📋';
    case 'md': return '📝';
    case 'yml': case 'yaml': return '⚙️';
    case 'css': case 'scss': case 'sass': return '🎨';
    case 'html': return '🌐';
    case 'py': return '🐍';
    case 'java': return '☕';
    case 'go': return '🐹';
    case 'rs': return '🦀';
    case 'php': return '🐘';
    default: return '📄';
  }
}

async function generatePullRequestPrompt(
  git: any, 
  pendingCommits: any, 
  diffStats: any, 
  remoteBranch: string, 
  currentBranch: string, 
  includeDiff: boolean = false
): Promise<string> {
  try {
    // Lê o template de PR se existir
    let template = '';
    const templatePath = '.github/pull_request_template.md';
    
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Template padrão se não existir
      template = `#### Cenário
- Faça uma breve descrição sobre o cenário no qual é aplicado o contexto.

#### Problema
- Faça uma breve explanação sobre o que a sua alteração está resolvendo.

#### Solução
- Escreva o que foi feito para resolver o problema descrito acima.`;
    }

    // Constrói informações dos commits
    const commitsList = [...pendingCommits.all].reverse().map((commit: any, index: number) => {
      const shortHash = commit.hash.substring(0, 7);
      const message = commit.message.split('\n')[0];
      const author = commit.author_name;
      const date = new Date(commit.date).toLocaleDateString('pt-BR');
      return `${index + 1}. ${shortHash} - ${message} (por ${author} em ${date})`;
    }).join('\n');

    // Constrói lista de arquivos modificados
    const filesList = diffStats.files.map((file: any) => {
      const insertions = 'insertions' in file ? file.insertions : 0;
      const deletions = 'deletions' in file ? file.deletions : 0;
      return `- ${file.file} (+${insertions} -${deletions} linhas)`;
    }).join('\n');

    // Obtém diff se solicitado
    let diffContent = '';
    if (includeDiff) {
      try {
        const diff = await git.diff([`${remoteBranch}..HEAD`]);
        const diffLines = diff.split('\n');
        const maxLines = 100; // Mais linhas para o contexto da IA
        
        if (diffLines.length > maxLines) {
          diffContent = diffLines.slice(0, maxLines).join('\n') + 
            `\n... (${diffLines.length - maxLines} linhas restantes omitidas)`;
        } else {
          diffContent = diff;
        }
      } catch (error) {
        diffContent = 'Erro ao obter diff detalhado.';
      }
    }

    // Monta o prompt
    const prompt = `Atue como especialista em desenvolvimento de software. Com base nas informações abaixo sobre mudanças em um repositório git, crie um título conciso e uma descrição detalhada para um Pull Request seguindo o template fornecido.

**INFORMAÇÕES DO PULL REQUEST:**
- Branch atual: ${currentBranch}
- Branch de destino: ${remoteBranch.replace('origin/', '')}
- Total de commits: ${pendingCommits.total}
- Arquivos modificados: ${diffStats.files.length}
- Linhas adicionadas: ${diffStats.insertions}
- Linhas removidas: ${diffStats.deletions}

**COMMITS INCLUÍDOS:**
${commitsList}

**ARQUIVOS MODIFICADOS:**
${filesList}

${includeDiff && diffContent ? `**DIFERENÇAS (DIFF):**
\`\`\`diff
${diffContent}
\`\`\`

` : ''}**TEMPLATE DO PULL REQUEST:**
${template}

**INSTRUÇÕES:**
1. Crie um título conciso e descritivo para o PR (máximo 60 caracteres)
2. Preencha a descrição seguindo exatamente a estrutura do template fornecido
3. Base-se nas informações dos commits e arquivos modificados
4. Use linguagem clara e objetiva
5. Foque no valor de negócio e no impacto da mudança
6. Responda em português brasileiro

**FORMATO DA RESPOSTA:**
Título: [seu título aqui]

Descrição:
[sua descrição aqui seguindo o template]`;

    return prompt;
    
  } catch (error) {
    throw new Error(`Erro ao gerar prompt do PR: ${error}`);
  }
} 