import test from 'node:test';
import assert from 'node:assert/strict';
import { routeShortLink } from '../worker/short-links.ts';
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
