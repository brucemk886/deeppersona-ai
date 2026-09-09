import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const source=buildSync({entryPoints:['lib/google-analytics.ts'],bundle:true,write:false,format:'esm',platform:'browser'}).outputFiles[0].text;
const ga=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('analytics loads once and sends sanitized events while respecting opt-outs',()=>{
 const originalWindow=globalThis.window,originalDocument=globalThis.document;
 const storage=new Map(); const scripts=[];
 globalThis.window={navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},location:{origin:'https://deeppersonaai.com',pathname:'/tests/attachment-style',href:'https://deeppersonaai.com/tests/attachment-style?email=private@example.com'}};
 globalThis.document={getElementById:()=>scripts[0]??null,createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 try {
  assert.equal(ga.getAnalyticsConsent(),null);
  ga.initializeGoogleAnalytics(); assert.equal(scripts.length,1);
  assert.match(scripts[0].src,/G-WS2Z8SKMY1/);
  storage.set('deeppersona_analytics_consent','granted');
  assert.equal(ga.getAnalyticsConsent(),null,'legacy automatic grants are not consent');
  ga.updateGoogleAnalyticsConsent('granted'); assert.equal(scripts.length,1);
  ga.trackGoogleAnalyticsEvent('page_view',{page_location:window.location.href,email:'private@example.com',test_id:'attachment-style',campaign:'private@example.com',step:1});
  const payload=JSON.stringify(window.dataLayer ?? []);
  assert.equal(payload.includes('private@example.com'),false);
  assert.equal(payload.includes('attachment-style'),false);
  assert.equal(payload.includes('page_view'),true);
  assert.equal(Array.from(window.dataLayer.at(-1))[0],'event');
  window.location.pathname='/reports/private-report-id';
  const count=(window.dataLayer ?? []).length;
  ga.trackGoogleAnalyticsEvent('page_view'); assert.equal((window.dataLayer ?? []).length,count);
  window.navigator.globalPrivacyControl=true;
  assert.equal(ga.getAnalyticsConsent(),'denied');
  window.navigator.globalPrivacyControl=false;
  ga.updateGoogleAnalyticsConsent('denied');
  assert.equal(ga.getAnalyticsConsent(),'denied');
  window.location.pathname='/';
  const optedOutCount=window.dataLayer.length;
  ga.trackGoogleAnalyticsEvent('page_view');
  assert.equal(window.dataLayer.length,optedOutCount);
 } finally {globalThis.window=originalWindow;globalThis.document=originalDocument;}
});
