import { ensureQuizSchema, getD1, listTests } from "./quiz-store";
import { PaymentError } from "@/lib/payment-http";
import type { ReportSnapshot } from "@/lib/payment-types";
import { CURRENT_REFUND_POLICY } from '@/lib/refund-policy';

export type ReportRow = { id: string; session_id: string; profile_id: string; test_id: string; email: string; snapshot_json: string; free: number };
export type OrderRow = { id: string; report_id: string; amount_cents: number; currency: "usd"; status: string; stripe_session_id: string | null; payment_intent_id: string | null; attempt: number; livemode: number; created_at: string };

let schemaReady: Promise<void> | undefined;
export function ensurePaymentSchema(): Promise<void> {
  if (!schemaReady) schemaReady = createPaymentSchema().catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}
async function createPaymentSchema() {
  await ensureQuizSchema();
  await getD1().batch([
    getD1().prepare(`CREATE TABLE IF NOT EXISTS quiz_reports (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE, profile_id TEXT NOT NULL,
      test_id TEXT NOT NULL, email TEXT NOT NULL, snapshot_json TEXT NOT NULL,
      free INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    getD1().prepare(`CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY, report_id TEXT NOT NULL UNIQUE, amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd', status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT UNIQUE, payment_intent_id TEXT, attempt INTEGER NOT NULL DEFAULT 0,
      livemode INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    getD1().prepare("CREATE INDEX IF NOT EXISTS quiz_reports_profile_idx ON quiz_reports(profile_id)"),
    getD1().prepare("CREATE INDEX IF NOT EXISTS payment_orders_intent_idx ON payment_orders(payment_intent_id)"),
    getD1().prepare("CREATE TABLE IF NOT EXISTS payment_order_policies (order_id TEXT PRIMARY KEY, version TEXT NOT NULL, recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    getD1().prepare(`CREATE TABLE IF NOT EXISTS report_emails (
      id TEXT PRIMARY KEY, report_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
      resend_id TEXT, error TEXT, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
      next_attempt INTEGER NOT NULL DEFAULT 0, sent_at INTEGER, first_access_at INTEGER,
      lease_until INTEGER NOT NULL DEFAULT 0
    )`),
    getD1().prepare("CREATE INDEX IF NOT EXISTS report_emails_report_idx ON report_emails(report_id, created_at)"),
    getD1().prepare(`CREATE TABLE IF NOT EXISTS report_email_delivery (
      resend_id TEXT PRIMARY KEY, status TEXT NOT NULL, occurred_at INTEGER NOT NULL,
      event_id TEXT NOT NULL, reason TEXT, received_at INTEGER NOT NULL
    )`),
    getD1().prepare("CREATE INDEX IF NOT EXISTS report_emails_resend_idx ON report_emails(resend_id)"),
    getD1().prepare("CREATE TABLE IF NOT EXISTS report_email_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL)"),
  ]);
}

export async function ownedReport(id: string, profileId: string | null | undefined, request?: Request) {
  await ensurePaymentSchema();
  const token = request?.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`dp_report_${id}=`))?.split('=')[1];
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
    const access = await getD1().prepare('SELECT report_id FROM report_emails WHERE report_id = ? AND token_hash = ? AND expires_at > ?').bind(id, hash, Date.now()).first();
    if (access) {
      const report = await getD1().prepare('SELECT * FROM quiz_reports WHERE id = ?').bind(id).first<ReportRow>();
      if (report) return report;
    }
  }
  if (!profileId) throw new PaymentError("Use the link in your report email or open this report in the browser where you completed the test.", 401);
  const report = await getD1().prepare("SELECT * FROM quiz_reports WHERE id = ? AND profile_id = ?").bind(id, profileId).first<ReportRow>();
  if (!report) throw new PaymentError("Report not found in this browser. Contact support if you need help recovering a purchase.", 404);
  return report;
}

export async function reportOrder(reportId: string) {
  return getD1().prepare("SELECT * FROM payment_orders WHERE report_id = ?").bind(reportId).first<OrderRow>();
}

export async function currentPrice(report: ReportRow) {
  const test = (await listTests(true)).find((item) => item.id === report.test_id);
  if (!test) throw new PaymentError("This test is unavailable.", 404);
  return test.reportPriceCents;
}

export function snapshotOf(report: ReportRow): ReportSnapshot {
  return JSON.parse(report.snapshot_json) as ReportSnapshot;
}

export async function createOrder(report: ReportRow, livemode: boolean, expectedAmount: number) {
  const existing = await reportOrder(report.id);
  if (existing) {
    if (Boolean(existing.livemode) !== livemode) throw new PaymentError("This order belongs to a different payment environment. Please take a new test.", 409);
    return existing;
  }
  const amount = await currentPrice(report);
  if (amount !== expectedAmount) throw new PaymentError("The price has changed. Refresh this page before purchasing.", 409);
  if (!Number.isSafeInteger(amount) || amount < 50 || amount > 99999999) {
    throw new PaymentError("The report price is unavailable. Please contact support.");
  }
  const id = crypto.randomUUID();
  await getD1().batch([
    getD1().prepare(`INSERT OR IGNORE INTO payment_orders (id, report_id, amount_cents, livemode) VALUES (?, ?, ?, ?)`)
      .bind(id, report.id, amount, livemode ? 1 : 0),
    getD1().prepare('INSERT OR IGNORE INTO payment_order_policies (order_id, version) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM payment_orders WHERE id = ?)')
      .bind(id, CURRENT_REFUND_POLICY, id),
  ]);
  return (await reportOrder(report.id))!;
}
