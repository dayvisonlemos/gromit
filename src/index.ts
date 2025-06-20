#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeChanges } from './commands/analyze.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('gromit')
  .description('Ferramenta CLI para análise de mudanças git e geração de commits via IA')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analisa as mudanças no repositório git atual')
  .action(async () => {
    try {
      await analyzeChanges();
    } catch (error) {
      console.error(chalk.red('Erro ao analisar mudanças:'), error);
      process.exit(1);
    }
  });

program
  .command('commit')
  .description('Gera uma mensagem de commit baseada nas mudanças atuais')
  .action(async () => {
    console.log(chalk.yellow('Funcionalidade em desenvolvimento...'));
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse(); 