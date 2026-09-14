import {
  ATTACHMENT_RESULTS,
  ATTACHMENT_STYLE_META,
  dimensionScore,
  isAttachmentStyle,
  resolveAttachmentScores,
  scoreAttachmentSubset,
  selfWorthSnapshot,
} from './attachment';
import {
  caregiverIntro,
  CHILDHOOD_MODULE,
  REPORT_INCLUSIONS,
  ROMANCE_MODULE,
  romanceEssay,
  selfWorthSentences,
} from './attachment-report';
import type { ReportPreview, ReportSnapshot } from './payment-types';
import type { ResultProfile } from './quiz';

export const FREE_SAMPLE_MODULE = ROMANCE_MODULE;

export function freeResultFromSnapshot(snapshot: ReportSnapshot): ResultProfile {
  const scored = resolveAttachmentScores(snapshot.questions, snapshot.answerChoices, snapshot.result);
  const themeTitle = scored
    ? ATTACHMENT_STYLE_META[scored.style].blurb
    : snapshot.result.themeTitle
      || (snapshot.result.key === 'choices' ? snapshot.result.title : undefined);
  if (!scored) {
    return {
      key: snapshot.result.key,
      title: snapshot.result.title,
      themeTitle,
      summary: snapshot.result.summary,
      eyebrow: snapshot.result.eyebrow,
      strength: '',
      watchout: '',
      nextStep: '',
    };
  }
  const profile = ATTACHMENT_RESULTS[scored.style];
  return {
    key: scored.style,
    title: ATTACHMENT_STYLE_META[scored.style].label,
    themeTitle,
    summary: isAttachmentStyle(snapshot.result.key) ? snapshot.result.summary : profile.summary,
    eyebrow: snapshot.result.eyebrow || profile.eyebrow,
    strength: '',
    watchout: '',
    nextStep: '',
    anxiety: scored.anxiety,
    avoidance: scored.avoidance,
  };
}

// Overall reading plus one romance sample. Remaining choices and modules stay paid.
export function reportPreview(snapshot: ReportSnapshot): ReportPreview {
  const answered = snapshot.questions.map((q, index) => ({ q, index, selectedIndex: snapshot.answerChoices[q.id] }))
    .filter((x) => Number.isInteger(x.selectedIndex) && x.q.options[x.selectedIndex]);
  const modules = snapshot.deepResult.modules ?? [];
  const sampleModule = modules.find((module) => module.title === FREE_SAMPLE_MODULE) ?? modules[0];
  const sampleEntry = answered.find((item) => item.q.kicker === (sampleModule?.title ?? FREE_SAMPLE_MODULE)) ?? answered[0];
  const selected = sampleEntry?.q.options[sampleEntry.selectedIndex];
  const aiSample = snapshot.deepResult.aiReading?.choices.find((item) => item.questionId === sampleEntry?.q.id)?.reading
    || snapshot.deepResult.aiReading?.summary;
  const scored = resolveAttachmentScores(snapshot.questions, snapshot.answerChoices, snapshot.result);
  const caregiverScored = scoreAttachmentSubset(snapshot.questions, snapshot.answerChoices, CHILDHOOD_MODULE);
  const worth = scored ? selfWorthSnapshot(snapshot.questions, snapshot.answerChoices) : undefined;

  return {
    totalChoices: answered.length,
    modules: modules.map((module) => module.title),
    romanceEssay: snapshot.deepResult.aiReading?.summary
      ?? (scored
        ? (snapshot.deepResult.romanceEssay ?? romanceEssay(snapshot.questions, snapshot.answerChoices, scored.style))
        : undefined),
    scores: scored ? dimensionScore(scored.anxiety, scored.avoidance) : undefined,
    caregiver: scored && caregiverScored.answered ? {
      intro: snapshot.deepResult.caregiver?.intro ?? caregiverIntro(snapshot.questions, snapshot.answerChoices, scored.style),
      ...dimensionScore(caregiverScored.anxiety, caregiverScored.avoidance),
    } : undefined,
    selfWorth: scored && worth ? {
      ...worth,
      sentences: snapshot.deepResult.selfWorth?.sentences ?? selfWorthSentences(snapshot.questions, snapshot.answerChoices, scored.style),
    } : undefined,
    inclusions: REPORT_INCLUSIONS,
    sample: sampleModule && selected && sampleEntry ? {
      moduleTitle: sampleModule.title,
      explanation: sampleModule.explanation.split('\n\n')[0] ?? sampleModule.explanation,
      reflection: sampleModule.reflection,
      choice: {
        questionNumber: sampleEntry.index + 1,
        prompt: sampleEntry.q.prompt,
        label: selected.label,
        meaning: aiSample || selected.meaning,
        atlasPath: sampleEntry.q.atlasPath,
        selectedIndex: sampleEntry.selectedIndex,
      },
    } : undefined,
  };
}
