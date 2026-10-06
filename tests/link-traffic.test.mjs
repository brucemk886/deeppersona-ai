import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { buildSync } from 'esbuild';
import { registerLinkClick,handleLinkArrival } from '../worker/link-traffic.ts';
import { confirmLinkArrival } from '../lib/link-arrival.ts';
const bundle=buildSync({entryPoints:['lib/traffic.ts'],bundle:true,write:false,format:'esm',platform:'browser'}).outputFiles[0].text;
const {currentAttribution}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const now=Date.parse('2026-10-06T10:00:00Z');
const target=new URL('https://deeppersonaai.com/?utm_source=tiktok&utm_medium=bio&utm_campaign=factory-a');
function fixture(t){
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 const db={prepare(sql){return{args:[],bind(...args){return{...this,args};},async run(){return sqlite.prepare(sql).run(...this.args);},async all(){return{results:sqlite.prepare(sql).all(...this.args)};}};},async batch(items){const out=[];for(const item of items)out.push(await item.all());return out;}};
 return{sqlite,db};
}
test('each short-link GET gets a random click token; HEAD and bots are not counted as human clicks',async t=>{
 const f=fixture(t),request=new Request('https://deeppersonaai.com/go/123456abcd',{headers:{'user-agent':'Mozilla/5.0'}});
 const a=await registerLinkClick(request,f.db,'123456abcd',target,now),b=await registerLinkClick(request,f.db,'123456abcd',target,now);
 assert.notEqual(a,b);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM traffic_link_clicks WHERE excluded=0').get().n,2);
 assert.equal(await registerLinkClick(new Request(request,{method:'HEAD'}),f.db,'123456abcd',target,now),null);
 await registerLinkClick(new Request(request,{headers:{'user-agent':'VerificationBot'}}),f.db,'123456abcd',target,now);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM traffic_link_clicks WHERE excluded=1').get().n,1);
 assert.equal(f.sqlite.prepare("SELECT started_at FROM traffic_link_state WHERE id='v1'").get().started_at,now);
 assert.deepEqual(f.sqlite.prepare('PRAGMA table_info(traffic_link_clicks)').all().map(r=>r.name),['id','code','campaign','clicked_at','arrived_at','excluded']);
});
test('arrival confirmation is same-origin, bound to a real token, and idempotent',async t=>{
 const f=fixture(t),clickId=await registerLinkClick(new Request(target,{headers:{'user-agent':'Mozilla/5.0'}}),f.db,'123456abcd',target,now);
 const request=(body={clickId},origin='https://deeppersonaai.com')=>new Request('https://deeppersonaai.com/api/link-arrival',{method:'POST',headers:{origin},body:JSON.stringify(body)});
 assert.equal((await handleLinkArrival(request(),f.db,now+1)).status,204);
 assert.equal((await handleLinkArrival(request(),f.db,now+20)).status,204);
 assert.equal(f.sqlite.prepare('SELECT arrived_at FROM traffic_link_clicks WHERE id=?').get(clickId).arrived_at,now+1);
 assert.equal((await handleLinkArrival(request({},'https://evil.test'),f.db,now+30)).status,403);
 assert.equal((await handleLinkArrival(request({clickId:'bad'}),f.db,now+30)).status,400);
 assert.equal((await handleLinkArrival(request({clickId:crypto.randomUUID()}),f.db,now+30)).status,204);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM traffic_link_clicks').get().n,1);
});
test('registration failures preserve navigation and client confirmation handles blocking',async()=>{
 const db={batch:async()=>{throw new Error('offline');},prepare(){return{};}};
 assert.equal(await registerLinkClick(new Request(target),db,'123456abcd',target),null);
 assert.equal(await confirmLinkArrival(crypto.randomUUID(),async()=>{throw new Error('blocked');}),false);
 let body;
 assert.equal(await confirmLinkArrival('one',async(url,options)=>{body=JSON.parse(options.body);assert.equal(url,'/api/link-arrival');return new Response(null,{status:204});}),true);
 assert.deepEqual(body,{clickId:'one'});
});
test('quiz attribution carries only a valid per-click token and honors the existing opt-out',()=>{
 const prior={window:globalThis.window,location:globalThis.location,document:globalThis.document};
 const id=crypto.randomUUID();let choice=null;
 globalThis.location={search:target.search+'&lf_click='+id,hostname:'deeppersonaai.com'};
 globalThis.window={navigator:{},localStorage:{getItem:()=>choice}};
 globalThis.document={referrer:''};
 try{
  assert.equal(currentAttribution().visitId,id);
  choice='denied';assert.equal(currentAttribution().visitId,undefined);
  choice=null;location.search=target.search+'&lf_click=not-a-token';assert.equal(currentAttribution().visitId,undefined);
  location.search='?utm_source=other&lf_click='+id;assert.equal(currentAttribution().visitId,undefined);
 }finally{Object.assign(globalThis,prior);}
});
