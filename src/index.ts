#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeChanges } from './commands/analyze.js';
import { commitChanges } from './commands/commit.js';
import { handleConfig } from './commands/config.js';
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
  .description('Gera uma mensagem de commit via IA e faz o commit automaticamente')
  .action(async () => {
    try {
      await commitChanges();
    } catch (error) {
      console.error(chalk.red('Erro ao fazer commit:'), error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Configura URL da IA, chave da API e modelo')
  .option('--url <url>', 'URL da API da IA')
  .option('--key <key>', 'Chave da API da IA')
  .option('--model <model>', 'Modelo da IA (ex: gpt-4-turbo, gpt-3.5-turbo)')
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