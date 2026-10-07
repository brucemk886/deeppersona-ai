import { launchQuestions } from './attachment-launch-questions';
import type { QuizQuestion, ResultProfile } from './quiz';
import type { DeepResultContent } from './deep-results';
import { LAUNCH_VERSION, RESPONSE_KEYS, RESPONSE_LABELS, type ResponseKey, type ResponseCounts, type AnswerEvidence, type LaunchReport } from './attachment-launch';

const emptyCounts = (): ResponseCounts => ({ anxious: 0, avoidant: 0, secure: 0, fearful: 0 });
const count = (answers: AnswerEvidence[]) => answers.reduce((counts, answer) => { counts[answer.response]++; return counts; }, emptyCounts());
const leaders = (counts: ResponseCounts) => {
  const max = Math.max(...Object.values(counts));
  return max ? RESPONSE_KEYS.filter(key => counts[key] === max) : [];
};
const readings: Record<ResponseKey, { summary: string; interpretation: string; move: string; feedback: string; action: string }> = {
  anxious: {
    summary: 'You often look for signs that the connection is still there when something feels uncertain. That can help you notice distance early; repeated checking may also make it harder to say the specific thing you need.',
    interpretation: 'A change in contact may start to feel like a change in how much you matter.',
    move: 'Look for reassurance, move toward contact, or try to make things okay quickly.',
    feedback: 'Reassurance may help briefly. If the underlying request stays unclear, the same uncertainty can return.',
    action: 'Separate what happened from what you fear it means. Make one specific request before looking for more clues.',
  },
  avoidant: {
    summary: 'You often create space or handle things on your own when closeness becomes demanding. Independence can help you settle; unspoken distance may leave the other person guessing about whether you want to reconnect.',
    interpretation: 'The moment may feel easier to manage if you need less from the other person.',
    move: 'Turn toward independence, practical fixes, or less emotional contact.',
    feedback: 'Space may bring relief. Without a clear return or explanation, the question between you can remain unresolved.',
    action: 'If you need space, name what it is for and offer a realistic next point of contact.',
  },
  secure: {
    summary: 'You often choose direct communication while leaving room for both people’s needs. That is a useful response you can practice deliberately; it does not mean every relationship feels easy or that you should accept poor treatment.',
    interpretation: 'There may be room to understand the situation without deciding what it says about your worth.',
    move: 'Name a need, listen, negotiate the pace, or follow through on repair.',
    feedback: 'A clear request can give both people useful information. The other person may still be unable or unwilling to meet it.',
    action: 'Notice one thing that helps you stay direct and steady. Keep the request specific and check whether the arrangement works for you too.',
  },
  fearful: {
    summary: 'You often describe wanting connection while also feeling the urge to protect yourself from it. Both needs can be real. Making the next step smaller and more predictable may help you express them without having to switch between reaching and retreating.',
    interpretation: 'Closeness may feel wanted and exposing at the same time.',
    move: 'Move toward connection, then hold back or create distance when it feels more intense.',
    feedback: 'The other person may miss the need underneath the change of direction. Naming both needs can make a smaller next step possible.',
    action: 'Name both sides: wanting contact and needing a manageable pace. Ask for one small next step instead of forcing a decision about the whole relationship.',
  },
};

