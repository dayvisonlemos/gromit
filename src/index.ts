#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeChanges, analyzeForPush } from './commands/analyze.js';
import { commitChanges } from './commands/commit.js';
import { handleConfig } from './commands/config.js';
import { reviewChanges } from './commands/review.js';
import { pushChanges } from './commands/push.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('gromit')
  .description('Ferramenta CLI para análise de mudanças git e geração de commits via IA')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analisa mudanças no repositório git para diferentes propósitos')
  .option('--commit', 'Analisa mudanças locais para commit (padrão)')
  .option('--push', 'Gera prompt para IA criar título e descrição do Pull Request')
  .option('--show-prompt', 'Exibe o prompt gerado para a IA (apenas com --commit)')
  .action(async (options) => {
    try {
      // Se nenhuma opção específica, usa --commit como padrão
      if (!options.commit && !options.push) {
        options.commit = true;
      }
      
      if (options.push) {
        await analyzeForPush();
      } else {
        await analyzeChanges(options.showPrompt);
      }
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
  .command('review')
  .description('Revisa commits locais pendentes antes do push')
  .option('--show-diff', 'Exibe o preview das mudanças')
  .action(async (options) => {
    try {
      await reviewChanges(options.showDiff);
    } catch (error) {
      console.error(chalk.red('Erro ao revisar mudanças:'), error);
      process.exit(1);
    }
  });

program
  .command('push')
  .description('Push completo com geração automática de Pull Request via IA')
  .option('--force', 'Ignora mudanças não commitadas e prossegue')
  .option('--show-diff', 'Exibe o preview detalhado das mudanças (diff)')
  .action(async (options) => {
    try {
      await pushChanges(options.force, options.showDiff);
    } catch (error) {
      console.error(chalk.red('Erro ao fazer push:'), error);
      process.exit(1);
    }
  });



program
  .command('config')
  .description('Configura URL da IA, chave da API, modelo e linguagem')
  .option('--url <url>', 'URL da API da IA')
  .option('--key <key>', 'Chave da API da IA')
  .option('--model <model>', 'Modelo da IA (ex: gpt-4-turbo, gpt-3.5-turbo)')
  .option('--language <language>', 'Linguagem dos commits (ex: pt-BR, en)')
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