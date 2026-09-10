export const TRAIT_KEYS = ["explorer", "connector", "architect", "creator"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

export type QuizOption = {
  label: string;
  microcopy: string;
  meaning: string;
  projection: string;
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

export type ResultAxis = {
  label: string;
  value: number;
  caption: string;
};

export type LockedModule = {
  title: string;
  teaser: string;
};

export type ResultProfile = {
  key: TraitKey | "choices";
  eyebrow: string;
  title: string;
  summary: string;
  strength: string;
  watchout: string;
  nextStep: string;
  axes?: ResultAxis[];
  lockedModules?: LockedModule[];
  affiliateProductId?: string;
  affiliateRecommendation?: AffiliateRecommendation;
};

export function isVisualQuestion(question: Pick<QuizQuestion, "atlasPath">) {
  return Boolean(question.atlasPath);
}

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

