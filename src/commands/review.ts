import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export async function reviewChanges(showDiff: boolean = false): Promise<void> {
  const spinner = ora('Analisando commits locais...').start();
  
  try {
    const git = simpleGit();
    
    // Verifica se estamos em um repositório git
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      spinner.fail('Este diretório não é um repositório git válido');
      return;
    }

    // Verifica se existe remote origin
    spinner.text = 'Verificando remote origin...';
    let hasRemote = true;
    let remoteBranch = '';
    
    try {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');
      
      if (!origin) {
        hasRemote = false;
      } else {
        // Obtém a branch atual
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
        remoteBranch = `origin/${currentBranch.trim()}`;
        
        // Verifica se a branch remota existe
        try {
          await git.revparse([remoteBranch]);
        } catch {
          hasRemote = false;
          remoteBranch = 'origin/master'; // fallback para master
          try {
            await git.revparse([remoteBranch]);
            hasRemote = true;
          } catch {
            remoteBranch = 'origin/main'; // fallback para main  
            try {
              await git.revparse([remoteBranch]);
              hasRemote = true;
            } catch {
              hasRemote = false;
            }
          }
        }
      }
    } catch (error) {
      hasRemote = false;
    }

    if (!hasRemote) {
      spinner.succeed('Análise concluída!');
      console.log(chalk.yellow('\n⚠️  NENHUM REMOTE CONFIGURADO'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('💡 Este repositório não tem remote origin configurado.'));
      console.log(chalk.blue('   Todos os commits são considerados locais.'));
      console.log('');
      console.log(chalk.cyan('Para adicionar um remote:'));
      console.log(`${chalk.green('git remote add origin')} <URL_DO_REPOSITORIO>`);
      return;
    }

    // Obtém commits locais que não estão no remote
    spinner.text = 'Comparando com remote...';
    const pendingCommits = await git.log([`${remoteBranch}..HEAD`]);
    
    if (pendingCommits.total === 0) {
      spinner.succeed('Análise concluída!');
      console.log(chalk.green('\n✅ NENHUM COMMIT PENDENTE'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('🎉 Todos os commits já foram enviados para o remote.'));
      console.log(chalk.gray(`   Remote: ${remoteBranch}`));
      return;
    }

    spinner.succeed('Análise concluída!');

    // Exibe commits pendentes
    console.log(chalk.cyan.bold(`\n📋 COMMITS PENDENTES PARA PUSH (${pendingCommits.total}):`));
    console.log(chalk.gray('─'.repeat(50)));
    
    [...pendingCommits.all].reverse().forEach((commit: any, index: number) => {
      const commitNumber = index + 1;
      const shortHash = commit.hash.substring(0, 7);
      const message = commit.message.split('\n')[0]; // Primeira linha apenas
      const author = commit.author_name;
      const date = new Date(commit.date).toLocaleDateString('pt-BR');
      
      console.log(`${chalk.yellow(`${commitNumber}.`)} ${chalk.green(shortHash)} ${chalk.white(message)}`);
      console.log(`   ${chalk.gray(`por ${author} em ${date}`)}`);
    });

    // Obtém estatísticas das mudanças
    spinner.start('Calculando estatísticas das mudanças...');
    const diffStats = await git.diffSummary([`${remoteBranch}..HEAD`]);
    spinner.succeed('Estatísticas calculadas!');

    // Exibe resumo das mudanças
    console.log(chalk.blue.bold('\n📊 RESUMO DAS MUDANÇAS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`📂 Arquivos modificados: ${chalk.yellow(diffStats.files.length)}`);
    console.log(`➕ Linhas adicionadas: ${chalk.green(diffStats.insertions)}`);
    console.log(`➖ Linhas removidas: ${chalk.red(diffStats.deletions)}`);
    console.log(`📈 Total de mudanças: ${chalk.cyan(diffStats.changed)} linhas`);

    // Lista arquivos modificados
    if (diffStats.files.length > 0) {
      console.log(chalk.magenta.bold('\n📁 ARQUIVOS MODIFICADOS:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      diffStats.files.forEach((file) => {
        const icon = getFileIcon(file.file);
        const insertions = 'insertions' in file ? file.insertions : 0;
        const deletions = 'deletions' in file ? file.deletions : 0;
        
        console.log(`${icon} ${chalk.yellow(file.file)}`);
        if (insertions > 0 || deletions > 0) {
          console.log(`   ${chalk.green(`+${insertions}`)} ${chalk.red(`-${deletions}`)} linhas`);
        }
      });
    }

    // Mostra diff se solicitado
    if (showDiff) {
      console.log(chalk.blue.bold('\n🔍 PREVIEW DAS MUDANÇAS:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const diff = await git.diff([`${remoteBranch}..HEAD`]);
      
      if (diff) {
        // Limita o diff para não sobrecarregar a tela
        const diffLines = diff.split('\n').slice(0, 50);
        console.log(chalk.white(diffLines.join('\n')));
        
        if (diff.split('\n').length > 50) {
          console.log(chalk.gray('\n... (diff truncado, use git diff para ver completo)'));
        }
      } else {
        console.log(chalk.gray('Nenhuma mudança no conteúdo dos arquivos.'));
      }
    }

    // Instruções finais
    console.log(chalk.green.bold('\n🚀 PRÓXIMOS PASSOS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.cyan('git push')} ${chalk.gray('# enviar commits para remote')}`);
    if (!showDiff) {
      console.log(`${chalk.cyan('gromit review --show-diff')} ${chalk.gray('# ver preview das mudanças')}`);
    }
    console.log(`${chalk.cyan('git log --oneline -' + pendingCommits.total)} ${chalk.gray('# ver commits pendentes')}`);
    
  } catch (error) {
    spinner.fail(`Erro ao revisar mudanças: ${error}`);
    throw error;
  }
}

function getFileIcon(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts': case 'tsx': return '🟦';
    case 'js': case 'jsx': return '🟨';
    case 'json': return '📋';
    case 'md': return '📝';
    case 'yml': case 'yaml': return '⚙️';
    case 'css': case 'scss': case 'sass': return '🎨';
    case 'html': return '🌐';
    case 'py': return '🐍';
    case 'java': return '☕';
    case 'go': return '🐹';
    case 'rs': return '🦀';
    case 'php': return '🐘';
    default: return '📄';
  }
} 