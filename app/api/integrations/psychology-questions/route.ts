import { getRuntimeEnv, listQuestions, listTests } from "@/db/quiz-store";

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

/** Content-sync feed for Local Factory psychology automation. Active catalog only. */
export async function GET(request: Request) {
  if (!(await hasValidApiKey(request.headers.get("X-API-Key")))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tests, questions] = await Promise.all([listTests(false), listQuestions(undefined, false)]);
  const testById = new Map(tests.map((test) => [test.id, test]));

  return Response.json({
    source: "deeppersona-ai",
    tests: tests.map((test) => ({
      id: test.id,
      title: test.title,
      kicker: test.kicker,
      description: test.description,
      coverImageUrl: absoluteHttpsUrl(test.coverAtlasPath, request),
      position: test.position,
      questionCount: test.questionCount ?? 0,
    })),
    items: questions.map((question) => {
      const test = testById.get(question.testId);
      return {
        id: question.id,
        testId: question.testId,
        testTitle: test?.title ?? question.testId,
        testKicker: test?.kicker ?? "",
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
      };
    }),
  });
}
