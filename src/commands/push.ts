import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { generateCommitPrompt, generatePRPrompt } from '../utils/promptGenerator.js';
import { generateCommitMessage, generatePRDescription } from '../utils/aiClient.js';
import { validateConfig } from '../utils/config.js';
import { FileChange } from './analyze.js';
import clipboardy from 'clipboardy';

export async function pushChanges(): Promise<void> {
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
      spinner.succeed('Não há mudanças para comitar e fazer push');
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

    // Gera prompt para IA (commit)
    const commitPrompt = generateCommitPrompt(changedFiles, diff);
    
    // Consulta a IA para gerar mensagem de commit
    const commitMessage = await generateCommitMessage(commitPrompt);
    
    if (!commitMessage) {
      console.error(chalk.red('❌ Não foi possível gerar mensagem de commit'));
      return;
    }

    // Exibe a mensagem de commit gerada
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
    } catch (error) {
      commitSpinner.fail(`Erro ao fazer commit: ${error}`);
      return;
    }

    // Faz o push
    const pushSpinner = ora('Fazendo push para o repositório remoto...').start();
    try {
      await git.push();
      pushSpinner.succeed('Push realizado com sucesso!');
    } catch (error) {
      pushSpinner.fail(`Erro ao fazer push: ${error}`);
      return;
    }

    // Verifica se existe template de PR
    const prTemplate = findPRTemplate();
    
    // Gera descrição de PR
    const prSpinner = ora('Gerando descrição de PR via IA...').start();
    try {
      const prPrompt = generatePRPrompt(changedFiles, diff, prTemplate);
      const prDescription = await generatePRDescription(prPrompt);
      
      if (prDescription) {
        prSpinner.succeed('Descrição de PR gerada!');
        
        // Copia para clipboard
        try {
          await clipboardy.write(prDescription);
          console.log(chalk.green('📋 Descrição de PR copiada para o clipboard!'));
        } catch (error) {
          console.log(chalk.yellow('⚠️  Não foi possível copiar para o clipboard'));
        }
        
        // Exibe a descrição gerada
        console.log(chalk.magenta.bold('\n📝 DESCRIÇÃO DE PR GERADA:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.white(prDescription));
        
      } else {
        prSpinner.fail('Não foi possível gerar descrição de PR');
      }
    } catch (error) {
      prSpinner.fail(`Erro ao gerar descrição de PR: ${error}`);
    }

    // Resumo final
    console.log(chalk.green.bold('\n🎉 PROCESSO CONCLUÍDO!'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`📝 Commit: ${chalk.cyan(commitMessage)}`);
    console.log(`📂 Arquivos: ${changedFiles.length}`);
    console.log(`📈 Mudanças: ${totalChanges} linhas`);
    console.log(`🚀 Push: ${chalk.green('realizado')}`);
    console.log(`📄 Descrição PR: ${chalk.magenta('gerada e copiada')}`);
    
  } catch (error) {
    spinner.fail(`Erro ao processar push: ${error}`);
    throw error;
  }
}

function findPRTemplate(): string | null {
  const possiblePaths = [
    '.github/pull_request_template.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/pull_request_template.txt',
    '.github/PULL_REQUEST_TEMPLATE.txt',
    'docs/pull_request_template.md',
    'docs/PULL_REQUEST_TEMPLATE.md',
    'pull_request_template.md',
    'PULL_REQUEST_TEMPLATE.md'
  ];
  
  for (const templatePath of possiblePaths) {
    try {
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf-8');
        return content;
      }
    } catch (error) {
      // Continue procurando outros templates
    }
  }
  
  return null;
} 