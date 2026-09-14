import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Miniflare } from "miniflare";
import Stripe from "stripe";
import { buildSync } from "esbuild";
import { createHmac } from 'node:crypto';
import { Webhook } from 'svix';

// Exercise the built Worker and real local D1. Only Stripe's external API is mocked.
test("report payments: authorization, pricing, delivery and refunds", async (t) => {
  const webhookSecret = "whsec_local_integration_fixture";
  const resendSecret = 'whsec_' + Buffer.from('local-mail-webhook-fixture').toString('base64');
  let base;
  const mockScript = `
    const sessions = new Map(), keys = new Map(), intents = new Map(), mails = new Map(); let mailFailure = false;
    export default { async fetch(request) {
      const url = new URL(request.url);
      const id = url.pathname.split('/').at(-1);
      if (url.pathname === '/__mails') return Response.json([...mails.values()]);
      if (url.pathname === '/__mailfail') { mailFailure = (await request.json()).fail; return Response.json({ok:true}); }
      if (url.pathname === '/emails') {
        if(mailFailure)return Response.json({error:'temporary'}, {status:503});
        const key=request.headers.get('idempotency-key');
        if(!mails.has(key))mails.set(key,{id:'email_'+crypto.randomUUID(),...await request.json()});
        return Response.json({id:mails.get(key).id});
      }
      if (url.pathname === '/__session') { const s=await request.json(); sessions.set(s.id,s); return Response.json({ok:true}); }
      if (url.pathname === '/__intent') { const i=await request.json(); intents.set(i.id,i); return Response.json({ok:true}); }
      if (url.pathname.startsWith('/__session/')) return Response.json(sessions.get(id));
      if (request.method === 'POST' && url.pathname === '/v1/checkout/sessions') {
        const form=new URLSearchParams(await request.text()), key=request.headers.get('idempotency-key');
        if (keys.has(key)) return Response.json(keys.get(key));
        const id='cs_test_'+crypto.randomUUID();
        const s={id,object:'checkout.session',mode:'payment',status:'open',livemode:false,
          amount_total:Number(form.get('line_items[0][price_data][unit_amount]')),currency:form.get('line_items[0][price_data][currency]'),
          client_reference_id:form.get('client_reference_id'),metadata:{order_id:form.get('metadata[order_id]')},
          payment_status:'unpaid',payment_intent:null,url:'https://checkout.stripe.com/c/pay/'+id};
        sessions.set(id,s);keys.set(key,s);return Response.json(s);
      }
      if (url.pathname.startsWith('/v1/checkout/sessions/')) return Response.json(sessions.get(id));
      if (url.pathname.startsWith('/v1/payment_intents/')) return Response.json(intents.get(id));
      return Response.json({error:'Unknown mock endpoint'}, {status:404});
    }};
  `;
  const mailScript = buildSync({stdin:{contents:"import {processReportEmails} from './lib/report-email'; export default {async fetch(){await processReportEmails();return new Response('ok')}}", resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']}).outputFiles[0].text;
  const mf = new Miniflare({ host: "127.0.0.1", port: 0, inspectorPort: 0, workers: [{
    name: "app",
    modules: ["index.js", ...readdirSync("dist/server", { recursive: true }).filter((p) => p.endsWith(".js") && p !== "index.js")]
      .map((p) => ({ type: "ESModule", path: resolve("dist/server", p) })),
    modulesRoot: resolve("dist/server"), compatibilityDate: "2026-05-22", compatibilityFlags: ["nodejs_compat"],
    bindings: { STRIPE_SECRET_KEY: "sk_test_local_fixture", STRIPE_WEBHOOK_SECRET: webhookSecret, RESEND_WEBHOOK_SECRET: resendSecret, ADMIN_PASSWORD: 'fixture', ADMIN_SESSION_SECRET: 'local-admin-fixture' }, d1Databases: {DB:"shared-test-db"},
    ratelimits: { CHECKOUT_RATE_LIMIT: { simple: { limit: 30, period: 60 } } },
    outboundService: "stripe-mock",
  }, { name: "stripe-mock", modules: true, script: mockScript, compatibilityDate: "2026-05-22" },
  {name:'mailer', modules:true, script:mailScript, compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'shared-test-db'},bindings:{RESEND_API_KEY:'re_fixture',REPORT_EMAIL_FROM:'DeepPersona AI <reports@example.com>'},outboundService:'stripe-mock'}] });
  try {
    base = new URL(await mf.ready).origin;
    const db = await mf.getD1Database("DB", "app");
    const mock = await mf.getWorker("stripe-mock");
    const getSession = async (id) => (await mock.fetch("http://mock/__session/"+id)).json();
    const setSession = (session) => mock.fetch("http://mock/__session", {method:"POST",body:JSON.stringify(session)});
    const setIntent = (intent) => mock.fetch("http://mock/__intent", {method:"POST",body:JSON.stringify(intent)});
    const call = async (path, { cookie, body, origin = base, headers = {} } = {}) => {
      const response = await fetch(base + path, {
        signal: AbortSignal.timeout(20000),
        method: body === undefined ? "GET" : "POST",
        headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { origin, "content-type": "application/json" }), ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, headers: response.headers, data: await response.json() };
    };
    const { data: catalog } = await call("/api/tests");
    assert.equal((await call('/api/events',{body:{sessionId:crypto.randomUUID(),eventName:'session_started'}})).status,200,'test events work without an age checkbox');
    const testId = catalog.tests[0].id;
    const { data: { questions } } = await call(`/api/questions?test=${testId}`);
    const save = async (price = 999) => {
      await db.prepare("UPDATE quiz_tests SET report_price_cents = ? WHERE id = ?").bind(price, testId).run();
      const body = { sessionId: crypto.randomUUID(), testId, email: "qa-payments@deeppersonaai.com",
        answerChoices: Object.fromEntries(questions.map((q) => [q.id, 0])), resultType: "creator" };
      const result = await call("/api/submit", { body });
      assert.equal(result.status, 200, JSON.stringify(result.data));
      return { id: result.data.reportId, cookie: result.headers.get("set-cookie").split(";")[0], body };
    };
    const checkout = async (report, price) => { const state = await call(`/api/reports/${report.id}`, {cookie:report.cookie}); return call("/api/checkout", { cookie: report.cookie, body: { reportId: report.id, expectedAmountCents: price, expectedRefundPolicy: state.data.refundPolicy } }); };
    const reportState = (report, suffix = "") => call(`/api/reports/${report.id}${suffix}`, { cookie: report.cookie });
    const notify = async (type, object, { valid = true, timestamp } = {}) => {
      const body = JSON.stringify({ id: "evt_" + crypto.randomUUID(), type, livemode: false, data: { object } });
      const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: valid ? webhookSecret : "wrong", timestamp });
      const response = await fetch(base + "/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body });
      return response.status;
    };
    await t.test('refund terms are versioned and old orders retain the original policy', async () => {
      const fresh=await save(899);
      assert.equal((await reportState(fresh)).data.refundPolicy,'limited-2026-09-08');
      assert.equal((await call('/api/checkout',{cookie:fresh.cookie,body:{reportId:fresh.id,expectedAmountCents:899}})).status,409,'stale pages must review updated terms');
      assert.equal((await checkout(fresh,899)).status,200);
      const order=await db.prepare('SELECT id FROM payment_orders WHERE report_id=?').bind(fresh.id).first();
      assert.equal((await db.prepare('SELECT version FROM payment_order_policies WHERE order_id=?').bind(order.id).first()).version,'limited-2026-09-08');
      const old=await save(500);
      await db.prepare("INSERT INTO payment_orders (id,report_id,amount_cents,livemode) VALUES (?,?,500,0)").bind(crypto.randomUUID(),old.id).run();
      assert.equal((await reportState(old)).data.refundPolicy,'14-day-2026-09-08');
      assert.equal((await checkout(old,500)).status,200);
      assert.equal((await reportState(old)).data.refundPolicy,'14-day-2026-09-08','checkout must not replace old policy');
    });
    await t.test('report email recovery, retry, idempotency, expiry and refund access', async () => {
      const r = await save(899); await checkout(r,899);
      // Local fixture only: simulate a confirmed LIVE order without making any external charge.
      await db.prepare("UPDATE payment_orders SET status = 'paid', livemode = 1 WHERE report_id = ?").bind(r.id).run();
      assert.equal((await call('/api/report-email',{body:{email:r.body.email},origin:'https://evil.example'})).status,403);
      const unknown=await call('/api/report-email',{body:{email:'unknown@example.com'}});
      const known=await call('/api/report-email',{body:{email:r.body.email}});
      assert.deepEqual(known.data,unknown.data);
      await call('/api/report-email',{body:{email:r.body.email}});
      const jobs=await db.prepare('SELECT * FROM report_emails WHERE report_id = ?').bind(r.id).all();
      assert.equal(jobs.results.length,1,'resends are throttled');
      const mailer=await mf.getWorker('mailer');
      await mock.fetch('http://mock/__mailfail',{method:'POST',body:JSON.stringify({fail:true})});
      await mailer.fetch('http://mailer/');
      assert.equal((await db.prepare('SELECT status FROM report_emails WHERE report_id = ?').bind(r.id).first()).status,'retry');
      await mock.fetch('http://mock/__mailfail',{method:'POST',body:JSON.stringify({fail:false})});
      await db.prepare('UPDATE report_emails SET next_attempt = 0 WHERE report_id = ?').bind(r.id).run();
      await mailer.fetch('http://mailer/'); await mailer.fetch('http://mailer/');
      const emails=await (await mock.fetch('http://mock/__mails')).json();
      assert.equal(emails.length,1); assert.deepEqual(emails[0].to,[r.body.email]);
      const issuedAt = String(Math.floor(Date.now()/1000));
      const adminCookie = 'deeppersona_admin=' + issuedAt + '.' + createHmac('sha256','local-admin-fixture').update('admin.'+issuedAt).digest('hex');
      assert.equal((await call('/api/admin/report-emails')).status,401);
      assert.equal((await call('/api/admin/report-emails',{body:{reportId:r.id}})).status,401);
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie,body:{reportId:r.id},origin:'https://evil.example'})).status,403);
      let logs=await call('/api/admin/report-emails',{cookie:adminCookie});
      assert.equal(logs.status,200); assert.equal(logs.data.rows[0].status,'accepted');
      assert.equal(JSON.stringify(logs.data).includes(jobs.results[0].token),false,'private link never exposed to admin API');
      assert.equal('token_hash' in logs.data.rows[0],false);
      const providerEvent = async (status, { valid=true, timestamp=new Date(), occurred=new Date(), eventId='msg_'+crypto.randomUUID(), from='DeepPersona AI <reports@mail.deeppersonaai.com>' }={}) => {
        const payload=JSON.stringify({type:'email.'+status,created_at:occurred.toISOString(),data:{email_id:emails[0].id,from,failed:{reason:'reached_daily_quota'}}});
        const signature=new Webhook(resendSecret).sign(eventId,timestamp,payload);
        return (await fetch(base+'/api/resend/webhook',{method:'POST',body:payload,headers:{'svix-id':eventId,'svix-timestamp':String(Math.floor(timestamp.getTime()/1000)),'svix-signature':valid?signature:'v1,invalid'}})).status;
      };
      assert.equal(await providerEvent('failed',{valid:false}),400);
      assert.equal(await providerEvent('failed',{timestamp:new Date(Date.now()-600000)}),400);
      assert.equal(await providerEvent('failed',{from:'Other <mail@mail.tiktokaitool.com>'}),200);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_email_delivery').first()).n,0,'other website ignored');
      const occurred=new Date();
      assert.equal(await providerEvent('delivered',{occurred}),200);
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie,body:{reportId:r.id}})).status,409,'delivered reports cannot be resent from admin');
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie})).data.rows[0].already_delivered,1);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_emails WHERE report_id = ?').bind(r.id).first()).n,1,'blocked resend creates no new job');
      const eventId='msg_duplicate';
      assert.equal(await providerEvent('failed',{occurred:new Date(occurred.getTime()+1000),eventId}),200);
      assert.equal(await providerEvent('failed',{occurred:new Date(occurred.getTime()+1000),eventId}),200);
      assert.equal(await providerEvent('sent',{occurred:new Date(occurred.getTime()-1000)}),200);
      logs=await call('/api/admin/report-emails?status=failed',{cookie:adminCookie});
      assert.equal(logs.data.total,1); assert.equal(logs.data.rows[0].status,'failed');
      assert.equal(logs.data.rows[0].reason,'reached_daily_quota');
      assert.equal(logs.data.summary.attention,1);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_email_delivery').first()).n,1,'duplicate callback does not create records');
      assert.equal((await call('/api/admin/report-emails?q=no-match',{cookie:adminCookie})).data.total,0);
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie,body:{reportId:r.id}})).status,429,'admin respects cooldown');
      await db.prepare('UPDATE report_emails SET created_at = created_at - 301000 WHERE report_id = ?').bind(r.id).run();
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie,body:{reportId:r.id}})).data.queued,true);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM report_emails WHERE report_id = ?').bind(r.id).first()).n,2,'manual resend preserves original failed record');
      const token=jobs.results[0].token;
      const access=await fetch(base+'/api/report-access?token='+token,{redirect:'manual'});
      assert.equal(access.status,303); assert.equal(access.headers.get('referrer-policy'),'no-referrer');
      const cookie=access.headers.get('set-cookie').split(';')[0];
      // Match local app's sandbox environment after establishing the production-email fixture.
      await db.prepare('UPDATE payment_orders SET livemode = 0 WHERE report_id = ?').bind(r.id).run();
      assert.equal((await call('/api/reports/'+r.id,{cookie})).data.unlocked,true);
      const other=await save(500);
      assert.notEqual((await call('/api/reports/'+other.id,{cookie})).status,200);
      assert.equal((await fetch(base+'/api/report-access?token='+'0'.repeat(64),{redirect:'manual'})).status,410);
      await db.prepare("UPDATE payment_orders SET status = 'refunded' WHERE report_id = ?").bind(r.id).run();
      assert.equal((await call('/api/admin/report-emails',{cookie:adminCookie,body:{reportId:r.id}})).status,409,'refunded orders cannot be resent');
      assert.equal((await call('/api/reports/'+r.id,{cookie})).data.unlocked,false);
      assert.equal((await fetch(base+'/api/report-access?token='+token,{redirect:'manual'})).status,410);
      await db.prepare("UPDATE payment_orders SET status = 'paid' WHERE report_id = ?").bind(r.id).run();
      await db.prepare('UPDATE report_emails SET expires_at = 0 WHERE report_id = ?').bind(r.id).run();
      assert.equal((await fetch(base+'/api/report-access?token='+token,{redirect:'manual'})).status,410);
      assert.notEqual((await call('/api/reports/'+r.id,{cookie})).status,200);
    });
    let report;
    let session;

    await t.test("public APIs and client bundles contain no paid report copy", async () => {
      assert.ok(catalog.tests.every(item => item.results === undefined));
      assert.ok(questions.every((q) => q.options.every((o) => !o.meaning && !o.projection)));
      const bundles = readdirSync("dist/client", { recursive: true }).filter((p) => p.endsWith(".js"));
      for (const bundle of bundles) {
        const text = readFileSync(resolve("dist/client", bundle), "utf8");
        assert.ok(!text.includes("How you try to restore safety in closeness"), bundle);
        assert.ok(!text.includes("You revive possibility when other people feel stuck."), bundle);
      }
    });
    await t.test("server saves unscored choices and protects the report snapshot", async () => {
      report = await save();
      const state = await reportState(report);
      assert.equal(state.data.unlocked, false);
      assert.ok(["anxious", "avoidant", "secure", "fearful"].includes(state.data.result.key));
      assert.equal(typeof state.data.result.anxiety, "number");
      assert.equal(typeof state.data.result.avoidance, "number");
      assert.equal(questions[0].options[0].scoreKey, undefined);
      assert.equal(state.data.deepResult, undefined);
      assert.equal(state.data.questions, undefined);
      assert.equal(state.data.preview.totalChoices,20);
      assert.equal(state.data.preview.modules.length,1);
      assert.equal(state.data.preview.choices,undefined);
      assert.equal(state.data.preview.overview, undefined);
      assert.equal(state.data.preview.loop, undefined);
      assert.equal(state.data.preview.childhoodTeaser, undefined);
      assert.equal(state.data.preview.worthPattern, undefined);
      assert.ok(state.data.preview.sample?.moduleTitle);
      assert.ok((state.data.preview.romanceEssay || "").split(/(?<=[.!?])\s+/).filter(Boolean).length >= 8);
      assert.ok((state.data.preview.romanceEssay || "").split(/(?<=[.!?])\s+/).filter(Boolean).length <= 12);
      assert.equal(state.data.preview.caregiver, undefined);
      assert.equal(typeof state.data.preview.scores?.anxietySeven, "number");
      assert.ok(["Low", "Medium", "High"].includes(state.data.preview.selfWorth.level));
      assert.equal(state.data.preview.inclusions?.length, 3);
      assert.doesNotMatch(JSON.stringify(state.data.preview), /paid reading|Mother \(CG|Father \(CG|AT WORK|millions of users/i);
      const stored=JSON.parse((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(report.id).first()).snapshot_json);
      const leaked = stored.questions.flatMap((q) => q.options.map((option) => option.meaning)).filter((meaning) => JSON.stringify(state.data).includes(meaning));
      assert.equal(leaked.length, 1, 'Unpaid response may unlock one sample interpretation only');
      assert.equal(state.data.preview.sample.choice.meaning, leaked[0]);
      assert.match(state.headers.get("cache-control"), /no-store/);
      assert.equal((await call(`/api/reports/${report.id}`)).status, 401);
      assert.equal((await call(`/api/reports/${report.id}`, { cookie: `dp_profile=${crypto.randomUUID()}` })).status, 404);
      assert.equal((await call("/api/submit", { body: { ...report.body, answerChoices: {} } })).status, 409);
      assert.equal((await call("/api/submit", { cookie: report.cookie, body: report.body })).data.reportId, report.id);
    });
    await t.test("rejects cross-origin requests, other owners and altered prices", async () => {
      assert.equal((await call("/api/checkout", { cookie: report.cookie, origin: "https://attacker.invalid", body: { reportId: report.id } })).status, 403);
      assert.equal((await checkout({ ...report, cookie: `dp_profile=${crypto.randomUUID()}` }, 999)).status, 404);
      assert.equal((await checkout(report, 1)).status, 409);
    });
    await t.test("uses each test's server price and reuses concurrent checkout", async () => {
      const results = await Promise.all([checkout(report, 999), checkout(report, 999)]);
      for (const result of results) assert.equal(result.status, 200, JSON.stringify(result.data));
      assert.equal(results[0].data.url, results[1].data.url);
      session = await getSession(results[0].data.url.split("/").at(-1));
      assert.equal(session.amount_total, 999);
      const other = await save(1299);
      const next = await checkout(other, 1299);
      assert.equal((await getSession(next.data.url.split("/").at(-1))).amount_total, 1299);
      assert.equal((await reportState(report)).data.amountCents, 999);
    });
    await t.test("free reports unlock without a Stripe order", async () => {
      const free = await save(0);
      const state = await reportState(free);
      assert.equal(state.data.unlocked, true); assert.ok(state.data.deepResult);
      assert.equal(await db.prepare("SELECT id FROM payment_orders WHERE report_id = ?").bind(free.id).first(), null);
    });
    await t.test("forged, stale and mismatched notifications cannot unlock", async () => {
      assert.equal(await notify("checkout.session.completed", session, { valid: false }), 400);
      assert.equal(await notify("checkout.session.completed", session, { timestamp: 1 }), 400);
      assert.equal(await notify("checkout.session.completed", { ...session, amount_total: 1 }), 409);
      assert.equal(await notify("checkout.session.completed", { ...session, livemode: true }), 409);
      assert.equal(await notify("checkout.session.completed", session), 200);
      assert.equal((await reportState(report)).data.unlocked, false);
    });
    await t.test("paid event unlocks only its report and is safe to replay", async () => {
      const pi = "pi_" + crypto.randomUUID();
      await setIntent({ id: pi, latest_charge: { amount_refunded: 0 } });
      Object.assign(session, { payment_status: "paid", status: "complete", payment_intent: pi });
      await setSession(session);
      assert.equal(await notify("checkout.session.completed", session), 200);
      assert.equal(await notify("checkout.session.completed", session), 200);
      const state = await reportState(report);
      assert.equal(state.data.unlocked, true); assert.ok(state.data.deepResult); assert.ok(state.data.questions[0].options[0].meaning);
      assert.equal((await checkout(report, 999)).data.url, `/reports/${report.id}`);
    });
    await t.test("full refunds revoke access; late completed events cannot regrant it", async () => {
      assert.equal(await notify("charge.refunded", { refunded: true, payment_intent: session.payment_intent }), 200);
      assert.equal((await reportState(report)).data.unlocked, false);
      assert.equal(await notify("checkout.session.completed", session), 200);
      assert.equal((await reportState(report)).data.status, "refunded");
      assert.equal((await checkout(report, 999)).status, 409);
    });
    await t.test("return-page reconciliation verifies Stripe, not the URL parameter", async () => {
      const returning = await save(799);
      const created = await checkout(returning, 799);
      const current = await getSession(created.data.url.split("/").at(-1));
      assert.equal((await reportState(returning, "?sync=1")).data.unlocked, false);
      const pi = "pi_" + crypto.randomUUID(); await setIntent({ id: pi, latest_charge: { amount_refunded: 0 } });
      Object.assign(current, { payment_status: "paid", status: "complete", payment_intent: pi });
      await setSession(current);
      assert.equal((await reportState(returning, "?sync=1")).data.unlocked, true);
    });
    await t.test("expired checkouts can be retried without a duplicate order", async () => {
      const expiring = await save(999);
      const first = await checkout(expiring, 999);
      const expired = await getSession(first.data.url.split("/").at(-1)); expired.status = "expired"; await setSession(expired);
      assert.equal(await notify("checkout.session.expired", expired), 200);
      const second = await checkout(expiring, 999);
      assert.equal(second.status, 200); assert.notEqual(second.data.url, first.data.url);
      const count = await db.prepare("SELECT COUNT(*) AS n FROM payment_orders WHERE report_id = ?").bind(expiring.id).first();
      assert.equal(count.n, 1);
    });

    await t.test("admin soft deletion preserves reports and live order metrics exclude test orders", async () => {
      const issuedAt = String(Math.floor(Date.now()/1000));
      const adminCookie = 'deeppersona_admin=' + issuedAt + '.' + createHmac('sha256','local-admin-fixture').update('admin.'+issuedAt).digest('hex');
      const preview = await save(0);
      const patch = (deleted, cookie = adminCookie, origin = base) => fetch(base + '/api/admin/email-users', {method:'PATCH',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify({sessionId:preview.body.sessionId,deleted})});
      assert.equal((await patch(true, '')).status,401);
      assert.equal((await patch(true, adminCookie, 'https://evil.example')).status,403);
      const before = (await call('/api/admin/stats',{cookie:adminCookie})).data;
      assert.equal((await patch(true)).status,200);
      assert.equal((await patch(true)).status,200);
      const deleted = (await call('/api/admin/stats',{cookie:adminCookie})).data;
      assert.ok(deleted.emails.find(row=>row.session_id===preview.body.sessionId).deleted_at);
      assert.equal(deleted.totals.leads,before.totals.leads-1);
      assert.equal((await reportState(preview)).data.unlocked,true);
      assert.equal((await patch(false)).status,200);
      const restored = (await call('/api/admin/stats',{cookie:adminCookie})).data;
      assert.equal(restored.emails.find(row=>row.session_id===preview.body.sessionId).deleted_at,null);
      assert.equal(restored.totals.leads,before.totals.leads);
      const record = restored.emails.find(row => row.session_id === preview.body.sessionId);
      assert.equal(record.answers.length, questions.length);
      assert.equal(record.answers[0].optionLabel, questions[0].options[0].label);
      assert.equal(record.answers[0].source, 'snapshot');
      assert.equal('result_type' in record, false);
      assert.equal('answers_json' in record, false);
      assert.equal('snapshot_json' in record, false);
      assert.equal('scoreKey' in record.answers[0], false);
      for (const [id,live,amount,status,paid] of [['metric_live',1,500,'paid',true],['metric_refund',1,500,'refunded',true],['metric_sandbox',0,500,'paid',true],['preview_metric',1,500,'paid',true],['metric_pending',1,500,'pending',false],['metric_free',1,0,'paid',true]]) {
        await db.prepare("INSERT INTO payment_orders (id,report_id,amount_cents,livemode,status,paid_at) VALUES (?,?,?,?,?,CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)").bind(id,id,amount,live,status,paid?1:0).run();
      }
      const metrics = (await call('/api/admin/stats',{cookie:adminCookie})).data.orders;
      assert.equal(metrics.days.length,14);
      assert.equal(metrics.today,2);
      assert.equal(metrics.lastSeven,2);
      assert.equal(metrics.previousSeven,0);
    });

    await t.test("traffic counts anonymous views once per event and excludes marked sessions without treating one answer as completion", async () => {
      const issuedAt=String(Math.floor(Date.now()/1000));
      const cookie='deeppersona_admin='+issuedAt+'.'+createHmac('sha256','local-admin-fixture').update('admin.'+issuedAt).digest('hex');
      const stats=async()=>(await call('/api/admin/stats',{cookie})).data.traffic;
      const page={anonymous:true,id:crypto.randomUUID(),page:'/tests'};
      const before=await stats();
      assert.equal((await call('/api/traffic',{body:page})).status,200);
      assert.equal((await call('/api/traffic',{body:page})).status,200);
      assert.equal((await call('/api/traffic',{body:{...page,page:'/reports/private'}})).status,400);
      assert.equal((await call('/api/traffic',{body:page,origin:'https://evil.example'})).status,403);
      assert.equal((await stats()).anonymous.pageviews,before.anonymous.pageviews+1);
      const sessionId=crypto.randomUUID();
      const event={sessionId,testId,source:'tiktok',campaign:'account_a',content:'video_1',medium:'organic'};
      await call('/api/events',{body:{...event,eventName:'session_started'}});
      await call('/api/events',{body:{...event,eventName:'answer_selected',questionId:questions[0].id,step:1}});
      await call('/api/events',{body:{...event,eventName:'answer_selected',questionId:questions[0].id,step:1}});
      let current=await stats();
      assert.equal(current.operations.started,before.operations.started+1);
      assert.equal(current.operations.finished,before.operations.finished);
      assert.equal(current.sources.find(row=>row.campaign==='account_a').content,'video_1');
      await call('/api/events',{body:{...event,eventName:'email_gate_viewed',step:5}});
      current=await stats();
      assert.equal(current.operations.finished,before.operations.finished+1);
      await db.prepare("UPDATE quiz_sessions SET email='internal@example.com' WHERE id=?").bind(sessionId).run();
      const mark=await fetch(base+'/api/admin/email-users',{method:'PATCH',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({sessionId,isTest:true})});
      assert.equal(mark.status,200);
      current=await stats();
      assert.equal(current.operations.started,before.operations.started);
      assert.equal(current.operations.finished,before.operations.finished);
    });

    await t.test("checkout limits repeated requests per report owner without blocking another owner", async () => {
      const report=await save(0);
      let last;
      for(let i=0;i<31;i++) last=await call('/api/checkout',{cookie:report.cookie,body:{reportId:report.id}});
      assert.equal(last.status,429);
      assert.equal(last.headers.get('retry-after'),'60');
      const other=await save(0);
      assert.equal((await call('/api/checkout',{cookie:other.cookie,body:{reportId:other.id}})).status,200);
    });

    await t.test("new reports use selected option text while legacy purchased snapshots remain readable", async () => {
      const fresh = await save(0);
      const state = (await reportState(fresh)).data;
      assert.ok(["anxious", "avoidant", "secure", "fearful"].includes(state.result.key));
      assert.equal(state.deepResult.depth,undefined);
      assert.equal(state.questions[0].options[0].scoreKey,undefined);
      assert.ok(state.result.title.length > 0);
      assert.ok(state.result.themeTitle);
      assert.equal(typeof state.result.anxiety, "number");
      assert.equal(state.deepResult.modules.length,1);
      assert.ok(state.deepResult.modules[0].explanation.includes(state.questions[0].options[0].label));
      const saved = await db.prepare('SELECT answers_json,result_type FROM quiz_sessions WHERE id=?').bind(fresh.body.sessionId).first();
      assert.equal(saved.result_type,'choices');
      assert.equal(JSON.parse(saved.answers_json)[questions[0].id],0);
      const legacy = JSON.parse((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(fresh.id).first()).snapshot_json);
      legacy.result.key='connector';legacy.result.title='Legacy saved report';
      legacy.deepResult.depth={coreDrive:'Original saved paragraph',inRelationships:'Original relationships',underPressure:'Original pressure'};
      await db.prepare('UPDATE quiz_reports SET snapshot_json=? WHERE id=?').bind(JSON.stringify(legacy),fresh.id).run();
      const historical=(await reportState(fresh)).data;
      assert.equal(historical.result.title,'Legacy saved report');
      assert.equal(historical.deepResult.depth.coreDrive,'Original saved paragraph');
    });
  } finally { await mf.dispose(); }
});
