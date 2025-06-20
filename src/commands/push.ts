import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';

export async function pushChanges(force: boolean = false, showDiff: boolean = false): Promise<void> {
  const spinner = ora('Verificando estado do repositório...').start();
  
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
      spinner.fail('Nenhum remote origin configurado');
      console.log(chalk.yellow('\n⚠️  NENHUM REMOTE CONFIGURADO'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('💡 Este repositório não tem remote origin configurado.'));
      console.log('');
      console.log(chalk.cyan('Para adicionar um remote:'));
      console.log(`${chalk.green('git remote add origin')} <URL_DO_REPOSITORIO>`);
      return;
    }

    // Verifica se há mudanças não commitadas
    spinner.text = 'Verificando mudanças pendentes...';
    const status = await git.status();
    
    if (status.files.length > 0 && !force) {
      spinner.fail('Existem mudanças não commitadas');
      console.log(chalk.red.bold('\n🚫 MUDANÇAS NÃO COMMITADAS DETECTADAS'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Lista os arquivos modificados
      status.files.forEach((file) => {
        const icon = getFileIcon(file.path);
        let statusIcon = '';
        
        if (file.index === 'M' || file.working_dir === 'M') statusIcon = '📝';
        else if (file.index === 'A' || file.working_dir === 'A') statusIcon = '➕';
        else if (file.index === 'D' || file.working_dir === 'D') statusIcon = '➖';
        else if (file.index === '?' || file.working_dir === '?') statusIcon = '❓';
        else statusIcon = '📄';
        
        console.log(`${statusIcon} ${icon} ${chalk.yellow(file.path)}`);
      });
      
      console.log(chalk.blue.bold('\n💡 VOCÊ PRECISA COMMITÁ-LAS PRIMEIRO:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.cyan('gromit commit')} ${chalk.gray('# commit automático com IA')}`);
      console.log(`${chalk.cyan('git add . && git commit -m "mensagem"')} ${chalk.gray('# commit manual')}`);
      console.log('');
      console.log(`${chalk.yellow('Ou use:')} ${chalk.cyan('gromit push --force')} ${chalk.gray('# para ignorar (não recomendado)')}`);
      return;
    }

    if (status.files.length > 0 && force) {
      console.log(chalk.yellow('\n⚠️  IGNORANDO MUDANÇAS NÃO COMMITADAS (--force usado)'));
      console.log(chalk.gray('─'.repeat(50)));
      status.files.forEach((file) => {
        const icon = getFileIcon(file.path);
        console.log(`📄 ${icon} ${chalk.yellow(file.path)} ${chalk.gray('(ignorado)')}`);
      });
    }

    // Obtém commits locais que não estão no remote
    spinner.text = 'Comparando com remote...';
    const pendingCommits = await git.log([`${remoteBranch}..HEAD`]);
    
    if (pendingCommits.total === 0) {
      spinner.succeed('Verificação concluída!');
      console.log(chalk.green('\n✅ NENHUM COMMIT PENDENTE PARA PUSH'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('🎉 Todos os commits já foram enviados para o remote.'));
      console.log(chalk.gray(`   Remote: ${remoteBranch}`));
      return;
    }

    spinner.succeed('Verificação concluída!');

    // Exibe resumo dos commits pendentes
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
    const diffStats = await git.diffSummary([`${remoteBranch}..HEAD`]);

    // Exibe resumo das mudanças
    console.log(chalk.blue.bold('\n📊 RESUMO DAS MUDANÇAS A SEREM ENVIADAS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`📂 Arquivos modificados: ${chalk.yellow(diffStats.files.length)}`);
    console.log(`➕ Linhas adicionadas: ${chalk.green(diffStats.insertions)}`);
    console.log(`➖ Linhas removidas: ${chalk.red(diffStats.deletions)}`);
    console.log(`📈 Total de mudanças: ${chalk.cyan(diffStats.changed)} linhas`);

    // Lista arquivos que serão enviados
    if (diffStats.files.length > 0) {
      console.log(chalk.magenta.bold('\n📁 ARQUIVOS QUE SERÃO ENVIADOS:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      diffStats.files.slice(0, 10).forEach((file) => {
        const icon = getFileIcon(file.file);
        const insertions = 'insertions' in file ? file.insertions : 0;
        const deletions = 'deletions' in file ? file.deletions : 0;
        
        console.log(`${icon} ${chalk.yellow(file.file)}`);
        if (insertions > 0 || deletions > 0) {
          console.log(`   ${chalk.green(`+${insertions}`)} ${chalk.red(`-${deletions}`)} linhas`);
        }
      });
      
      if (diffStats.files.length > 10) {
        console.log(chalk.gray(`... e mais ${diffStats.files.length - 10} arquivos`));
      }
    }

    // Mostra diff detalhado se solicitado
    if (showDiff) {
      console.log(chalk.cyan.bold('\n🔍 PREVIEW DAS MUDANÇAS (DIFF):'));
      console.log(chalk.gray('─'.repeat(50)));
      
      try {
        const diff = await git.diff([`${remoteBranch}..HEAD`]);
        const diffLines = diff.split('\n');
        const maxLines = 50;
        
        if (diffLines.length > maxLines) {
          console.log(chalk.yellow(`⚠️  Mostrando primeiras ${maxLines} linhas do diff (total: ${diffLines.length} linhas)`));
          console.log('');
        }
        
        const linesToShow = diffLines.slice(0, maxLines);
        linesToShow.forEach(line => {
          if (line.startsWith('+++') || line.startsWith('---')) {
            console.log(chalk.cyan(line));
          } else if (line.startsWith('@@')) {
            console.log(chalk.magenta(line));
          } else if (line.startsWith('+')) {
            console.log(chalk.green(line));
          } else if (line.startsWith('-')) {
            console.log(chalk.red(line));
          } else if (line.startsWith('diff --git')) {
            console.log(chalk.yellow.bold(line));
          } else {
            console.log(chalk.gray(line));
          }
        });
        
        if (diffLines.length > maxLines) {
          console.log(chalk.yellow(`\n... (${diffLines.length - maxLines} linhas restantes não mostradas)`));
          console.log(chalk.gray(`Use: git diff ${remoteBranch}..HEAD # para ver o diff completo`));
        }
        
      } catch (error) {
        console.log(chalk.red(`Erro ao obter diff: ${error}`));
      }
    }

    // Instruções para próximos passos
    console.log(chalk.blue.bold('\n🚀 PRÓXIMOS PASSOS:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Para enviar estes commits ao repositório remoto:'));
    console.log('');
    console.log(`${chalk.cyan('git push')} ${chalk.gray('# push padrão')}`);
    console.log(`${chalk.cyan('git push origin ' + (await git.revparse(['--abbrev-ref', 'HEAD'])).trim())} ${chalk.gray('# push da branch atual')}`);
    console.log(`${chalk.cyan('git push --set-upstream origin ' + (await git.revparse(['--abbrev-ref', 'HEAD'])).trim())} ${chalk.gray('# primeira vez desta branch')}`);
    console.log('');
    console.log(chalk.yellow('💡 Use o comando que melhor se adequa à sua situação!'))
    
  } catch (error) {
    spinner.fail(`Erro ao processar push: ${error}`);
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