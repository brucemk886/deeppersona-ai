import { buildPsychologySyncFeed } from "@/lib/psychology-sync";
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

/** Content-sync feed for Local Factory psychology automation. Active catalog only. */
export async function GET(request: Request) {
  if (!(await hasValidApiKey(request.headers.get("X-API-Key")))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tests, questions] = await Promise.all([listTests(false), listQuestions(undefined, false)]);
  return Response.json(buildPsychologySyncFeed(tests, questions, request.url));
}
