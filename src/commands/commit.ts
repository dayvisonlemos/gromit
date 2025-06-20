import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import { generateCommitPrompt } from '../utils/promptGenerator.js';
import { generateCommitMessage } from '../utils/aiClient.js';
import { validateConfig } from '../utils/config.js';
import { FileChange } from './analyze.js';

export async function commitChanges(): Promise<void> {
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
      spinner.succeed('Não há mudanças para comitar');
      return;
    }

    spinner.text = 'Obtendo diferenças dos arquivos...';
    
    // Obtém o diff dos arquivos modificados (working directory)
    const diff = await git.diff();
    const diffStats = await git.diffSummary();

    if (!diff) {
      spinner.fail('Não há mudanças para analisar');
      return;
    }

    spinner.succeed('Análise concluída!');
    
    // Processa arquivos modificados
    const changedFiles: FileChange[] = [];
    
    status.files.forEach((file) => {
      const fileStats = diffStats.files.find(f => f.file === file.path);
      const insertions = (fileStats && 'insertions' in fileStats) ? fileStats.insertions : 0;
      const deletions = (fileStats && 'deletions' in fileStats) ? fileStats.deletions : 0;
      
      const changes: FileChange = {
        file: file.path,
        insertions,
        deletions,
        changes: insertions + deletions
      };
      
      changedFiles.push(changes);
    });

    // Mostra resumo das mudanças
    console.log(chalk.blue.bold('\n📁 ARQUIVOS A SEREM COMMITADOS:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    changedFiles.forEach((change) => {
      console.log(`📄 ${chalk.yellow(change.file)}`);
      if (change.changes > 0) {
        console.log(`   ${chalk.green(`+${change.insertions}`)} ${chalk.red(`-${change.deletions}`)} linhas alteradas`);
      }
    });

    const totalChanges = changedFiles.reduce((sum, file) => sum + file.changes, 0);
    console.log(chalk.blue.bold(`\n📊 Total: ${changedFiles.length} arquivos, ${totalChanges} linhas alteradas`));

    // Gera prompt para IA
    const prompt = generateCommitPrompt(changedFiles, diff);
    
    // Consulta a IA para gerar mensagem de commit
    const commitMessage = await generateCommitMessage(prompt);
    
    if (!commitMessage) {
      console.error(chalk.red('❌ Não foi possível gerar mensagem de commit'));
      return;
    }

    // Exibe a mensagem gerada
    console.log(chalk.green.bold('\n💬 MENSAGEM DE COMMIT GERADA:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan(commitMessage));

    // Pergunta se o usuário quer prosseguir
    console.log(chalk.yellow('\n⚠️  Pressione Enter para continuar ou Ctrl+C para cancelar...'));
    
    // Adiciona todos os arquivos
    const addSpinner = ora('Adicionando arquivos ao stage...').start();
    try {
      await git.add('.');
      addSpinner.succeed('Arquivos adicionados ao stage');
    } catch (error) {
      addSpinner.fail(`Erro ao adicionar arquivos: ${error}`);
      return;
    }

    // Faz o commit
    const commitSpinner = ora('Fazendo commit...').start();
    try {
      await git.commit(commitMessage);
      commitSpinner.succeed('Commit realizado com sucesso!');
      
      console.log(chalk.green.bold('\n🎉 COMMIT CONCLUÍDO!'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`📝 Mensagem: ${chalk.cyan(commitMessage)}`);
      console.log(`📂 Arquivos: ${changedFiles.length}`);
      console.log(`📈 Mudanças: ${totalChanges} linhas`);
      
    } catch (error) {
      commitSpinner.fail(`Erro ao fazer commit: ${error}`);
      return;
    }
    
  } catch (error) {
    spinner.fail(`Erro ao processar commit: ${error}`);
    throw error;
  }
} 