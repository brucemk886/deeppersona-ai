import { registerLinkClick } from './link-traffic';
type LinkService = { fetch(request: Request): Promise<Response> };
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
export async function routeShortLink(request: Request, service?: LinkService, db?: D1Database): Promise<Response | null> {
 const url = new URL(request.url);
 const compact = /^\/[1-9][a-z0-9]{4}$/.test(url.pathname);
 if (!compact && !url.pathname.startsWith('/go/')) return null;
 if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
 if (!compact && !/^\/go\/[a-f0-9]{10}$/.test(url.pathname)) return new Response('Link not found', { status: 404, headers });
 try {
  if (!service) throw new Error('Link service unavailable');
  const forwarded = new Headers();
  for (const name of ['user-agent', 'purpose', 'sec-purpose']) {
   const value = request.headers.get(name);
   if (value) forwarded.set(name, value);
  }
  const result = await service.fetch(new Request('https://factory.tiktokaitool.com' + url.pathname, { method: request.method, headers: forwarded, redirect: 'manual' }));
  if (result.status === 404) return new Response('Link not found', { status: 404, headers });
  const location = result.headers.get('location');
  const target = location ? new URL(location) : null;
  if (result.status !== 302 || target?.origin !== 'https://deeppersonaai.com' || target.pathname !== '/' || target.username || target.password) throw new Error('Invalid redirect');
  // Always record the original immutable code, so both URLs share one funnel.
  const code = result.headers.get('X-Factory-Link-Code') || (!compact ? url.pathname.slice(4) : '');
  if (!/^[a-f0-9]{10}$/.test(code)) throw new Error('Invalid link identity');
  const clickId = await registerLinkClick(request, db, code, target);
  if (clickId) target.searchParams.set('lf_click', clickId);
  return new Response(null, { status: 302, headers: { ...headers, Location: target.href } });
 } catch {
  return new Response('Link temporarily unavailable. Please try again.', { status: 503, headers });
 }
}
