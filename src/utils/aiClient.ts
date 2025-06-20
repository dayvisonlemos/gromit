import { requireConfig } from './config.js';
import chalk from 'chalk';

export interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendPromptToAI(prompt: string): Promise<AIResponse> {
  try {
    const config = requireConfig();

    // Usa o modelo configurado ou padrão
    const model = config.model || 'gpt-4.1';

    // Corpo da requisição para APIs compatíveis com OpenAI
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100, // Limitado pois queremos apenas a mensagem de commit
      temperature: 0.3 // Baixa temperatura para respostas mais consistentes
    };

    console.log(chalk.blue('🤖 Enviando prompt para IA...'));

    const response = await fetch(config.aiUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Erro da API (${response.status}): ${errorText}`
      };
    }

    const data = (await response.json()) as any;

    // Extrai a mensagem da resposta
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiMessage = data.choices[0].message.content.trim();
      return {
        success: true,
        message: aiMessage
      };
    } else {
      return {
        success: false,
        error: 'Formato de resposta inválido da IA'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão: ${error}`
    };
  }
}

export async function generateCommitMessage(prompt: string): Promise<string | null> {
  console.log(chalk.cyan('🔄 Gerando mensagem de commit via IA...'));

  const response = await sendPromptToAI(prompt);

  if (response.success && response.message) {
    console.log(chalk.green('✅ Mensagem de commit gerada com sucesso!'));
    return response.message;
  } else {
    console.error(chalk.red('❌ Erro ao gerar mensagem de commit:'));
    console.error(chalk.yellow(response.error || 'Erro desconhecido'));
    return null;
  }
}
