import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
const source = buildSync({entryPoints:['lib/browser-request.ts'],bundle:true,write:false,format:'esm',platform:'browser'}).outputFiles[0].text;
const {requestJson} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('browser requests handle stalled bodies, network errors and safe retries', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({saved:true});
    assert.deepEqual(await requestJson('/fixture'),{saved:true});
    globalThis.fetch = async (_url,{signal}) => ({ok:true,json:()=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
    await assert.rejects(requestJson('/fixture',{},10),/connection took too long/);
    globalThis.fetch = async () => {throw new TypeError('network failure');};
    await assert.rejects(requestJson('/fixture'),/check your connection/);
    globalThis.fetch = async () => Response.json({error:'This report is unavailable.'},{status:409});
    await assert.rejects(requestJson('/fixture'),/This report is unavailable/);
    globalThis.fetch = async () => new Response('<html>unavailable</html>',{status:503});
    await assert.rejects(requestJson('/fixture'),/could not read the response/);
    globalThis.fetch = async () => Response.json({saved:true});
    assert.deepEqual(await requestJson('/fixture'),{saved:true});
  } finally {globalThis.fetch=original;}
});
