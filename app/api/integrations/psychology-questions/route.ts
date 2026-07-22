import { getRuntimeEnv, listQuestions } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hasValidApiKey(value: string | null): Promise<boolean> {
  const expected = getRuntimeEnv().CONTENT_SYNC_API_KEY;
  if (!value || !expected) return false;
  const [providedDigest, expectedDigest] = await Promise.all([digest(value), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) difference |= providedDigest[index] ^ expectedDigest[index];
  return difference === 0;
}

function absoluteHttpsUrl(value: string, request: Request): string {
  const url = new URL(value, request.url);
  url.protocol = "https:";
  return url.toString();
}

export async function GET(request: Request) {
  if (!await hasValidApiKey(request.headers.get("X-API-Key"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await listQuestions();
  return Response.json({
    items: questions.map((question) => ({
      id: question.id,
      testId: question.testId,
      kicker: question.kicker,
      prompt: question.prompt,
      imageUrl: absoluteHttpsUrl(question.atlasPath, request),
      position: question.position,
      options: question.options.map((option) => ({
        label: option.label,
        microcopy: option.microcopy,
        scoreKey: option.scoreKey,
        meaning: option.meaning,
        projection: option.projection,
      })),
    })),
  });
}
