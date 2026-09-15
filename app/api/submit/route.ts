import { getD1, getProfileSummary, listQuestions, listTests, submitQuiz } from "@/db/quiz-store";
import { ensurePaymentSchema, type ReportRow } from "@/db/payment-store";
import { validateEmailAddress } from "@/lib/email-validation";
import { buildChoiceReport } from "@/lib/deep-results";
import { catalogQuestion, publicTest } from "@/lib/public-quiz";
import { createProfileId, profileCookie, readProfileId } from "@/lib/profile-cookie";
import { PaymentError, paymentError, requireSameOrigin } from "@/lib/payment-http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as {
      sessionId?: string; testId?: string; email?: string; marketingConsent?: boolean;
      answerChoices?: Record<string, number>; source?: string; campaign?: string; relationshipId?: string;
    };
    const email = validateEmailAddress(typeof body.email === "string" ? body.email : "");
    if (!email.valid) throw new PaymentError(email.message);
    if (typeof body.sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.sessionId) ||
        typeof body.testId !== "string" || !body.answerChoices || typeof body.answerChoices !== "object") {
      throw new PaymentError("Please complete the test before saving your report.");
    }
    await ensurePaymentSchema();
    const profileId = readProfileId(request) ?? createProfileId();
    const existing = await getD1().prepare("SELECT * FROM quiz_reports WHERE session_id = ?")
      .bind(body.sessionId).first<ReportRow>();
    if (existing) {
      if (existing.profile_id !== profileId) throw new PaymentError("This test has already been saved.", 409);
      return Response.json({ ok: true, reportId: existing.id, profile: await getProfileSummary(profileId) },
        { headers: { "Cache-Control": "no-store" } });
    }
    const test = (await listTests()).find((item) => item.id === body.testId);
    if (!test) throw new PaymentError("This test is unavailable.", 404);
    const questions = await listQuestions(test.id);
    const choices = body.answerChoices;
    if (!questions.length || Object.keys(choices).length !== questions.length ||
        questions.some((question) => !Number.isInteger(choices[question.id]) || !question.options[choices[question.id]])) {
      throw new PaymentError("The questions have changed. Please restart this test.", 409);
    }
    const answers = Object.fromEntries(questions.map(q => [q.id, choices[q.id]]));
    const { result, deepResult } = buildChoiceReport(test, questions, choices);
    const reportId = crypto.randomUUID();
    const profile = await submitQuiz({
      sessionId: body.sessionId, profileId, email: email.normalized, marketingConsent: body.marketingConsent === true,
      answers, resultType: "choices", testId: test.id,
      source: typeof body.source === "string" ? body.source.slice(0, 120) : undefined,
      campaign: typeof body.campaign === "string" ? body.campaign.slice(0, 160) : undefined,
      relationshipId: typeof body.relationshipId === "string" ? body.relationshipId.slice(0, 100) : undefined,
      report: { id: reportId, free: test.reportPriceCents === 0, snapshotJson: JSON.stringify({
        test: publicTest(test), result, questions: questions.map(catalogQuestion), answerChoices: choices, deepResult,
      }) },
    });
    return Response.json({ ok: true, reportId, profile }, {
      headers: { "set-cookie": profileCookie(profileId), "Cache-Control": "no-store" },
    });
  } catch (error) { return paymentError(error); }
}
