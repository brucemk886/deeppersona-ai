import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
const bundle=buildSync({entryPoints:['worker/short-links.ts'],bundle:true,write:false,format:'esm',platform:'neutral'}).outputFiles[0].text;
const {routeShortLink}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const short='https://deeppersonaai.com/go/123456abcd';
const target='https://deeppersonaai.com/?utm_source=tiktok&utm_medium=bio&utm_campaign=factory-a';
test('branded short links forward only the safe path and bot classification headers',async()=>{
 let forwarded;
 const service={async fetch(request){forwarded=request;return new Response(null,{status:302,headers:{Location:target}});}};
 const response=await routeShortLink(new Request(short+'?next=https://evil.test',{headers:{cookie:'secret',authorization:'secret','user-agent':'test-browser',purpose:'prefetch'}}),service);
 assert.equal(response.status,302);assert.equal(response.headers.get('location'),target);
 assert.equal(forwarded.url,'https://factory.tiktokaitool.com/go/123456abcd');
 assert.equal(forwarded.redirect,'manual');assert.equal(forwarded.headers.get('cookie'),null);assert.equal(forwarded.headers.get('authorization'),null);
 assert.equal(forwarded.headers.get('purpose'),'prefetch');assert.equal(response.headers.get('cache-control'),'no-store');
});
test('short links preserve HEAD and do not intercept unrelated pages',async()=>{
 assert.equal(await routeShortLink(new Request('https://deeppersonaai.com/')),null);
 let method;
 const response=await routeShortLink(new Request(short,{method:'HEAD'}),{async fetch(request){method=request.method;return new Response(null,{status:302,headers:{Location:target}});}});
 assert.equal(method,'HEAD');assert.equal(response.status,302);
 assert.equal((await routeShortLink(new Request(short,{method:'POST'}))).status,405);
 assert.equal((await routeShortLink(new Request(short+'/wrong'))).status,404);
});
test('missing, unavailable, or unsafe destinations fail without redirecting elsewhere',async()=>{
 assert.equal((await routeShortLink(new Request(short))).status,503);
 for(const status of [200,404,500]){
  const response=await routeShortLink(new Request(short),{async fetch(){return new Response('',{status});}});
  assert.equal(response.status,status===404?404:503);
 }
 const response=await routeShortLink(new Request(short),{async fetch(){return new Response(null,{status:302,headers:{Location:'https://evil.test/'}});}});
 assert.equal(response.status,503);assert.equal(response.headers.get('location'),null);
});

test('random five-character paths use the canonical code for both old and new visit cohorts',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 const db={prepare(sql){return{args:[],bind(...args){return{...this,args};},async run(){return sqlite.prepare(sql).run(...this.args);},async all(){return{results:sqlite.prepare(sql).all(...this.args)};}};},async batch(items){return Promise.all(items.map(item=>item.all()));}};
 const paths=[];
 const service={async fetch(request){paths.push(request.url);return new Response(null,{status:302,headers:{Location:target,'X-Factory-Link-Code':'123456abcd'}});}};
 try{
  for(const path of ['/7k3m9','/go/123456abcd']){
   const response=await routeShortLink(new Request('https://deeppersonaai.com'+path+'?utm_campaign=evil',{headers:{'user-agent':'Mozilla/5.0'}}),service,db);
   assert.equal(response.status,302);const dest=new URL(response.headers.get('location'));
   assert.equal(dest.searchParams.get('utm_campaign'),'factory-a');assert.ok(dest.searchParams.get('lf_click'));
  }
  assert.deepEqual(paths,['https://factory.tiktokaitool.com/7k3m9','https://factory.tiktokaitool.com/go/123456abcd']);
  assert.deepEqual(sqlite.prepare('SELECT code,campaign,COUNT(*) n FROM traffic_link_clicks GROUP BY code,campaign').all().map(row=>({...row})),[{code:'123456abcd',campaign:'factory-a',n:2}]);
  const response=await routeShortLink(new Request('https://deeppersonaai.com/7k3m9',{method:'HEAD'}),service,db);
  assert.equal(response.status,302);assert.equal(new URL(response.headers.get('location')).searchParams.has('lf_click'),false);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM traffic_link_clicks').get().n,2);
  for(const path of ['/about','/privacy','/tests','/api/traffic','/1234','/00001','/100001','/1ABCD'])assert.equal(await routeShortLink(new Request('https://deeppersonaai.com'+path),service,db),null);
  assert.equal((await routeShortLink(new Request('https://deeppersonaai.com/7k3m9',{method:'POST'}),service,db)).status,405);
  for(const code of ['', '7k3m9','not-valid']){
   const broken={async fetch(){return new Response(null,{status:302,headers:{Location:target,'X-Factory-Link-Code':code}});}};
   assert.equal((await routeShortLink(new Request('https://deeppersonaai.com/7k3m9'),broken,db)).status,503);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM traffic_link_clicks').get().n,2);
 }finally{sqlite.close();}
});
