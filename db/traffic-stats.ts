import { getD1 } from './quiz-store';
import { ensurePaymentSchema } from './payment-store';
import { ensureTrafficSchema } from './traffic-store';
import {
  adminStatsTimePredicate,
  completeAdminStatsSeries,
  isHourlyAdminStatsRange,
  resolveAdminStatsRange,
} from '@/lib/admin-stats-range';

export const productionSession = `s.id NOT IN (SELECT session_id FROM admin_test_sessions)
 AND NOT EXISTS (SELECT 1 FROM quiz_reports xr JOIN payment_orders xo ON xo.report_id=xr.id
 WHERE xr.session_id=s.id AND (xo.livemode=0 OR substr(xo.id,1,8)='preview_'))`;

export async function getTrafficStats(rangeInput?: string | null) {
  await ensureTrafficSchema();
  await ensurePaymentSchema();
  const db = getD1();
  const range = resolveAdminStatsRange(rangeInput);
  const hourly = isHourlyAdminStatsRange(range);
  const sessionPredicate = adminStatsTimePredicate('s.started_at', range);
  const pagePredicate = adminStatsTimePredicate('created_at', range);
  const dayExpr = hourly
    ? `strftime('%Y-%m-%d %H:00', started_at, '+8 hours')`
    : `date(started_at, '+8 hours')`;
  const base = `WITH cohort AS (SELECT s.*, a.visit_id,
    COALESCE(a.source, CASE WHEN s.source IN ('deeppersonaai.com','www.deeppersonaai.com') THEN 'unknown' ELSE s.source END, 'unknown') AS acquisition,
    COALESCE(a.campaign,s.campaign,'') AS campaign_label, COALESCE(a.medium,'') AS medium, COALESCE(a.content,'') AS content,
    CASE WHEN s.completed_at IS NOT NULL OR EXISTS (SELECT 1 FROM quiz_events e WHERE e.session_id=s.id AND e.event_name='email_gate_viewed') THEN 1 ELSE 0 END AS finished,
    CASE WHEN s.completed_at IS NOT NULL AND s.email IS NOT NULL THEN 1 ELSE 0 END AS submitted,
    CASE WHEN EXISTS (SELECT 1 FROM quiz_reports r JOIN payment_orders o ON o.report_id=r.id WHERE r.session_id=s.id AND o.livemode=1 AND (o.stripe_session_id IS NOT NULL OR o.paid_at IS NOT NULL)) THEN 1 ELSE 0 END AS checkout,
    CASE WHEN EXISTS (SELECT 1 FROM quiz_reports r JOIN payment_orders o ON o.report_id=r.id WHERE r.session_id=s.id AND o.livemode=1 AND o.amount_cents>0 AND o.paid_at IS NOT NULL AND o.status IN ('paid','refunded')) THEN 1 ELSE 0 END AS paid
    FROM quiz_sessions s LEFT JOIN quiz_attribution a ON a.session_id=s.id
    WHERE ${productionSession} AND ${sessionPredicate})`;
  const [operations, sources, daily, questions, anonymous] = await Promise.all([
    db.prepare(`${base} SELECT COUNT(*) AS started, COALESCE(SUM(finished),0) AS finished, COALESCE(SUM(submitted),0) AS submitted, COUNT(DISTINCT CASE WHEN submitted=1 THEN lower(email) END) AS emails, COALESCE(SUM(checkout),0) AS checkout, COALESCE(SUM(paid),0) AS paid FROM cohort`).first(),
    db.prepare(`${base} SELECT acquisition AS source, campaign_label AS campaign, medium, content, COUNT(*) AS started, SUM(finished) AS finished, SUM(submitted) AS submitted, SUM(checkout) AS checkout, SUM(paid) AS paid FROM cohort GROUP BY acquisition,campaign_label,medium,content ORDER BY started DESC`).all(),
    db.prepare(`${base} SELECT ${dayExpr} AS day, COUNT(*) AS started, COALESCE(SUM(finished),0) AS finished FROM cohort GROUP BY day`).all<{day:string;started:number;finished:number}>(),
    db.prepare(`${base}, per_question AS (SELECT e.test_id,e.question_id,e.session_id,MAX(CASE WHEN e.event_name='answer_selected' THEN 1 ELSE 0 END) AS answered FROM quiz_events e JOIN cohort c ON c.id=e.session_id WHERE e.question_id IS NOT NULL AND e.event_name IN ('question_viewed','answer_selected') GROUP BY e.test_id,e.question_id,e.session_id)
      SELECT p.test_id,p.question_id,COALESCE(t.title,p.test_id) AS test_title,COALESCE(q.prompt,p.question_id) AS prompt,COUNT(*) AS reached,SUM(answered) AS answered FROM per_question p LEFT JOIN quiz_questions q ON q.id=p.question_id LEFT JOIN quiz_tests t ON t.id=p.test_id GROUP BY p.test_id,p.question_id ORDER BY p.test_id,q.position`).all(),
    db.prepare(`SELECT COUNT(*) AS pageviews FROM traffic_anonymous_pages WHERE ${pagePredicate}`).first<{ pageviews: number }>(),
  ]);
  const days = completeAdminStatsSeries(range, daily.results.map((row) => ({
    day: row.day,
    sessions: Number(row.started ?? 0),
    leads: Number(row.finished ?? 0),
  }))).map((row) => ({ day: row.day, started: row.sessions, finished: row.leads }));
  return { updatedAt: new Date().toISOString(), range, anonymous, operations, sources: sources.results, days, questions: questions.results };
}