// Editorial tools are server-only. A free response exposes the overview, never these paid tools.
const tools: [string, string, string][] = [
  ["Your replies felt shorter today, and I noticed myself filling in the gaps. Is something taking up your attention?", 'Use after noticing an actual change; give them room to explain without having to prove their feelings.', 'Did asking once give you more information than interpreting the tone?'],
  ["I was looking forward to seeing you. Could we choose another time that works for both of us?", 'A cancelled plan is not proof of rejection. If cancellations keep happening, discuss the pattern and what you can rely on.', 'Was a realistic new plan agreed, and was it followed through?'],
  ["An evening to yourself works for me. Could we agree on when we’ll catch up? Having a plan helps me settle.", 'Ask for an agreement they can realistically keep. If they cannot, consider what level of uncertainty works for you.', 'Did naming a next contact make it easier to use the time for yourself?'],
  ["I’m glad to see you. I might need a little time to settle back in. Could we start with a quiet catch-up?", 'Use when you want to reconnect but feel a different pace inside. You do not need to perform instant closeness.', 'What made reconnecting feel easier without forcing the pace?'],
  ["I like being close to you. I also want us to find a pace that leaves room for both of our routines.", 'Affection and personal space can coexist. Discuss the pace without treating either preference as a flaw.', 'Could you enjoy the affection and still name a limit?'],
  ["Thank you for offering. Help with this one thing would make a difference. Is that manageable for you?", 'Choose a bounded request. Accepting one offer does not commit either person to unlimited responsibility.', 'Could you accept the agreed help without repeatedly checking or cancelling it?'],
  ["I feel a little exposed after sharing that. You don’t need to fix it; I’d appreciate knowing how it landed.", 'Share only what you want to share. The goal is a clearer response, not more disclosure than feels right.', 'What did their actual response show, compared with what you predicted?'],
  ["I’d like to talk about what being together means to each of us. What pace and commitments feel realistic?", 'Discuss specific expectations. A label alone does not settle availability, exclusivity, or boundaries.', 'Which expectation became clearer, and which still needs discussion?'],
  ["I want to understand this, and I’m getting overwhelmed. Can we pause and come back at a time we both agree on?", 'Use when a conversation is safe but too heated to be useful. A pause needs a realistic return; you do not owe continued contact in an unsafe situation.', 'Did the pause help you return with one clear point to discuss?'],
  ["I want to understand the impact before explaining my intention. Which part hurt most?", 'Listening does not require agreeing with every interpretation. Clarify the impact and then share your perspective.', 'Could you hear their experience without rushing to secure forgiveness or defend yourself?'],
  ["I’m ready to come back to what we paused. Is now still okay? If not, let’s choose another specific time.", 'Use for a mutual agreement, not as a demand for immediate resolution. Repeatedly avoiding every return is information worth noticing.', 'Did both people return to the conversation they agreed to have?'],
  ["Thank you for apologizing. What would help me move forward is this specific change next time.", 'Acceptance and restored trust can take different amounts of time. Watch follow-through rather than asking yourself to feel fine immediately.', 'What changed in behavior after the apology?'],
  ["I need tonight to myself. I’d like to see you another time; would tomorrow work?", 'Only offer another time if you want one. A clear no is enough; you do not need to earn the right to rest.', 'Could you keep the boundary without disappearing or overexplaining?'],
  ["I’d enjoy a little more contact this week. Would a short check-in tomorrow work for you?", 'Name a preference, then hear their capacity. A workable agreement needs room for both people.', 'Did the direct request make their availability clearer than hints did?'],
  ["This matters to me, and I hear that you prefer something different. Where can we adjust, and what do we each want to keep?", 'Some differences can be negotiated and some cannot. Do not promise a compromise that erases a core need.', 'Was the agreement workable for you, or did you agree mainly to end the discomfort?'],
  ["Would listening help most right now, or would you like ideas? I can be here for a while, then I need a break.", 'Offer only the support you have capacity to give. Caring does not make you responsible for changing their feelings.', 'Could you stay present without taking over or losing your own limit?'],
  ["I’ve enjoyed how steady things have felt. Is there anything we’d like to keep doing or adjust?", 'Use a calm moment to notice what works. You do not need to create a problem to justify a conversation.', 'What did you do with the calm: enjoy it, check it, or prepare for it to end?'],
  ["I hope you have a good evening. I’m going to enjoy my plans too. Shall we catch up tomorrow?", 'Agree on contact if both want it. Independent plans do not require constant updates as proof of care.', 'What helped you be present in your own evening?'],
  ["I did this, and I understand it affected you. I’m sorry. Here is what I can do differently; is there something I’ve missed?", 'Own your part without demanding immediate reassurance or forgiveness. The change should be specific and possible to observe.', 'Did you follow through after the apology, even without an immediate comforting response?'],
  ["That conversation helped. When doubt comes back, I want to check whether something new happened before asking us to resolve it again.", 'New behavior may justify a new conversation. This is not a reason to ignore inconsistency or dismiss your own concerns.', 'Was there new information, or was the same uncertainty returning?'],
];

