import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync('scripts/deploy-and-sync.mjs', 'utf8').replace(/^import .*;\n/gm, '');
function simulate({ dirty = false, deploymentFails = false } = {}) {
  const calls = [], records = [], messages = [];
  const process = { argv: ['node', 'deploy-and-sync.mjs'], execPath: 'node' };
  vm.runInNewContext(script, {
    process, console: { log: () => {}, error: message => messages.push(message) },
    mkdirSync: () => {}, writeFileSync: (path, content) => records.push({path, data:JSON.parse(content)}),
    spawnSync: (command, args) => {
      calls.push({command,args});
      const action = args[0];
      const stdout = action === 'status' ? (dirty ? ' M app/page.tsx' : '') : action === 'branch' ? 'main' : action === 'rev-parse' ? (args.includes('--abbrev-ref') ? 'origin/main' : 'a'.repeat(40)) : action === 'ls-remote' ? 'a'.repeat(40)+'\trefs/heads/main' : '';
      return {status: deploymentFails && args.includes('deploy') ? 1 : 0, stdout, stderr:''};
    },
  });
  return {calls,records,messages,exitCode:process.exitCode};
}
test('deployment sync rejects uncommitted source before any remote operation', () => {
  const result=simulate({dirty:true});
  assert.equal(result.exitCode,1);
  assert.equal(result.calls.length,1);
});
test('failed deployment never pushes or records a completed deployment', () => {
  const result=simulate({deploymentFails:true});
  assert.equal(result.exitCode,1);
  assert.equal(result.records.length,0);
  assert.equal(result.calls.some(call=>call.args[0]==='push'),false);
});
test('successful deployment pushes the frozen commit and verifies the remote', () => {
  const result=simulate();
  assert.equal(result.exitCode,undefined);
  assert.equal(result.records[0].data.commit,'a'.repeat(40));
  const push=result.calls.findIndex(call=>call.args[0]==='push');
  assert.ok(push>result.calls.findIndex(call=>call.args.includes('deploy')));
  assert.equal(result.calls[push].args[2],'a'.repeat(40)+':refs/heads/main');
  assert.equal(result.calls.at(-1).args[0],'ls-remote');
});
