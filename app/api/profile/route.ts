import { getProfileSummary } from "@/db/quiz-store";
import { readProfileId } from "@/lib/profile-cookie";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profileId = readProfileId(request);
  if (!profileId) return Response.json({ completedTestIds: [] });
  try {
    return Response.json(await getProfileSummary(profileId));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load profile" },
      { status: 500 },
    );
  }
}