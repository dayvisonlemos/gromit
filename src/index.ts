#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeChanges } from './commands/analyze.js';
import { handleConfig } from './commands/config.js';
import { validateConfig } from './utils/config.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('gromit')
  .description('Ferramenta CLI para análise de mudanças git e geração de commits via IA')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analisa as mudanças no repositório git atual')
  .option('--show-prompt', 'Exibe o prompt gerado para a IA')
  .action(async (options) => {
    try {
      await analyzeChanges(options.showPrompt);
    } catch (error) {
      console.error(chalk.red('Erro ao analisar mudanças:'), error);
      process.exit(1);
    }
  });

program
  .command('commit')
  .description('Gera uma mensagem de commit baseada nas mudanças atuais')
  .action(async () => {
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

    console.log(chalk.yellow('Funcionalidade em desenvolvimento...'));
  });

program
  .command('config')
  .description('Configura URL da IA e chave da API')
  .option('--url <url>', 'URL da API da IA')
  .option('--key <key>', 'Chave da API da IA')
  .option('--show', 'Mostrar configurações atuais')
  .option('--reset', 'Resetar todas as configurações')
  .action(async (options) => {
    try {
      await handleConfig(options);
    } catch (error) {
      console.error(chalk.red('Erro ao processar configuração:'), error);
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse(); 