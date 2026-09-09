import { build } from 'esbuild';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Development adapter only. Runs the unchanged payment route source with a
// SQLite implementation of D1 to avoid Windows workerd's outbound-I/O stalls.
export async function localPaymentRoutes(bindings) {
  const directory = resolve('.wrangler/payment-dev/miniflare-D1DatabaseObject');
  const file = readdirSync(directory).find((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite');
  if (!file) throw new Error('Local D1 must be initialized before the payment adapter starts.');
  const sqlite = new DatabaseSync(resolve(directory, file));
  sqlite.exec('PRAGMA busy_timeout = 5000');
  const statement = (sql, values = []) => ({
    bind: (...next) => statement(sql, next),
    async first(column) { const row = sqlite.prepare(sql).get(...values); return row ? (column ? row[column] : row) : null; },
    async all() { return { results: sqlite.prepare(sql).all(...values), success: true }; },
    async run() { const result = sqlite.prepare(sql).run(...values); return { results: [], success: true, meta: { changes: Number(result.changes) } }; },
    async raw() { return sqlite.prepare(sql).all(...values).map(Object.values); },
    sql, values,
  });
  const db = {
    prepare: statement,
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map((item) => {
          const query = sqlite.prepare(item.sql);
          if (query.columns().length) return { results: query.all(...item.values), success: true };
          const result = query.run(...item.values);
          return { results: [], success: true, meta: { changes: Number(result.changes) } };
        });
        sqlite.exec('COMMIT'); return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  globalThis.__localPaymentEnv = { ...bindings, DB: db };
  mkdirSync('work', { recursive: true });
  const output = resolve('work/local-payment-routes.mjs');
  await build({ stdin: { contents: `
    export { POST as checkout } from './app/api/checkout/route';
    export { POST as webhook } from './app/api/stripe/webhook/route';
    export { GET as report } from './app/api/reports/[id]/route';
  `, resolveDir: process.cwd(), loader: 'ts' }, outfile: output,
    bundle: true, platform: 'node', format: 'esm', packages: 'external',
    plugins: [{ name: 'local-cloudflare-env', setup(builder) {
      builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'env', namespace: 'local-env' }));
      builder.onLoad({ filter: /.*/, namespace: 'local-env' }, () => ({ contents: 'export const env = globalThis.__localPaymentEnv;' }));
    } }],
  });
  const routes = await import(pathToFileURL(output).href);
  return { routes, close: () => sqlite.close() };
}
