import {
  ATTACHMENT_LOOPS,
  ATTACHMENT_OVERVIEWS,
  ATTACHMENT_RESULTS,
  ATTACHMENT_STYLE_META,
  isAttachmentStyle,
  resolveAttachmentScores,
} from './attachment';
import { childhoodTeaser, REPORT_INCLUSIONS, ROMANCE_MODULE, worthPattern } from './attachment-report';
import type { ReportResponse, ReportSnapshot } from './payment-types';
import type { ResultProfile } from './quiz';

export const FREE_SAMPLE_MODULE = ROMANCE_MODULE;

function overviewItem(title: string, points: string[] | undefined, fallback: string) {
  const list = (points ?? []).map((point) => point.trim()).filter(Boolean);
  const body = list.join(' ') || fallback;
  return list.length ? { title, body, points: list } : { title, body };
}

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
export function reportPreview(snapshot: ReportSnapshot): NonNullable<ReportResponse['preview']> {
  const answered = snapshot.questions.map((q, index) => ({ q, index, selectedIndex: snapshot.answerChoices[q.id] }))
    .filter((x) => Number.isInteger(x.selectedIndex) && x.q.options[x.selectedIndex]);
  const modules = snapshot.deepResult.modules ?? [];
  const sampleModule = modules.find((module) => module.title === FREE_SAMPLE_MODULE) ?? modules[0];
  const sampleEntry = answered.find((item) => item.q.kicker === (sampleModule?.title ?? FREE_SAMPLE_MODULE)) ?? answered[0];
  const selected = sampleEntry?.q.options[sampleEntry.selectedIndex];
  const scored = resolveAttachmentScores(snapshot.questions, snapshot.answerChoices, snapshot.result);
  const copy = scored ? ATTACHMENT_RESULTS[scored.style] : snapshot.result;
  const overviewCopy = scored ? ATTACHMENT_OVERVIEWS[scored.style] : null;
  const loop = snapshot.deepResult.loop ?? (scored ? ATTACHMENT_LOOPS[scored.style] : undefined);
  const worth = scored ? worthPattern(snapshot.questions, snapshot.answerChoices, scored.style) : undefined;

  return {
    totalChoices: answered.length,
    modules: modules.map((module) => module.title),
    overview: [
      overviewItem('In dating', overviewCopy?.dating, copy.strength),
      overviewItem('With yourself', overviewCopy?.withSelf, copy.watchout),
      overviewItem('Under stress', overviewCopy?.underStress, copy.nextStep),
    ].filter((item) => Boolean(item.body)),
    loop: loop ? { name: loop.name, kind: loop.kind, steps: loop.steps } : undefined,
    childhoodTeaser: scored ? childhoodTeaser(snapshot.questions, snapshot.answerChoices, scored.style) : undefined,
    worthPattern: worth,
    inclusions: REPORT_INCLUSIONS,
    sample: sampleModule && selected && sampleEntry ? {
      moduleTitle: sampleModule.title,
      explanation: sampleModule.explanation.split('\n\n')[0] ?? sampleModule.explanation,
      reflection: sampleModule.reflection,
      choice: {
        questionNumber: sampleEntry.index + 1,
        prompt: sampleEntry.q.prompt,
        label: selected.label,
        meaning: selected.meaning,
        atlasPath: sampleEntry.q.atlasPath,
        selectedIndex: sampleEntry.selectedIndex,
      },
    } : undefined,
  };
}
