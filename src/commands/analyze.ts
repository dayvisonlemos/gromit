import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import clipboardy from 'clipboardy';
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
    } else {
      console.log(chalk.blue.bold('\n💡 DICA:'));
      console.log(`Use ${chalk.cyan('gromit analyze --show-prompt')} para ver o prompt completo.`);
    }
    
  } catch (error) {
    spinner.fail(`Erro ao analisar repositório: ${error}`);
    throw error;
  }
} 