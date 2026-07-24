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
  "heartbeat",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
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
    !body.sessionId ||
    body.sessionId.length > 100 ||
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
  return Response.json({ ok: true });
}
