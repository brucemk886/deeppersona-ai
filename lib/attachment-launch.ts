export const LAUNCH_VERSION = 'attachment-launch-v1';
export const LAUNCH_PREFIX = 'attachment-style-launch-v1-q';
export const RESPONSE_KEYS = ['anxious', 'avoidant', 'secure', 'fearful'] as const;
export type ResponseKey = typeof RESPONSE_KEYS[number];
export const RESPONSE_LABELS: Record<ResponseKey, string> = {
  anxious: 'Looking for reassurance', avoidant: 'Creating distance',
  secure: 'Staying in communication', fearful: 'Wanting closeness and pulling back',
};
export type ResponseCounts = Record<ResponseKey, number>;
export type AnswerEvidence = { questionId: string; questionNumber: number; prompt: string; answer: string; response: ResponseKey; domain: string };
export type LaunchInsight = {
  title: string; opening: string; excerpt: string; evidence: AnswerEvidence[];
  contrastTitle: string; contrast: string; contrastEvidence?: AnswerEvidence;
  chapters: { title: string; question: string; questionId: string }[];
};
export type LaunchReading = {
  version: 'attachment-reading-v2';
  need: string; protection: string; cost: string; misread: string; pivot: string;
  relationship: { title: string; body: string }[];
};
export type LaunchOverview = {
  version: typeof LAUNCH_VERSION; answered: number; counts: ResponseCounts; leading: ResponseKey[];
  headline: string; summary: string; evidence: AnswerEvidence[]; exception?: AnswerEvidence;
  exceptionNote: string; action: string; insight?: LaunchInsight;
};
export type LaunchReport = {
  overview: LaunchOverview;
  reading?: LaunchReading;
  domains: { title: string; counts: ResponseCounts; reading: string }[];
  scenarios: { title?: string; question?: string; need?: string; cost?: string; evidence: AnswerEvidence; reading: string; loop: string[]; sentence: string; condition: string; observation: string }[];
  answers: AnswerEvidence[];
  practice: { title: string; steps: string[]; reflection: string };
};
export const isLaunchQuestion = (id: string) => id.startsWith(LAUNCH_PREFIX);

// Persist canonical option indexes; only their presentation order is shuffled.
export function optionOrder(sessionId: string, questionId: string, length: number): number[] {
  const order = Array.from({ length }, (_, index) => index);
  const fixed = questionId.startsWith("attachment-style-fixed-v2-q");
  if (!isLaunchQuestion(questionId) && !fixed) return order;
  let seed = 2166136261;
  for (const char of `${sessionId}:${questionId}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  for (let i = (fixed ? Math.min(4,length) : length) - 1; i > 0; i--) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const j = (seed >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
