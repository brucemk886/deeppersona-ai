import type { AffiliateProduct, QuizQuestion, QuizTest } from "@/lib/quiz";
import type { InnerProfileSummary } from "@/lib/inner-map";
import type { RelationshipNode, RelationshipType } from "@/lib/relationship-network";
import type { TraitKey } from "@/lib/quiz";

async function readJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    return (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    throw new Error("We could not read the server response. Please try again.");
  }
}

export async function fetchCatalog(): Promise<{ products: AffiliateProduct[]; tests: QuizTest[] }> {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  const data = await readJson<{ error?: string; products?: AffiliateProduct[]; tests?: QuizTest[] }>(response);
  if (!response.ok) throw new Error(data.error ?? "Unable to load the test catalog.");
  return { tests: data.tests ?? [], products: data.products ?? [] };
}

export async function fetchQuestions(testId: string, signal?: AbortSignal): Promise<QuizQuestion[]> {
  const response = await fetch(`/api/questions?test=${encodeURIComponent(testId)}`, {
    cache: "no-store",
    signal,
  });
  const data = await readJson<{ error?: string; questions?: QuizQuestion[] }>(response);
  if (!response.ok || !data.questions?.length) {
    throw new Error(data.error ?? "This test is not available yet.");
  }
  return data.questions;
}

export async function fetchProfile(): Promise<InnerProfileSummary | null> {
  const response = await fetch("/api/profile", { cache: "no-store" });
  if (!response.ok) return null;
  return readJson<InnerProfileSummary>(response);
}

export async function fetchRelationships(): Promise<RelationshipNode[]> {
  const response = await fetch("/api/relationships", { cache: "no-store" });
  const data = await readJson<{ error?: string; relationships?: RelationshipNode[] }>(response);
  if (!response.ok) throw new Error(data.error ?? "Unable to load your relationship map.");
  return data.relationships ?? [];
}

export async function createRelationshipRequest(nickname: string, relationshipType: RelationshipType) {
  const response = await fetch("/api/relationships", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, relationshipType }),
  });
  const data = await readJson<{ error?: string; relationship?: RelationshipNode }>(response);
  if (!response.ok || !data.relationship) throw new Error(data.error ?? "Unable to add this connection.");
  return data.relationship;
}

export async function trackEvent(payload: {
  campaign?: string;
  eventName: string;
  optionLabel?: string;
  questionId?: string;
  sessionId: string;
  source?: string;
  step?: number;
  testId?: string;
}) {
  await fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export async function submitReflection(payload: {
  answers: Record<string, TraitKey>;
  campaign?: string;
  email: string;
  marketingConsent: boolean;
  relationshipId?: string;
  resultType: TraitKey;
  sessionId: string;
  source?: string;
  testId: string;
}) {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson<{ error?: string; profile?: InnerProfileSummary }>(response);
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}
