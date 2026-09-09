import { recordAttribution } from '@/db/traffic-store';
import { recordEvent } from "@/db/quiz-store";

const allowedEvents = new Set([
  "session_started",
  "quiz_started",
  "question_viewed",
  "answer_selected",
  "insight_accurate",
  "insight_not_quite",
  "insight_more",
  "email_gate_viewed",
  "result_viewed",
  "upgrade_clicked",
  "affiliate_link_clicked",
  "heartbeat",
]);

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, {status:403});
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({error:'Too large'},{status:413});
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return Response.json({error:'Invalid event'},{status:400}); }
  if (!parsed || typeof parsed !== 'object') return Response.json({error:'Invalid event'},{status:400});
  const body = parsed as {
    visitId?: string; medium?: string; content?: string;
    campaign?: string;
    eventName?: string;
    optionLabel?: string;
    questionId?: string;
    sessionId?: string;
    source?: string;
    step?: number;
    testId?: string;
  };
  if (
    typeof body.sessionId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.sessionId) ||
    [body.source,body.campaign,body.medium,body.content,body.questionId,body.optionLabel,body.testId].some(value => value !== undefined && typeof value !== 'string') ||
    (body.step !== undefined && (!Number.isInteger(body.step) || body.step < 0 || body.step > 100)) ||
    !body.eventName ||
    !allowedEvents.has(body.eventName)
  ) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  await recordEvent({
    sessionId: body.sessionId,
    eventName: body.eventName,
    questionId: body.questionId?.slice(0, 100),
    optionLabel: body.optionLabel?.slice(0, 160),
    step: body.step,
    source: body.source?.slice(0, 120),
    campaign: body.campaign?.slice(0, 160),
    testId: body.testId?.slice(0, 100),
  });
  if (body.eventName === 'session_started') await recordAttribution(body.sessionId, {
    visitId: typeof body.visitId === 'string' && /^[a-f0-9-]{36}$/i.test(body.visitId) ? body.visitId : undefined,
    source: body.source?.slice(0,120), campaign: body.campaign?.slice(0,120), medium: body.medium?.slice(0,120), content: body.content?.slice(0,120),
  });
  return Response.json({ ok: true });
}
