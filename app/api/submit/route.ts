import { restoreRetiredCoreSkips } from "@/lib/attachment-fixed-compat";
import { getFixedTemplates } from "@/db/fixed-report-store";
import { FIXED_VERSION, isFixedQuestion } from "@/lib/attachment-fixed";
import { getD1, getProfileSummary, listQuestions, listTests, submitQuiz } from "@/db/quiz-store";
import { ensurePaymentSchema, type ReportRow } from "@/db/payment-store";
import { validateEmailAddress } from "@/lib/email-validation";
import { ATTACHMENT_TEST_ID, PUBLIC_QUESTION_IDS } from "@/lib/public-catalog";
import { isLaunchQuestion, LAUNCH_PREFIX } from "@/lib/attachment-launch";
import type { QuizQuestion } from "@/lib/quiz";
import { buildChoiceReport } from "@/lib/deep-results";
import { catalogQuestion, publicTest } from "@/lib/public-quiz";
import { createProfileId, profileCookie, readProfileId } from "@/lib/profile-cookie";
import { PaymentError, paymentError, requireSameOrigin } from "@/lib/payment-http";

function hasCompleteAnswers(questions: QuizQuestion[], choices: Record<string, number>) {
  return questions.length > 0 && Object.keys(choices).length === questions.length &&
    questions.every((question) => Number.isInteger(choices[question.id]) && Boolean(question.options[choices[question.id]]));
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as {
      sessionId?: string; testId?: string; email?: string; marketingConsent?: boolean;
      answerChoices?: Record<string, number>; answerOptionIds?: Record<string,string>; source?: string; campaign?: string; relationshipId?: string;
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
      if (existing.email !== email.normalized) {
        throw new PaymentError("This result is already saved with a different email. Use the original email to reopen it, or start a new test.", 409);
      }
      return Response.json({ ok: true, reportId: existing.id, profile: await getProfileSummary(profileId) },
        { headers: { "Cache-Control": "no-store" } });
    }
    const test = (await listTests()).find((item) => item.id === body.testId);
    if (!test) throw new PaymentError("This test is unavailable.", 404);
    let questions = await listQuestions(test.id);
    const choices = body.answerChoices;
    questions = restoreRetiredCoreSkips(questions, choices, body.answerOptionIds);
    // Only the two explicitly retired, complete attachment editions can finish.
    // Read their retained managed rows; never accept mixed or arbitrary inactive sets.
    if (!hasCompleteAnswers(questions, choices) && test.id === ATTACHMENT_TEST_ID &&
        questions.length > 0 && questions.every(q => isLaunchQuestion(q.id) || isFixedQuestion(q.id))) {
      const ids = Object.keys(choices);
      const oldIds = new Set(Array.from({length:20},(_,i)=>LAUNCH_PREFIX+String(i+1).padStart(2,'0')));
      const accepted = ids.length === 20 && (ids.every(id=>PUBLIC_QUESTION_IDS.has(id)) ||
        (questions.every(q=>isFixedQuestion(q.id)) && ids.every(id=>oldIds.has(id))));
      if (accepted) {
        const previous=(await listQuestions(test.id,true)).filter(q=>ids.includes(q.id));
        if(hasCompleteAnswers(previous,choices)) questions=previous;
      }
    }
    if (!hasCompleteAnswers(questions, choices)) {
      throw new PaymentError("The questions have changed. Please restart this test.", 409);
    }
    if (body.answerOptionIds && questions.some(q => q.reportConfig?.version === FIXED_VERSION && body.answerOptionIds?.[q.id] !== q.options[choices[q.id]].optionId)) {
      throw new PaymentError("The answer options have changed. Please restart this test.",409);
    }
    const templates = questions.some(q=>q.reportConfig?.version === FIXED_VERSION) ? await getFixedTemplates() : undefined;
    const answers = Object.fromEntries(questions.map(q => [q.id, choices[q.id]]));
    const { result, deepResult } = buildChoiceReport(test, questions, choices, templates ?? undefined);
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
