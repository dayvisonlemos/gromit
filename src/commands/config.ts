import chalk from 'chalk';
import { loadConfig, updateConfig, getConfigPath, hasConfig, removeConfig } from '../utils/config.js';

export interface ConfigOptions {
  url?: string;
  key?: string;
  show?: boolean;
  reset?: boolean;
}

export async function handleConfig(options: ConfigOptions): Promise<void> {
  try {
    // Mostrar configurações atuais
    if (options.show) {
      showConfig();
      return;
    }

    // Resetar configurações
    if (options.reset) {
      resetConfig();
      return;
    }

    // Atualizar configurações
    if (options.url || options.key) {
      updateConfiguration(options);
      return;
    }

    // Se nenhuma opção foi fornecida, mostrar ajuda
    showHelp();
  } catch (error) {
    console.error(chalk.red('Erro ao processar configuração:'), error);
    process.exit(1);
  }
}

function showConfig(): void {
  const config = loadConfig();
  const configPath = getConfigPath();

  console.log(chalk.blue.bold('📋 CONFIGURAÇÕES ATUAIS:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  if (hasConfig()) {
    console.log(`📍 Arquivo: ${chalk.gray(configPath)}`);
    console.log(`🔗 URL da IA: ${config.aiUrl ? chalk.cyan(config.aiUrl) : chalk.gray('não configurada')}`);
    console.log(`🔑 API Key: ${config.apiKey ? chalk.green('configurada') : chalk.gray('não configurada')}`);
    
    if (config.apiKey) {
      const maskedKey = config.apiKey.length > 8 
        ? config.apiKey.substring(0, 4) + '*'.repeat(config.apiKey.length - 8) + config.apiKey.substring(config.apiKey.length - 4)
        : '*'.repeat(config.apiKey.length);
      console.log(`   ${chalk.gray(`(${maskedKey})`)}`);
    }
  } else {
    console.log(chalk.yellow('Nenhuma configuração encontrada.'));
    console.log(chalk.gray(`Arquivo seria criado em: ${configPath}`));
  }
}

function updateConfiguration(options: ConfigOptions): void {
  const updates: any = {};
  
  if (options.url) {
    updates.aiUrl = options.url;
  }
  
  if (options.key) {
    updates.apiKey = options.key;
  }

  const config = updateConfig(updates);
  
  console.log(chalk.green.bold('✅ CONFIGURAÇÃO ATUALIZADA:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  if (options.url) {
    console.log(`🔗 URL da IA: ${chalk.cyan(config.aiUrl)}`);
  }
  
  if (options.key) {
    console.log(`🔑 API Key: ${chalk.green('configurada com sucesso')}`);
  }
  
  console.log(`📍 Salva em: ${chalk.gray(getConfigPath())}`);
}

function resetConfig(): void {
  if (hasConfig()) {
    removeConfig();
    console.log(chalk.green.bold('✅ CONFIGURAÇÕES RESETADAS'));
    console.log(chalk.gray('Arquivo de configuração removido com sucesso.'));
  } else {
    console.log(chalk.yellow('Nenhuma configuração encontrada para resetar.'));
  }
}

function showHelp(): void {
  console.log(chalk.blue.bold('🛠️  AJUDA - COMANDO CONFIG:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');
  console.log(chalk.yellow('Exemplos de uso:'));
  console.log('');
  console.log(`${chalk.cyan('gromit config --url')} https://api.openai.com/v1/chat/completions`);
  console.log(`${chalk.cyan('gromit config --key')} sk-sua-chave-da-api`);
  console.log(`${chalk.cyan('gromit config --url')} https://api.openai.com/v1/chat/completions ${chalk.cyan('--key')} sk-sua-chave`);
  console.log(`${chalk.cyan('gromit config --show')} ${chalk.gray('# mostrar configurações atuais')}`);
  console.log(`${chalk.cyan('gromit config --reset')} ${chalk.gray('# resetar todas as configurações')}`);
  console.log('');
  console.log(chalk.gray('As configurações são salvas em:'));
  console.log(chalk.gray(getConfigPath()));
} 