export function buildLaunchReport(questions: QuizQuestion[], choices: Record<string, number>): { result: ResultProfile; deepResult: DeepResultContent } {
  const answers: AnswerEvidence[] = questions.flatMap((q, index) => {
    const option = q.options[choices[q.id]];
    if (!option || !RESPONSE_KEYS.includes(option.styleKey as ResponseKey)) return [];
    return [{ questionId: q.id, questionNumber: index + 1, prompt: q.prompt, answer: option.label, response: option.styleKey as ResponseKey, domain: q.kicker }];
  });
  const counts = count(answers), leading = leaders(counts);
  const ranked = RESPONSE_KEYS.slice().sort((a, b) => counts[b] - counts[a]);
  const close = leading.length > 1 || (counts[ranked[0]] - counts[ranked[1]] <= 1 && counts[ranked[1]] > 0);
  const headline = close ? 'Your responses shift with the situation' : RESPONSE_LABELS[leading[0]] || 'Your saved responses';
  const summary = close
    ? 'There is no clear single response in your choices. The situations matter more than one label: notice where you seek contact, where you take space, and where communication feels easier. The counts below describe your selections, not a psychological score.'
    : leading[0] ? readings[leading[0]].summary : "No response pattern is available for these answers.";
  const evidence: AnswerEvidence[] = [];
  // Different domains before repetitions; selected answers remain verbatim evidence.
  for (const a of answers.filter(a => leading.includes(a.response))) if (!evidence.some(e => e.domain === a.domain) && evidence.length < 3) evidence.push(a);
  for (const a of answers) if (evidence.length < 3 && !evidence.includes(a)) evidence.push(a);
  const exception = answers.find(a => !leading.includes(a.response));
  const overview = {
    version: LAUNCH_VERSION, answered: answers.length, counts, leading, headline, summary, evidence, exception,
    exceptionNote: exception ? 'This answer takes a different direction from your most frequent response. That variation is part of your result, not a mistake to explain away.' : 'Your selections were consistent across these situations. That describes this set of answers; it does not mean you respond this way in every relationship.',
    action: close ? 'Choose one recent moment. Write down what happened, what you assumed, and one request you could actually make. Keep those three things separate.' : readings[leading[0]]?.action || 'Notice which response best matches a recent moment.',
  } as LaunchReport['overview'];
  const domains = [...new Set(answers.map(a => a.domain))].map(title => {
    const subset = answers.filter(a => a.domain === title), c = count(subset), top = leaders(c);
    return { title, counts: c, reading: top.length > 1 ? 'Your choices vary in this area. Compare the individual situations before treating them as one pattern.' : readings[top[0]].summary };
  });
  const selected: AnswerEvidence[] = [];
  for (const a of [...answers.filter(a => a.response !== 'secure'), ...answers.filter(a => a.response === 'secure')]) {
    if (!selected.some(s => s.domain === a.domain) && selected.length < 3) selected.push(a);
  }
  for (const a of answers) if (selected.length < 3 && !selected.includes(a)) selected.push(a);
  const scenarios = selected.map(evidence => {
    const reading = readings[evidence.response];
    const [sentence, condition, observation] = (launchQuestions.find(q => q.id === evidence.questionId)?.prompt === evidence.prompt ? tools[Number(evidence.questionId.slice(-2)) - 1] : undefined) || ['Could we talk about what would work for both of us?', 'Use when it feels safe to talk and both people can choose their response.', 'Did the request make the next step clearer?'];
    return { evidence, reading: `You chose: “${evidence.answer}” ${reading.interpretation} This is one possible reading of that choice, not a conclusion about your partner.`, loop: [evidence.prompt, reading.interpretation, reading.move, reading.feedback], sentence, condition, observation };
  });
  const launchReport: LaunchReport = {
    overview, domains, scenarios, answers,
    practice: { title: 'Try one clearer next step', steps: [
      'Choose one of the three moments above that resembles something happening now.',
      'Write the observable facts separately from your prediction about what they mean.',
      'Adapt the suggested sentence to your own voice. Ask only for something specific and realistic.',
      'Afterward, note their actual response, your feeling, and whether the arrangement works for you. An unmet request is information, not a score of your worth.',
    ], reflection: 'What changed when you made the need easier to understand? What would you keep, change, or decline next time?' },
  };
  return {
    result: { key: close ? 'choices' : leading[0] || 'choices', title: headline, eyebrow: 'Your relationship response pattern', summary, strength: '', watchout: '', nextStep: overview.action },
    deepResult: { launchReport, lens: { title: 'A reflection based on your choices', explanation: 'These are counts of your selections in this quiz, not validated attachment scores, a diagnosis, or a claim about your childhood or your partner. Your responses can change across relationships and situations.', reflectionPrompt: launchReport.practice.reflection } },
  };
}
