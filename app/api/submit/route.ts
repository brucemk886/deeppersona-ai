import { submitQuiz } from "@/db/quiz-store";
import { TRAIT_KEYS, type TraitKey } from "@/lib/quiz";
import { createProfileId, profileCookie, readProfileId } from "@/lib/profile-cookie";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    answers?: Record<string, TraitKey>;
    campaign?: string;
    email?: string;
    marketingConsent?: boolean;
    resultType?: TraitKey;
    sessionId?: string;
    source?: string;
    testId?: string;
  };

  if (
    !body.sessionId ||
    !body.email ||
    !emailPattern.test(body.email) ||
    !body.answers ||
    !body.resultType ||
    !body.testId ||
    !TRAIT_KEYS.includes(body.resultType)
  ) {
    return Response.json({ error: "Please provide a valid email." }, { status: 400 });
  }

  const profileId = readProfileId(request) ?? createProfileId();
  const profile = await submitQuiz({
    sessionId: body.sessionId,
    profileId,
    email: body.email.toLowerCase().slice(0, 254),
    marketingConsent: Boolean(body.marketingConsent),
    answers: body.answers,
    resultType: body.resultType,
    source: body.source?.slice(0, 120),
    campaign: body.campaign?.slice(0, 160),
    testId: body.testId.slice(0, 100),
  });
  return Response.json(
    { ok: true, resultType: body.resultType, profile },
    { headers: { "set-cookie": profileCookie(profileId) } },
  );
}
