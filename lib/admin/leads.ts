import type { AdminAnswerEvent, AdminLeadRow } from "@/lib/admin/types";
import { RESULT_NAMES } from "@/lib/admin/labels";
import type { QuizQuestion, TraitKey } from "@/lib/quiz";

export type LeadAnswerDetail = {
  option: QuizQuestion["options"][number] | undefined;
  optionIndex: number;
  optionLabel: string;
  question: QuizQuestion | undefined;
  questionId: string;
  scoreKey: TraitKey;
};

export function parseAnswers(value: string | null): Record<string, TraitKey> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, TraitKey>;
  } catch {
    return {};
  }
}

export function getLeadAnswerDetails(
  lead: AdminLeadRow,
  questions: QuizQuestion[],
  answerEvents: AdminAnswerEvent[],
): LeadAnswerDetail[] {
  const latestLabels = new Map<string, string>();
  answerEvents.forEach((event) => {
    if (event.session_id === lead.session_id && event.option_label && !latestLabels.has(event.question_id)) {
      latestLabels.set(event.question_id, event.option_label);
    }
  });

  return Object.entries(parseAnswers(lead.answers_json))
    .map(([questionId, scoreKey]) => {
      const question = questions.find((item) => item.id === questionId);
      const eventLabel = latestLabels.get(questionId);
      let optionIndex = question?.options.findIndex((option) => option.label === eventLabel) ?? -1;
      if (optionIndex < 0) optionIndex = question?.options.findIndex((option) => option.scoreKey === scoreKey) ?? -1;
      const option = optionIndex >= 0 ? question?.options[optionIndex] : undefined;
      return {
        option,
        optionIndex,
        optionLabel: eventLabel ?? option?.label ?? "历史选项",
        question,
        questionId,
        scoreKey,
      };
    })
    .sort((a, b) => (a.question?.position ?? 999) - (b.question?.position ?? 999));
}

export function getMarketingTags(lead: AdminLeadRow) {
  const counts = new Map<string, number>();
  Object.values(parseAnswers(lead.answers_json)).forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
  const choiceTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${RESULT_NAMES[key] ?? key}倾向 ×${count}`);
  return [`主类型 · ${RESULT_NAMES[lead.result_type] ?? lead.result_type}`, ...choiceTags];
}
