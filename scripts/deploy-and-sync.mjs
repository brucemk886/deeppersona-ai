import { spawnSync } from 'node:child_process';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args[0]} failed (${result.status}). ${capture ? result.stderr : ''}`);
  return capture ? result.stdout.trim() : '';
}

try {
  const target = process.argv[2] ?? 'site';
  if (!['site', 'mailer'].includes(target)) throw new Error('Expected site or mailer.');
  if (run('git', ['status', '--porcelain'], true)) throw new Error('Review and commit changes before deployment.');
  const branch = run('git', ['branch', '--show-current'], true);
  if (!branch) throw new Error('Deploy from a branch with an origin upstream.');
  const upstream = run('git', ['rev-parse', '--abbrev-ref', '@{upstream}'], true);
  if (upstream !== `origin/${branch}`) throw new Error('Expected matching origin upstream.');
  run('git', ['fetch', 'origin']);
  run('git', ['merge-base', '--is-ancestor', upstream, 'HEAD']);
  const commit = run('git', ['rev-parse', 'HEAD'], true);
  run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit']);
  run(process.execPath, ['node_modules/vinext/dist/cli.js', 'build']);
  if (run('git', ['status', '--porcelain'], true)) throw new Error('Build changed tracked source; review before deploying.');
  run(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', ...(target === 'mailer' ? ['--config', 'wrangler.mailer.jsonc'] : [])]);
  console.log(`Deployment completed from ${commit}. Synchronizing GitHub...`);
  run('git', ['push', 'origin', `${commit}:refs/heads/${branch}`]);
  const remote = run('git', ['ls-remote', 'origin', `refs/heads/${branch}`], true).split(/\s/)[0];
  if (remote !== commit) throw new Error(`Remote moved after push. Deployed commit: ${commit}; inspect before reporting synchronization complete.`);
  console.log(`Deployment and GitHub synchronization complete: ${commit}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
