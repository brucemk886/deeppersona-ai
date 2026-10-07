import { buildSync } from 'esbuild';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac } from 'node:crypto';
import { Miniflare } from 'miniflare';

test('Lemon Squeezy checkout, signed delivery, two tiers and refunds', async t => {
  const secret = 'lemon-test-signature';
  const mf = new Miniflare({ host: '127.0.0.1', port: 0, inspectorPort: 0, workers: [{
    name: 'app', modulesRoot: resolve('dist/server'),
    modules: ['index.js', ...readdirSync('dist/server', {recursive:true}).filter(p => p.endsWith('.js') && p !== 'index.js')]
      .map(p => ({type:'ESModule',path:resolve('dist/server',p)})),
    compatibilityDate:'2026-05-22', compatibilityFlags:['nodejs_compat'], d1Databases:{DB:'lemon-fixture'},
    bindings:{ADMIN_PASSWORD:'fixture', ADMIN_SESSION_SECRET:'settings-fixture', STRIPE_SECRET_KEY:'sk_live_fixture', STRIPE_WEBHOOK_SECRET:'whsec_fixture', LEMONSQUEEZY_API_KEY:'test_fixture', LEMONSQUEEZY_WEBHOOK_SECRET:secret,
      LEMONSQUEEZY_TEST_MODE:'true', LEMONSQUEEZY_STORE_ID:'10', LEMONSQUEEZY_VARIANT_ID:'20', LEMONSQUEEZY_DEEP_VARIANT_ID:'21'},
    outboundService:'lemon-mock',
  }, {name:'lemon-mock', modules:true, compatibilityDate:'2026-05-22', script:`
    const orders = new Map(), checkouts = []; let subscription = false;
    export default { async fetch(request) {
      const u = new URL(request.url), id = u.pathname.split('/').at(-1);
      if (u.pathname === '/fixture/order') { const d = await request.json(); orders.set(d.id,d); return Response.json({ok:true}); }
      if (u.pathname === '/fixture/subscription') { subscription = (await request.json()).value; return Response.json({ok:true}); }
      if (u.pathname === '/fixture/checkouts') return Response.json(checkouts);
      if (u.pathname === '/v1/checkout/sessions') return Response.json({id:'cs_live_fixture',url:'https://checkout.stripe.com/fixture',status:'open'});
      if (u.pathname.startsWith('/v1/variants/')) return Response.json({data:{attributes:{is_subscription:subscription,test_mode:true}}});
      if (u.pathname.startsWith('/v1/stores/')) return Response.json({data:{attributes:{currency:'USD'}}});
      if (u.pathname === '/v1/checkouts') {
        const {data} = await request.json(); checkouts.push(data);
        return Response.json({data:{id:crypto.randomUUID(),attributes:{url:'https://fixture.lemonsqueezy.com/checkout/'+crypto.randomUUID(),test_mode:data.attributes.test_mode}}});
      }
      if (u.pathname.startsWith('/v1/orders/')) return Response.json({data:orders.get(id)});
      return Response.json({error:'unexpected request'},{status:500});
    }}`
  }]});
  try {
    const base = new URL(await mf.ready).origin;
    const db = await mf.getD1Database('DB','app'), mock = await mf.getWorker('lemon-mock');
    const call = async (path,{cookie,body,origin=base,method=body===undefined?'GET':'POST'}={}) => {
      const r=await fetch(base+path,{method,headers:{...(cookie?{cookie}:{}),origin,'content-type':'application/json'},
        ...(body===undefined?{}:{body:JSON.stringify(body)})});
      return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
    };
    const catalog=(await call('/api/tests')).data, testId=catalog.tests[0].id;
    const legacyBundle=buildSync({entryPoints:['lib/relationship-content.ts'],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
    const {relationshipQuestions}=await import('data:text/javascript;base64,'+Buffer.from(legacyBundle).toString('base64'));
    await db.prepare('DELETE FROM quiz_questions WHERE test_id=?').bind(testId).run();
    await db.batch(relationshipQuestions.map(q=>db.prepare('INSERT INTO quiz_questions (id,test_id,kicker,prompt,atlas_path,options_json,position,active) VALUES (?,?,?,?,?,?,?,1)').bind(q.id,q.testId,q.kicker,q.prompt,q.atlasPath,JSON.stringify(q.options),q.position)));
    const {questions}=(await call('/api/questions?test='+testId)).data;
    await db.prepare('UPDATE quiz_tests SET report_price_cents=999 WHERE id=?').bind(testId).run();
    const save=async()=>{
      const r=await call('/api/submit',{body:{sessionId:crypto.randomUUID(),testId,email:'qa-payments@deeppersonaai.com',answerChoices:Object.fromEntries(questions.map(q=>[q.id,0]))}});
      assert.equal(r.status,200,JSON.stringify(r.data));return {id:r.data.reportId,cookie:r.cookie};
    };
    const state=(r,suffix='')=>call('/api/reports/'+r.id+suffix,{cookie:r.cookie});
    const checkout=async(r,tier='basic',extra={})=>{
      const s=(await state(r)).data;
      return call('/api/checkout',{cookie:r.cookie,body:{reportId:r.id,tier,expectedAmountCents:tier==='deep'?s.deepAmountCents:s.amountCents,
        expectedRefundPolicy:tier==='deep'?s.deepRefundPolicy:s.refundPolicy,...extra}});
    };
    let seq=100;
    const fixture=async(r,{tier='basic',patch={}}={})=>{
      const local=await db.prepare('SELECT * FROM '+(tier==='deep'?'deep_orders':'payment_orders')+' WHERE report_id=?').bind(r.id).first();
      const p=await db.prepare('SELECT * FROM lemon_payments WHERE order_id=?').bind(local.id).first();
      const data={type:'orders',id:String(++seq),attributes:{store_id:10,currency:'USD',subtotal:local.amount_cents,discount_total:0,
        total:local.amount_cents+123,tax:123,status:'paid',refunded:false,test_mode:true,first_order_item:{variant_id:Number(p.variant_id)},...patch}};
      const event={meta:{event_name:'order_created',custom_data:{order_id:local.id,nonce:p.nonce}},data};
      await mock.fetch('http://mock/fixture/order',{method:'POST',body:JSON.stringify(data)});
      return {data,event,local};
    };
    const notify=async(event,valid=true)=>{
      const body=JSON.stringify(event),sig=createHmac('sha256',valid?secret:'wrong').update(body).digest('hex');
      return (await fetch(base+'/api/lemonsqueezy/webhook',{method:'POST',headers:{'x-signature':sig},body})).status;
    };
    await t.test('requires owner and current price; return URL does not unlock; prevents deep-first purchase',async()=>{
      const r=await save();
      assert.equal((await call('/api/checkout',{body:{reportId:r.id}})).status,401);
      assert.equal((await checkout(r,'basic',{expectedAmountCents:1})).status,409);
      assert.equal((await checkout(r,'deep')).status,409);
      assert.equal((await state(r,'?sync=1&payment=success')).data.unlocked,false);
    });
    await t.test('checkout freezes price, uses one-time variant and reuses URL on double click',async()=>{
      const r=await save();const first=await checkout(r);assert.equal(first.status,200,JSON.stringify(first.data));
      assert.equal((await checkout(r)).data.url,first.data.url);
      const req=(await(await mock.fetch('http://mock/fixture/checkouts')).json()).at(-1);
      assert.equal(req.attributes.custom_price,999);assert.equal(req.attributes.test_mode,true);
      assert.equal(req.attributes.checkout_options.discount,false);assert.deepEqual(req.attributes.product_options.enabled_variants,[20]);
      assert.equal(req.attributes.checkout_data.custom.tier,'basic');
      await db.prepare('UPDATE quiz_tests SET report_price_cents=1299 WHERE id=?').bind(testId).run();
      assert.equal((await state(r)).data.amountCents,999);
      await db.prepare('UPDATE quiz_tests SET report_price_cents=999 WHERE id=?').bind(testId).run();
    });
    await t.test('prepares checkout before the click, keeps it out of opened orders, and marks it opened',async()=>{
      const r=await save();const warmed=await checkout(r,'basic',{prepare:true});
      assert.equal(warmed.status,200,JSON.stringify(warmed.data));
      const order=await db.prepare('SELECT id FROM payment_orders WHERE report_id=?').bind(r.id).first();
      assert.equal((await db.prepare('SELECT prepared FROM lemon_payments WHERE order_id=?').bind(order.id).first()).prepared,1);
      assert.ok((await db.prepare('SELECT valid_until FROM lemon_config_cache').first()).valid_until>Date.now());
      const opened=await call('/api/checkout/opened',{cookie:r.cookie,body:{reportId:r.id}});
      assert.equal(opened.status,200);assert.equal(opened.data.ok,true);
      assert.equal((await db.prepare('SELECT prepared FROM lemon_payments WHERE order_id=?').bind(order.id).first()).prepared,0);
      assert.equal((await checkout(r)).data.url,warmed.data.url);
    });
    await t.test('rejects subscription configuration before creating checkout',async()=>{
      const r=await save();await db.prepare('DELETE FROM lemon_config_cache').run();
      await mock.fetch('http://mock/fixture/subscription',{method:'POST',body:'{"value":true}'});
      assert.equal((await checkout(r)).status,503);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM lemon_config_cache').first()).n,0);
      await mock.fetch('http://mock/fixture/subscription',{method:'POST',body:'{"value":false}'});
    });
    for (const [name,patch] of Object.entries({store:{store_id:99},variant:{first_order_item:{variant_id:99}},amount:{subtotal:1},currency:{currency:'EUR'},mode:{test_mode:false},discount:{discount_total:100}})) {
      await t.test('rejects mismatched '+name,async()=>{
        const r=await save();await checkout(r);const f=await fixture(r,{patch});assert.equal(await notify(f.event),409);
        assert.equal((await state(r)).data.unlocked,false);
      });
    }
    await t.test('signed payment unlocks only its report, extra tax accepted, duplicate webhook queues one email',async()=>{
      const r=await save();await checkout(r);const f=await fixture(r);
      assert.equal(await notify(f.event,false),400);
      assert.equal(await notify({...f.event,meta:{...f.event.meta,custom_data:{...f.event.meta.custom_data,nonce:'wrong'}}}),409);
      assert.equal(await notify(f.event),200);assert.equal(await notify(f.event),200);
      const s=(await state(r)).data;assert.equal(s.unlocked,true);assert.equal(s.deepUnlocked,false);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_emails WHERE report_id=?').bind(r.id).first()).n,1);
      assert.equal((await checkout(r,'deep')).status,200);
      const deep=await fixture(r,{tier:'deep'});assert.equal(deep.local.amount_cents,1999);
      assert.equal(await notify(deep.event),200);assert.equal((await state(r)).data.deepUnlocked,true);
      const refund={...deep.data,attributes:{...deep.data.attributes,status:'refunded',refunded:true}};
      await mock.fetch('http://mock/fixture/order',{method:'POST',body:JSON.stringify(refund)});
      assert.equal(await notify({meta:{event_name:'order_refunded'},data:refund}),200);
      assert.equal((await state(r)).data.deepUnlocked,false);assert.equal((await state(r)).data.unlocked,true);
    });
    await t.test('refund before paid notification stays refunded, including late replays',async()=>{
      const r=await save();await checkout(r);const f=await fixture(r,{patch:{status:'refunded',refunded:true}});
      assert.equal(await notify(f.event),200);assert.equal((await state(r)).data.status,'refunded');
      await mock.fetch('http://mock/fixture/order',{method:'POST',body:JSON.stringify({...f.data,attributes:{...f.data.attributes,status:'paid',refunded:false}})});
      assert.equal(await notify(f.event),200);assert.equal((await state(r)).data.unlocked,false);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_emails WHERE report_id=?').bind(r.id).first()).n,0);
    });
    await t.test('a second provider order cannot overwrite the first payment',async()=>{
      const r=await save();await checkout(r);const a=await fixture(r);assert.equal(await notify(a.event),200);
      const b=await fixture(r);assert.equal(await notify(b.event),409);
      assert.equal((await db.prepare('SELECT remote_order_id FROM lemon_payments WHERE order_id=?').bind(a.local.id).first()).remote_order_id,a.data.id);
    });
    await t.test('historical live Stripe paid orders still unlock with Lemon sandbox selected',async()=>{
      const r=await save();await db.prepare("INSERT INTO payment_orders (id,report_id,amount_cents,status,stripe_session_id,livemode) VALUES (?,?,999,'paid','cs_live_old',1)").bind(crypto.randomUUID(),r.id).run();
      assert.equal((await state(r)).data.unlocked,true);
    });
    await t.test('admin switch persists, rejects unauthorized requests, routes new orders and preserves pending Lemon checkouts',async()=>{
      const issued=String(Math.floor(Date.now()/1000));
      const cookie='deeppersona_admin='+issued+'.'+createHmac('sha256','settings-fixture').update('admin.'+issued).digest('hex');
      const change=(provider,extra={})=>call('/api/admin/settings',{cookie,method:'PUT',body:{provider},...extra});
      assert.equal((await call('/api/admin/settings')).status,401);
      assert.equal((await change('stripe',{cookie:''})).status,401);
      assert.equal((await change('stripe',{origin:'https://evil.example'})).status,403);
      assert.equal((await change('invalid')).status,400);
      const initial=await call('/api/admin/settings',{cookie});
      assert.equal(initial.data.provider,'lemonsqueezy');
      assert.equal(JSON.stringify(initial.data).includes('sk_live_fixture'),false);
      const pending=await save(), first=await checkout(pending);
      const changed=await change('stripe');assert.equal(changed.status,200);
      assert.equal((await db.prepare('SELECT provider FROM payment_settings WHERE id=1').first()).provider,'stripe');
      assert.equal((await checkout(pending)).data.url,first.data.url);
      const fresh=await save();assert.equal((await checkout(fresh)).data.url,'https://checkout.stripe.com/fixture');
      assert.equal((await db.prepare('SELECT livemode FROM payment_orders WHERE report_id=?').bind(fresh.id).first()).livemode,1);
      const f=await fixture(pending);assert.equal(await notify(f.event),200);
      assert.equal((await state(pending)).data.unlocked,true);
      assert.equal((await change('lemonsqueezy')).status,200);
      assert.equal((await call('/api/admin/settings',{cookie})).data.provider,'lemonsqueezy');
    });
  } finally { await mf.dispose(); }
});
