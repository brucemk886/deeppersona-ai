import { getD1, submitQuiz } from "@/db/quiz-store";
import { ensurePaymentSchema, type ReportRow } from "@/db/payment-store";
import { validateEmailAddress } from "@/lib/email-validation";
import { createProfileId, profileCookie, readProfileId } from "@/lib/profile-cookie";
import { PaymentError, paymentError, requireSameOrigin } from "@/lib/payment-http";
import { ASTRO_TEST_ID, buildAstroSnapshot, parseAstroInput, projectReading, type AstroSnapshot } from "@/lib/astro";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const raw = await request.text();
    if (raw.length > 8192) throw new PaymentError("Request too large.", 413);
    const body = JSON.parse(raw) as { sessionId?: unknown; email?: unknown; source?: unknown; campaign?: unknown };
    const email = validateEmailAddress(typeof body.email === "string" ? body.email : "");
    if (!email.valid) throw new PaymentError(email.message);
    if (typeof body.sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.sessionId)) throw new PaymentError("Please complete the quiz first.");
    const parsed = parseAstroInput(body);
    if (!parsed.ok) throw new PaymentError(parsed.error);
    await ensurePaymentSchema();
    const profileId = readProfileId(request) ?? createProfileId();
    const headers = { "set-cookie": profileCookie(profileId), "Cache-Control": "no-store" };

    const existing = await getD1().prepare("SELECT * FROM quiz_reports WHERE session_id = ?").bind(body.sessionId).first<ReportRow>();
    if (existing) {
      if (existing.profile_id !== profileId || existing.test_id !== ASTRO_TEST_ID) throw new PaymentError("This quiz has already been saved.", 409);
      if (existing.email !== email.normalized) throw new PaymentError("This reading is already saved with a different email. Use the original email or start again.", 409);
      const snapshot = JSON.parse(existing.snapshot_json) as AstroSnapshot;
      return Response.json({ ok: true, reportId: existing.id, reading: projectReading(snapshot, "free") }, { headers });
    }

    // Signs are always recomputed on the server from the birth data.
    const snapshot = buildAstroSnapshot(parsed.value);
    const reportId = crypto.randomUUID();
    await submitQuiz({
      sessionId: body.sessionId, profileId, email: email.normalized,
      // The email screen discloses the free weekly forecast with an unsubscribe option.
      marketingConsent: true,
      answers: snapshot.answerChoices, resultType: "choices", testId: ASTRO_TEST_ID,
      source: typeof body.source === "string" ? body.source.slice(0, 120) : undefined,
      campaign: typeof body.campaign === "string" ? body.campaign.slice(0, 160) : undefined,
      // free = 0: the report is unlocked only by a paid payment_orders row.
      report: { id: reportId, free: false, snapshotJson: JSON.stringify(snapshot) },
    });
    return Response.json({ ok: true, reportId, reading: projectReading(snapshot, "free") }, { headers });
  } catch (error) {
    if (error instanceof SyntaxError) return paymentError(new PaymentError("Invalid request."));
    return paymentError(error);
  }
}
