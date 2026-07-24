import type { InnerDimensionId } from "@/lib/inner-map";

export const RELATIONSHIP_TYPES = [
  { id: "partner", label: "Partner", description: "A romantic or intimate relationship" },
  { id: "family", label: "Family", description: "A family relationship" },
  { id: "friend", label: "Friend", description: "A friendship" },
  { id: "work", label: "Work", description: "A colleague, manager, or work relationship" },
  { id: "other", label: "Other", description: "Another important connection" },
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]["id"];

export type RelationshipNode = {
  id: string;
  nickname: string;
  relationshipType: RelationshipType;
  reflectionCount: number;
  exploredDimensionIds: InnerDimensionId[];
  lastReflectionAt?: string;
};

export function isRelationshipType(value: unknown): value is RelationshipType {
  return typeof value === "string" && RELATIONSHIP_TYPES.some((type) => type.id === value);
}
