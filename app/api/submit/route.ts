import { submitQuiz } from "@/db/quiz-store";
import { validateEmailAddress } from "@/lib/email-validation";
import { TRAIT_KEYS, type TraitKey } from "@/lib/quiz";
import { createProfileId, profileCookie, readProfileId } from "@/lib/profile-cookie";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    answers?: Record<string, TraitKey>;
    campaign?: string;
    email?: string;
    marketingConsent?: boolean;
    relationshipId?: string;
    resultType?: TraitKey;
    sessionId?: string;
    source?: string;
    testId?: string;
  };

  const emailValidation = validateEmailAddress(body.email ?? "");
  if (
    !body.sessionId ||
    !emailValidation.valid ||
    !body.answers ||
    !body.resultType ||
    !body.testId ||
    !TRAIT_KEYS.includes(body.resultType)
  ) {
    return Response.json(
      { error: emailValidation.valid ? "Please provide a valid email." : emailValidation.message },
      { status: 400 },
    );
  }

  const profileId = readProfileId(request) ?? createProfileId();
  const profile = await submitQuiz({
    sessionId: body.sessionId,
    profileId,
    email: emailValidation.normalized,
    marketingConsent: Boolean(body.marketingConsent),
    answers: body.answers,
    resultType: body.resultType,
    source: body.source?.slice(0, 120),
    campaign: body.campaign?.slice(0, 160),
    relationshipId: body.relationshipId?.slice(0, 100),
    testId: body.testId.slice(0, 100),
  });
  return Response.json(
    { ok: true, resultType: body.resultType, profile },
    { headers: { "set-cookie": profileCookie(profileId) } },
  );
}
