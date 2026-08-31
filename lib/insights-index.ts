export type InsightCluster = {
  slug: string;
  label: string;
  title: string;
  description: string;
  testIds: string[];
  accent: string;
};

export type InsightArticleCard = {
  slug: string;
  title: string;
  excerpt: string;
  clusterSlug: string;
  primaryTestId: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
};

export const insightClusters: InsightCluster[] = [
  {
    slug: "relationships-communication",
    label: "Relationships & communication",
    title: "Understand the patterns that appear when closeness matters.",
    description:
      "Evidence-aware guides to attachment, emotional needs, boundaries, and the conversations that become difficult when a relationship feels important.",
    testIds: ["attachment-style", "emotional-needs", "conflict-style", "love-language", "boundary-style"],
    accent: "#8f4758",
  },
  {
    slug: "stress-social-energy",
    label: "Stress & social energy",
    title: "Notice what drains you—and what actually helps you recover.",
    description:
      "Practical reflections on social fatigue, overstimulation, emotional effort, and the different forms of rest people may need.",
    testIds: ["social-energy", "stress-reset"],
    accent: "#39747b",
  },
  {
    slug: "self-understanding",
    label: "Self-understanding",
    title: "See the abilities and patterns that are easy to overlook from the inside.",
    description:
      "Clear ways to recognize personal strengths without turning yourself into a fixed label or forcing false positivity.",
    testIds: ["hidden-strength"],
    accent: "#4d628b",
  },
];

export const insightArticleCards: InsightArticleCard[] = [
  {
    slug: "why-do-i-pull-away-when-someone-gets-close",
    title: "Why Do I Pull Away When Someone Gets Close?",
    excerpt:
      "Distance can be a way to lower emotional intensity, protect autonomy, or create time to understand what you feel. The moment before the withdrawal often tells you more than the withdrawal itself.",
    clusterSlug: "relationships-communication",
    primaryTestId: "attachment-style",
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    readMinutes: 7,
  },
  {
    slug: "how-to-know-what-you-need-in-a-relationship",
    title: "How to Know What You Need in a Relationship",
    excerpt:
      "Start with the moments that repeatedly create relief, resentment, or loneliness. They can reveal whether you are missing connection, autonomy, clarity, support, or room to be fully yourself.",
    clusterSlug: "relationships-communication",
    primaryTestId: "emotional-needs",
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    readMinutes: 8,
  },
  {
    slug: "why-do-i-feel-drained-after-socializing",
    title: "Why Do I Feel Drained After Socializing—even When I Had Fun?",
    excerpt:
      "Enjoyment and fatigue can happen together. The number of people, duration, sensory load, self-monitoring, and emotional effort may matter more than whether you are simply an introvert or extrovert.",
    clusterSlug: "stress-social-energy",
    primaryTestId: "social-energy",
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    readMinutes: 7,
  },
  {
    slug: "how-to-recognize-strengths-that-feel-ordinary",
    title: "How to Recognize Strengths That Feel Ordinary to You",
    excerpt:
      "A real strength often feels unremarkable from the inside because you use it automatically. Look for repeated outcomes, trusted feedback, and abilities you can apply across more than one setting.",
    clusterSlug: "self-understanding",
    primaryTestId: "hidden-strength",
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    readMinutes: 6,
  },
];

export function getInsightCluster(slug: string) {
  return insightClusters.find((cluster) => cluster.slug === slug);
}

export function getInsightArticleCard(slug: string) {
  return insightArticleCards.find((article) => article.slug === slug);
}

export function getInsightCardsForCluster(clusterSlug: string) {
  return insightArticleCards.filter((article) => article.clusterSlug === clusterSlug);
}

export function getInsightCardsForTest(testId: string) {
  return insightArticleCards.filter((article) => article.primaryTestId === testId);
}
