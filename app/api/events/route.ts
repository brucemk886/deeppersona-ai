import { recordEvent } from "@/db/quiz-store";

const allowedEvents = new Set([
  "session_started",
  "quiz_started",
  "question_viewed",
  "answer_selected",
  "email_gate_viewed",
  "result_viewed",
  "upgrade_clicked",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    campaign?: string;
    eventName?: string;
    sessionId?: string;
    source?: string;
    step?: number;
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
    step: body.step,
    source: body.source?.slice(0, 120),
    campaign: body.campaign?.slice(0, 160),
  });
  return Response.json({ ok: true });
}
