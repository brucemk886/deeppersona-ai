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
  ROMANCE_MODULE,
  romanceEssay,
  selfWorthSentences,
} from './attachment-report';
import type { ReportPreview, ReportSnapshot } from './payment-types';
import type { ResultProfile } from './quiz';

export const FREE_SAMPLE_MODULE = ROMANCE_MODULE;

export function freeResultFromSnapshot(snapshot: ReportSnapshot): ResultProfile {
  if (snapshot.deepResult.fixedReport) {
    const {key,title,summary,eyebrow}=snapshot.result;
    return {key,title,summary,eyebrow,strength:"",watchout:"",nextStep:""};
  }
  if (snapshot.deepResult.launchReport) {
    const { key, title, summary, eyebrow, nextStep } = snapshot.result;
    return { key, title, summary, eyebrow, nextStep, strength: "", watchout: "" };
  }
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
  if (snapshot.deepResult.fixedReport) {
    return {totalChoices:snapshot.questions.length,modules:[],fixedOverview:snapshot.deepResult.fixedReport.overview};
  }
  if (snapshot.deepResult.launchReport) {
    const overview = snapshot.deepResult.launchReport.overview;
    return { totalChoices: overview.answered, modules: [], launchOverview: overview };
  }
  const scored = resolveAttachmentScores(snapshot.questions, snapshot.answerChoices, snapshot.result);
  const caregiverScored = scoreAttachmentSubset(snapshot.questions, snapshot.answerChoices, CHILDHOOD_MODULE);
  const worth = scored ? selfWorthSnapshot(snapshot.questions, snapshot.answerChoices) : undefined;

  return {
    totalChoices: answered.length,
    modules: modules.map((module) => module.title),
    romanceEssay: scored ? romanceEssay(snapshot.questions, snapshot.answerChoices, scored.style) : undefined,
    scores: scored ? dimensionScore(scored.anxiety, scored.avoidance) : undefined,
    caregiver: scored && caregiverScored.answered ? {
      intro: caregiverIntro(snapshot.questions, snapshot.answerChoices, scored.style),
      ...dimensionScore(caregiverScored.anxiety, caregiverScored.avoidance),
    } : undefined,
    selfWorth: scored && worth ? {
      ...worth,
      sentences: selfWorthSentences(snapshot.questions, snapshot.answerChoices, scored.style),
    } : undefined,
    sample: undefined,
  };
}
