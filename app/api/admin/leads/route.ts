import { isAdminRequest } from "@/app/admin-auth";
import { getAdminLeadDetail, listAdminLeads } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session")?.trim();

  try {
    if (sessionId) {
      const detail = await getAdminLeadDetail(sessionId);
      if (!detail) return Response.json({ error: "Lead not found" }, { status: 404 });
      return Response.json(detail);
    }

    const result = await listAdminLeads({
      consentOnly: url.searchParams.get("consent") === "1",
      limit: Number(url.searchParams.get("limit") ?? 50),
      offset: Number(url.searchParams.get("offset") ?? 0),
      query: url.searchParams.get("q") ?? undefined,
      segment: url.searchParams.get("segment") ?? "all",
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load leads" },
      { status: 500 },
    );
  }
}
