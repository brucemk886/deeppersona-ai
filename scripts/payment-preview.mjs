import { Miniflare } from 'miniflare';
import { readFileSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { parseEnv } from 'node:util';
import { createServer, request as httpRequest } from 'node:http';

import { localPaymentRoutes } from './local-payment-routes.mjs';
const bindings = parseEnv(readFileSync('.dev.vars','utf8'));
const mf = new Miniflare({
  modules: ['index.js', ...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js') && p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})), modulesRoot:resolve('dist/server'),
  compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],
  bindings,
  d1Databases:['DB'],d1Persist:'.wrangler/payment-dev',
  port:0,host:'127.0.0.1',inspectorPort:0,
});
const workerUrl = new URL(await mf.ready);
const initialization = await mf.dispatchFetch('http://localhost/api/tests');
await initialization.text();
const localPayments = await localPaymentRoutes(bindings);
// Serve static files in Node: the Miniflare asset RPC bridge can hang on Windows.
const assetRoot = resolve('dist/client');
const contentTypes = { '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.json':'application/json' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
  const handler = request.method === 'POST' && pathname === '/api/checkout' ? localPayments.routes.checkout
    : request.method === 'POST' && pathname === '/api/stripe/webhook' ? localPayments.routes.webhook
    : request.method === 'GET' && reportMatch ? localPayments.routes.report : null;
  if (handler) {
    try {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const localRequest = new Request('http://' + request.headers.host + request.url, {
        method:request.method, headers:request.headers,
        ...(request.method === 'POST' ? {body:Buffer.concat(chunks)} : {}),
      });
      const result = await handler(localRequest, {params:Promise.resolve({id:reportMatch?.[1]})});
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch { response.writeHead(503);response.end('Local payment request failed.'); }
    return;
  }
  let path;
  try { path = resolve(assetRoot, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)); }
  catch { response.writeHead(400); response.end(); return; }
  if (path.startsWith(assetRoot + sep) && ['GET','HEAD'].includes(request.method)) {
    try {
      if (statSync(path).isFile()) {
        response.writeHead(200, { 'content-type':contentTypes[extname(path)] || 'application/octet-stream', 'cache-control':'no-store' });
        if (request.method === 'HEAD') response.end(); else createReadStream(path).pipe(response);
        return;
      }
    } catch { /* Dynamic route or missing static asset. */ }
  }
  const upstream = httpRequest({ hostname:workerUrl.hostname, port:workerUrl.port, path:request.url,
    method:request.method, headers:request.headers, timeout:60000 }, (result) => {
    response.writeHead(result.statusCode || 502, result.headers); result.pipe(response);
  });
  upstream.on('timeout', () => upstream.destroy(new Error('Local Worker timeout')));
  upstream.on('error', () => { if (!response.headersSent) response.writeHead(503); response.end('Local preview unavailable. Please retry.'); });
  request.pipe(upstream);
});
await new Promise((ready) => server.listen(8787, '127.0.0.1', ready));
console.log('Payment preview ready: http://127.0.0.1:8787/');
const keepAlive = setInterval(() => {}, 60000);
process.on('SIGINT',async()=>{clearInterval(keepAlive);server.close();await mf.dispose();localPayments.close();process.exit();});

