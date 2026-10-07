import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac } from 'node:crypto';
import { Miniflare } from 'miniflare';

test('launch report lifecycle, owned view events and edition funnel use actual payment state',async()=>{
 const mf=new Miniflare({host:'127.0.0.1',port:0,inspectorPort:0,
 modules:['index.js',...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],
 d1Databases:['DB'],bindings:{ADMIN_SESSION_SECRET:'launch-local-only',ADMIN_PASSWORD:'fixture',STRIPE_SECRET_KEY:'sk_test_local_fixture'},
 outboundService:()=>Response.json({error:'External requests disabled in this test'},{status:503})});
 try{
 const base=new URL(await mf.ready).origin,db=await mf.getD1Database('DB');
 const call=async(path,{body,cookie,origin=base}={})=>{const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});return {status:res.status,headers:res.headers,data:await res.json()};};
 const qs=(await call('/api/questions?test=attachment-style')).data.questions;
 assert.equal(qs.length,20);assert.ok(qs.every(q=>q.id.startsWith('attachment-style-launch-v1-q')));
 const sessionId=crypto.randomUUID(),testId='attachment-style';
 for(const eventName of ['session_started','question_viewed','answer_selected','email_gate_viewed']) assert.equal((await call('/api/events',{body:{sessionId,testId,eventName,questionId:qs[0].id}})).status,200);
 const saved=await call('/api/submit',{body:{sessionId,testId,email:'qa-launch@deeppersonaai.com',answerChoices:Object.fromEntries(qs.map(q=>[q.id,0]))}});
 assert.equal(saved.status,200,JSON.stringify(saved.data));
 const id=saved.data.reportId,cookie=saved.headers.get('set-cookie').split(';')[0];
 const free=await call('/api/reports/'+id,{cookie});assert.equal(free.status,200);assert.equal(free.data.unlocked,false);assert.equal(free.data.amountCents,999);assert.equal(free.data.deepAmountCents,0);
 assert.equal(free.data.preview.launchOverview.answered,20);assert.equal(free.data.deepResult,undefined);assert.equal(free.data.questions,undefined);
 assert.equal((await call('/api/reports/'+id)).status,401);
 assert.equal((await call(`/api/reports/${id}/viewed`,{cookie,body:{view:'full'}})).status,403,'unpaid clients cannot claim a paid report open');
 assert.equal((await call(`/api/reports/${id}/viewed`,{cookie,body:{view:'summary'},origin:'https://evil.example'})).status,403);
 for(let i=0;i<2;i++) assert.equal((await call(`/api/reports/${id}/viewed`,{cookie,body:{view:'summary'}})).status,200);
 assert.equal((await db.prepare("SELECT COUNT(*) n FROM quiz_events WHERE session_id=? AND event_name='result_viewed'").bind(sessionId).first()).n,1);
 assert.equal((await call('/api/checkout',{cookie,body:{reportId:id,tier:'deep',expectedAmountCents:1999}})).status,409);
 // Synthetic server-confirmed payment, local D1 only; never a checkout call to a payment provider.
 await db.prepare("INSERT INTO payment_orders(id,report_id,amount_cents,livemode,status,paid_at) VALUES (?,?,999,1,'paid',CURRENT_TIMESTAMP)").bind(crypto.randomUUID(),id).run();
 const paid=await call('/api/reports/'+id,{cookie});assert.equal(paid.data.unlocked,true);assert.equal(paid.data.deepResult.launchReport.scenarios.length,3);assert.equal(paid.data.deepResult.launchReport.answers.length,20);
 // Existing launch reports receive the new reading from their frozen answers,
 // with no write to historical snapshots and no paid content in an unpaid response.
 const oldSnapshot = JSON.parse((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(id).first()).snapshot_json);
 delete oldSnapshot.deepResult.launchReport.reading;
 delete oldSnapshot.deepResult.launchReport.overview.insight;
 await db.prepare('UPDATE quiz_reports SET snapshot_json=? WHERE id=?').bind(JSON.stringify(oldSnapshot), id).run();
 assert.equal((await call('/api/reports/'+id,{cookie})).data.deepResult.launchReport.reading.version,'attachment-reading-v2');
 const frozen=(await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(id).first()).snapshot_json;
 await db.prepare("UPDATE quiz_questions SET prompt='Later admin change' WHERE id=?").bind(qs[0].id).run();
 assert.equal((await call('/api/reports/'+id,{cookie})).data.deepResult.launchReport.answers[0].prompt,qs[0].prompt);
 assert.equal((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(id).first()).snapshot_json,frozen);
 assert.equal((await call(`/api/reports/${id}/viewed`,{cookie,body:{view:'full'}})).status,200);
 const issued=String(Math.floor(Date.now()/1000)),admin='deeppersona_admin='+issued+'.'+createHmac('sha256','launch-local-only').update('admin.'+issued).digest('hex');
 const stats=await call('/api/admin/stats?range=all',{cookie:admin});assert.equal(stats.status,200,JSON.stringify(stats.data));
 const traffic=stats.data.traffic;assert.ok(traffic,'admin includes traffic analytics');
 const cohort=traffic.editions.find(e=>e.edition==='attachment-launch-v1');assert.ok(cohort);assert.equal(cohort.started,1);assert.equal(cohort.result_viewed,1);assert.equal(cohort.paid,1);assert.equal(cohort.paid_opened,1);
 await db.prepare("UPDATE payment_orders SET status='refunded' WHERE report_id=?").bind(id).run();
 const refunded = await call('/api/reports/'+id,{cookie});
 assert.equal(refunded.data.deepResult,undefined);
 assert.ok(refunded.data.preview.launchOverview.insight.excerpt);
 assert.equal(JSON.stringify(refunded.data).includes(paid.data.deepResult.launchReport.reading.protection), false);
 assert.equal((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(id).first()).snapshot_json,frozen);
 assert.equal((await call(`/api/reports/${id}/viewed`,{cookie,body:{view:'full'}})).status,403);
 }finally{await mf.dispose();}
});
