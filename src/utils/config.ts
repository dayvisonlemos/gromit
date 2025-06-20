import fs from 'fs';
import path from 'path';
import os from 'os';

export interface GromitConfig {
  aiUrl?: string;
  apiKey?: string;
  model?: string;
  language?: string;
}

const CONFIG_FILE_NAME = '.gromit.config';
const CONFIG_FILE_PATH = path.join(os.homedir(), CONFIG_FILE_NAME);

export function loadConfig(): GromitConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.warn('Erro ao carregar configuração:', error);
  }
  return {};
}

export function saveConfig(config: GromitConfig): void {
  try {
    const configData = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_FILE_PATH, configData, 'utf8');
  } catch (error) {
    throw new Error(`Erro ao salvar configuração: ${error}`);
  }
}

export function updateConfig(updates: Partial<GromitConfig>): GromitConfig {
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig);
  return newConfig;
}

export function getConfigPath(): string {
  return CONFIG_FILE_PATH;
}

export function hasConfig(): boolean {
  return fs.existsSync(CONFIG_FILE_PATH);
}

export function removeConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.unlinkSync(CONFIG_FILE_PATH);
    }
  } catch (error) {
    throw new Error(`Erro ao remover configuração: ${error}`);
  }
}

export function validateConfig(): { isValid: boolean; message?: string } {
  const config = loadConfig();

  if (!hasConfig()) {
    return {
      isValid: false,
      message: 'Nenhuma configuração encontrada. Use "gromit config" para configurar a IA.'
    };
  }

  if (!config.aiUrl) {
    return {
      isValid: false,
      message: 'URL da IA não configurada. Use "gromit config --url <url>" para configurar.'
    };
  }

  if (!config.apiKey) {
    return {
      isValid: false,
      message: 'API Key não configurada. Use "gromit config --key <key>" para configurar.'
    };
  }

  return { isValid: true };
}

export function requireConfig(): GromitConfig {
  const validation = validateConfig();

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  return loadConfig();
}
