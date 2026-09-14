export const TRAIT_KEYS = ["explorer", "connector", "architect", "creator"] as const;
export const PRESENTATION_MODES = ["image", "text"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export function normalizePresentationMode(value: unknown): PresentationMode {
  return value === "text" ? "text" : "image";
}

/** Image tiles render only for image-mode quizzes that actually have an atlas. */
export function showsOptionImages(
  test?: { presentationMode?: string | null } | null,
  atlasPath?: string | null,
): boolean {
  return normalizePresentationMode(test?.presentationMode) === "image" && Boolean(atlasPath);
}

export type QuizOption = {
  readingFocus?: string;
  label: string;
  microcopy: string;
  meaning: string;
  projection: string;
  styleKey?: string;
  cardTone?: string;
};

export type QuizQuestion = {
  id: string;
  testId: string;
  kicker: string;
  prompt: string;
  atlasPath: string;
  position: number;
  active: boolean;
  options: QuizOption[];
};

export type AffiliateRecommendation = {
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
};
export type AffiliateProduct = {
  id: string;
  name: string;
  description: string;
  url: string;
  buttonLabel: string;
  active: boolean;
  position: number;
};

export type ResultProfile = {
  key: TraitKey | "choices" | "anxious" | "avoidant" | "secure" | "fearful";
  eyebrow: string;
  title: string;
  summary: string;
  strength: string;
  watchout: string;
  nextStep: string;
  themeTitle?: string;
  strengths?: string[];
  stuckPoints?: string[];
  startingPoints?: string[];
  anxiety?: number;
  avoidance?: number;
  affiliateProductId?: string;
  affiliateRecommendation?: AffiliateRecommendation;
  secondaryKey?: ResultProfile["key"];
  dualHigh?: boolean;
};

export type QuizTest = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  coverAtlasPath: string;
  accent: string;
  position: number;
  active: boolean;
  featured: boolean;
  reportPriceCents: number;
  presentationMode?: PresentationMode;
  /** Legacy templates; new reports are built from selected options. */
  results?: Record<string, ResultProfile>;
  questionCount?: number;
};
