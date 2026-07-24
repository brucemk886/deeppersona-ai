import { createRelationship, listRelationships } from "@/db/quiz-store";
import { isRelationshipType } from "@/lib/relationship-network";
import { readProfileId } from "@/lib/profile-cookie";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profileId = readProfileId(request);
  if (!profileId) return Response.json({ relationships: [] });
  try {
    return Response.json({ relationships: await listRelationships(profileId) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load your relationship map." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const profileId = readProfileId(request);
  if (!profileId) return Response.json(
    { error: "Save one reflection first, then you can start your relationship map." },
    { status: 401 },
  );

  const body = (await request.json()) as { nickname?: string; relationshipType?: string };
  const nickname = body.nickname?.trim().replace(/\s+/g, " ");
  if (!nickname || nickname.length > 48 || !isRelationshipType(body.relationshipType)) {
    return Response.json({ error: "Choose a relationship type and a short nickname." }, { status: 400 });
  }

  try {
    const relationship = await createRelationship({
      profileId,
      nickname,
      relationshipType: body.relationshipType,
    });
    return Response.json({ relationship }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to add this relationship." },
      { status: 500 },
    );
  }
}
