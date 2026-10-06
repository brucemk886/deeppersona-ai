// One random token per short-link request; no IP, cookies, or visitor fingerprint.
export const LINK_TRAFFIC_SCHEMA = [
 "CREATE TABLE IF NOT EXISTS traffic_link_state (id TEXT PRIMARY KEY, started_at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS traffic_link_clicks (id TEXT PRIMARY KEY, code TEXT NOT NULL, campaign TEXT NOT NULL, clicked_at INTEGER NOT NULL, arrived_at INTEGER, excluded INTEGER NOT NULL DEFAULT 0)",
 "CREATE INDEX IF NOT EXISTS traffic_link_clicks_campaign_date ON traffic_link_clicks(campaign, clicked_at)"
];
const ready = new WeakMap<object, Promise<void>>();
export async function ensureLinkTraffic(db: D1Database, now = Date.now()) {
 let pending = ready.get(db);
 if (!pending) {
  pending = (async () => {
   await db.batch(LINK_TRAFFIC_SCHEMA.map(sql => db.prepare(sql)));
   await db.prepare("INSERT OR IGNORE INTO traffic_link_state(id,started_at) VALUES('v1',?)").bind(now).run();
  })().catch(error => { ready.delete(db); throw error; });
  ready.set(db, pending);
 }
 await pending;
}
export async function registerLinkClick(request: Request, db: D1Database | undefined, code: string, target: URL, now = Date.now()): Promise<string | null> {
 if (!db || request.method !== 'GET') return null;
 try {
  await ensureLinkTraffic(db, now);
  const campaign = target.searchParams.get('utm_campaign') || '';
  if (!/^factory-[a-zA-Z0-9_-]{1,100}$/.test(campaign)) return null;
  const agent = request.headers.get('user-agent') || '';
  const purpose = (request.headers.get('purpose') || '') + ' ' + (request.headers.get('sec-purpose') || '');
  const excluded = !agent || /bot|crawler|spider|preview|facebookexternalhit|headless|curl|wget/i.test(agent) || /prefetch|prerender|preview/i.test(purpose);
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO traffic_link_clicks(id,code,campaign,clicked_at,excluded) VALUES(?,?,?,?,?)').bind(id,code,campaign,now,Number(excluded)).run();
  return id;
 } catch {
  console.error(JSON.stringify({event:'link-cohort-record-failed'}));
  return null; // Analytics failure must not prevent a visit.
 }
}
export async function handleLinkArrival(request: Request, db: D1Database, now = Date.now()): Promise<Response | null> {
 const url = new URL(request.url);
 if (url.pathname !== '/api/link-arrival') return null;
 const headers = {'Cache-Control':'no-store'};
 if (request.method !== 'POST') return new Response(null,{status:405,headers});
 if (request.headers.get('origin') !== url.origin) return new Response(null,{status:403,headers});
 if (Number(request.headers.get('content-length') || 0) > 128) return new Response(null,{status:413,headers});
 try {
  const raw = await request.text();
  if (raw.length > 128) return new Response(null,{status:413,headers});
  const input = JSON.parse(raw);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input?.clickId || '')) return new Response(null,{status:400,headers});
  await ensureLinkTraffic(db,now);
  await db.prepare('UPDATE traffic_link_clicks SET arrived_at=COALESCE(arrived_at,?) WHERE id=? AND clicked_at<=? AND clicked_at>=?')
   .bind(now,input.clickId,now,now-7*86400000).run();
  return new Response(null,{status:204,headers});
 } catch {
  return new Response(null,{status:503,headers});
 }
}
