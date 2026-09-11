export const TRAIT_KEYS = ["explorer", "connector", "architect", "creator"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

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
  /** Legacy templates; new reports are built from selected options. */
  results?: Record<string, ResultProfile>;
  questionCount?: number;
};
