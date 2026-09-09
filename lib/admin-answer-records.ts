export type AnswerRecord = { questionId: string; prompt: string; optionLabel: string; optionIndex: number | null; atlasPath: string | null; source: 'snapshot' | 'event' };

// Keep the original choice, never reconstruct it from a scoring/personality key.
export function answerRecords(snapshotJson: string | null, events: { question_id: string; option_label: string | null }[]): AnswerRecord[] {
  try {
    const snapshot = JSON.parse(snapshotJson ?? 'null');
    if (Array.isArray(snapshot?.questions) && snapshot?.answerChoices) {
      return snapshot.questions.map((question: { id: string; prompt: string; atlasPath?: string; options: { label: string }[] }) => {
        const index = snapshot.answerChoices[question.id];
        const valid = Number.isInteger(index) && index >= 0 && typeof question.options?.[index]?.label === 'string';
        return { questionId: question.id, prompt: question.prompt, optionLabel: valid ? question.options[index].label : '原始选择未保存', optionIndex: valid ? index : null, atlasPath: question.atlasPath ?? null, source: 'snapshot' as const };
      });
    }
  } catch { /* Older records may not have a report snapshot. */ }
  const choices = new Map<string, AnswerRecord>();
  // Events arrive newest first; do not guess historical image positions from today's question bank.
  for (const event of events) if (event.option_label && !choices.has(event.question_id)) {
    choices.set(event.question_id, { questionId: event.question_id, prompt: `历史题目：${event.question_id}`, optionLabel: event.option_label, optionIndex: null, atlasPath: null, source: 'event' });
  }
  return [...choices.values()].reverse();
}
