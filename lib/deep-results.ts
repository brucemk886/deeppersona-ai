import type { QuizQuestion, QuizTest, ResultProfile } from './quiz';

export type DeepResultContent = {
  lens: { title: string; explanation: string; reflectionPrompt: string };
  // Present only in historical report snapshots.
  depth?: { coreDrive: string; inRelationships: string; underPressure: string };
};

export function buildChoiceReport(test: QuizTest, questions: QuizQuestion[], choices: Record<string, number>): { result: ResultProfile; deepResult: DeepResultContent } {
  const labels = questions.map(question => question.options[choices[question.id]].label);
  return {
    result: { key: 'choices', eyebrow: 'Your personal reading', title: test.title,
      summary: `Your choices: ${labels.join(' · ')}. Explore what each selection means to you in the full reading.`,
      strength: '', watchout: '', nextStep: '' },
    deepResult: { lens: { title: 'Bring these choices back to your own experience',
      explanation: 'Each section explains one image you selected. These interpretations are prompts for reflection, not scores or a fixed personality label. You can relate to different ideas in different situations.',
      reflectionPrompt: 'Which interpretation connects with something happening in your life, and which would you describe differently?' } },
  };
}
