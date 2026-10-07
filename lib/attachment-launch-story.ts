// Server-only editorial readings. Build from saved evidence, never the live catalog.
import { RESPONSE_KEYS, RESPONSE_LABELS, type ResponseKey, type AnswerEvidence, type LaunchReport } from './attachment-launch';
import { launchQuestions } from './attachment-launch-questions';

const portraits: Record<ResponseKey, { title: string; opening: string; need: string; protection: string; cost: string; misread: string; pivot: string; question: string }> = {
  anxious: {
    title: 'A small change can become a big question about where you stand.',
    opening: 'Across your choices, uncertainty often brings you closer: checking, asking, or trying to settle things quickly. The difficult part may be leaving a question about the relationship unanswered.',
    need: 'To know that the connection still matters, including in the hours when nobody is actively reassuring you.',
    protection: 'Reaching out gives you something to do with uncertainty. A reply can feel like relief because you no longer have to guess where you stand.',
    cost: 'If every uncomfortable feeling needs a new response from them, relief can become brief. The conversation may end up about how often you ask, while your actual need for dependable contact goes unheard.',
    misread: 'A request for closeness can sound like a demand for an immediate answer. They may notice the repeated contact before they understand the worry behind it. Their real response still matters; this does not explain away inconsistency.',
    pivot: 'Ask for the agreement you need, then watch whether it is kept. That gives you more useful information than repeatedly trying to feel certain in the moment.',
    question: 'How can you ask for reassurance without needing to ask again?',
  },
  avoidant: {
    title: 'You may care more than your distance lets someone see.',
    opening: 'Across your choices, pressure often sends you toward independence: expecting less, taking space, or handling things alone. That can make life feel manageable while leaving someone unsure how close you want to be.',
    need: 'To have room to choose closeness, without feeling that connection gives someone unlimited access to your time or emotions.',
    protection: 'Taking space lowers the immediate demand. Needing less from someone also means depending less on a response you cannot control.',
    cost: 'Relief can arrive before the issue is resolved. If you never name when or how you want to return, distance becomes the answer by default, even when ending the connection was not your intention.',
    misread: 'Your attempt to settle yourself can look like a loss of interest. Someone cannot reliably distinguish a pause from a quiet exit unless you tell them what you mean.',
    pivot: 'Make space specific: what you need, how long you expect to need it, and whether you want to reconnect. Then notice whether that boundary is respected.',
    question: 'How do you keep your space without quietly losing the connection?',
  },
  secure: {
    title: 'You make room for closeness without giving up your own needs.',
    opening: 'Across your choices, you usually name what is happening and leave room for a response. Your next useful question is whether the other person can meet you with the same clarity and follow-through.',
    need: 'A relationship in which both people can make requests, say no, and return to difficult conversations without one person carrying all the repair.',
    protection: 'Being direct gives the relationship a chance to respond to what you actually need. You do not have to hide disappointment or turn every difference into a verdict on the relationship.',
    cost: 'Clear communication is a strength, but it cannot create willingness in someone else. Repeating the perfect explanation can become extra work if their behavior never changes.',
    misread: 'Calm can be mistaken for having no needs. You can remain considerate and still be firm about something that is no longer working for you.',
    pivot: 'Keep the clarity, and add a check on reciprocity. After you make a reasonable request, notice whether both of you do the work of meeting it.',
    question: 'How do you tell healthy patience from carrying the relationship alone?',
  },
  fearful: {
    title: 'You want to feel close, then want to protect yourself from it.',
    opening: 'Across your choices, reaching out and holding back often appear together. You may want a clear sign of care, yet feel exposed once your need for it could be seen.',
    need: 'Closeness that feels predictable enough to enter, with room to slow down without losing the connection altogether.',
    protection: 'Holding something back can protect you from feeling fully exposed. It also leaves you a way to retreat if the response is disappointing.',
    cost: 'When wanting contact turns into showing distance, the need underneath may never get a clear response. You are then left interpreting what happened without knowing how they would have answered a direct request.',
    misread: 'The change in direction can look like not knowing what you want. Another possibility is that you know you want connection but do not yet know what pace feels manageable.',
    pivot: 'Say both parts together: you want connection, and you need a smaller next step. A clear limit gives the other person a chance to respond without requiring you to commit to everything at once.',
    question: 'How do you ask for closeness when being seen also feels risky?',
  },
};

type Scene = { title: string; readings: Record<ResponseKey, string> };
const scene = (title: string, anxious: string, avoidant: string, secure: string, fearful: string): Scene => ({ title, readings: { anxious, avoidant, secure, fearful } });
const scenes: Scene[] = [
  scene('When their replies get shorter',
    'In this answer, a shorter reply leads to checking and more messages. The next text can start doing two jobs: asking for contact and trying to make the uncertainty stop. A reply may settle the second job without answering the first.',
    'Your answer pulls your attention back when their contact changes. Expecting less may soften disappointment, but it can also end the opportunity to find out what actually changed.',
    'You chose to check in before deciding what the change means. That keeps a small piece of information from becoming a complete story. The useful next step is to compare their explanation with what follows.',
    'You want to ask, then hold back because the question would reveal that it matters. That leaves the uncertainty in place while protecting you from the exposure of making a direct request.'),
  scene('When a plan gets cancelled',
    'You linked a cancelled plan with how important you are to them. A replacement date may therefore feel like proof that you still matter. Separating disappointment from that larger question makes it easier to ask for a plan they can actually keep.',
    'You chose to lower expectations and do your own thing. That protects your day from another disappointment. The tradeoff is that they may never learn how much you were looking forward to seeing them.',
    'You allow yourself to be disappointed and ask for another time. Both pieces matter: the feeling is named, and the next step can be observed. Whether they help make that plan tells you something useful.',
    'You act as if the cancellation does not matter while hoping they notice that it does. That asks them to respond to a feeling you are also hiding. A simple statement of disappointment gives them a clearer chance to meet it.'),
  scene('When they ask for time alone',
    'You agree to the space, then look for signs of closeness. The agreement may be clear while its emotional meaning still feels unsettled. Naming when you will reconnect can be more useful than searching for reassurance throughout the evening.',
    'You feel relieved and put off deciding when to reconnect. Space works for you immediately; returning gets less attention. The question is whether the pause also contains an intention to come back.',
    'You make room for their evening and agree on the next contact. That lets independence and connection coexist. Keep the agreement realistic rather than treating constant updates as a requirement.',
    'Their request for space is followed by your own urge to withdraw. That can turn one person needing an evening into both people feeling farther apart. Naming the hurt before deciding on distance helps separate those two events.'),
  scene('When you reconnect after time apart',
    'You chose needing extra warmth before you can stop wondering what changed. The reunion may begin as a check on the relationship before it becomes a chance to enjoy each other. Asking for a little connection directly is clearer than testing for it.',
    'You need time to let them back into a routine that worked alone. The transition itself may be the difficult part. Naming that adjustment keeps a slower start from being mistaken for not wanting the reunion.',
    'Your answer makes room for settling back into connection. Notice what helps that transition work, rather than assuming it should happen instantly every time.',
    'Your choice contains both wanting the reunion and holding something back. A smaller first step can let you reconnect without demanding an immediate change in how safe or close you feel.'),
  scene('When affection increases',
    'You feel happy and still ask whether the care is real. The affection is welcome, but it does not fully settle the question underneath. Notice whether something new raised doubt, or whether reassurance itself is being asked to guarantee the future.',
    'More affection brings discomfort and a wish for distance. You may be reacting to the pace or expected access, rather than to affection itself. Being specific about what feels too much gives you more options than withdrawing from all of it.',
    'You chose to enjoy and return the affection. That is a moment of receiving care without first making it pass another test. You can keep enjoying it while still naming your pace and limits.',
    'Happiness is followed by worry that they will change their mind, so you hold back. Anticipating a future loss changes what you allow yourself in the present. A small, chosen response can let you participate without making a promise about forever.'),
  scene('When someone offers you help',
    'Your choice connects receiving help with reassurance about the relationship. Try separating the practical offer from the larger question of whether they will always be there. One clear, bounded request gives this moment a chance to stand on its own.',
    'Your answer leans toward managing alone. Self-reliance protects your control, but refusing every offer can also hide where support would be welcome. Accepting one specific task does not create an unlimited obligation.',
    'You make room for help without handing over all responsibility. The useful distinction is between a clear agreement and an unspoken expectation. Say what would actually help and check what they can offer.',
    'The offer brings up both wanting support and hesitating to receive it. A limited request can make the decision smaller: you are accepting help with one thing, not deciding whether to depend on someone for everything.'),
  scene('After you share something personal',
    'Once you share, attention moves toward how the disclosure landed. The reassurance you want may be a sign that being open did not change how they see you. Asking for a response is clearer than repeatedly reviewing the conversation.',
    'Your choice creates distance after being open. That may make the exposure easier to manage, while leaving the other person unsure whether you regret the closeness. You can ask for a little time without taking back what you shared.',
    'You chose to allow the disclosure and their response to exist without immediately repairing the moment. You can still ask a direct question if something about their response is unclear.',
    'Being seen is followed by an urge to protect yourself. The vulnerable part may continue after the words are spoken. Naming that feeling gives them something clearer to respond to than a sudden retreat.'),
  scene('When commitment becomes a real conversation',
    'Your answer looks for certainty as the relationship becomes more defined. A label can help, but it does not answer every question about availability or expectations. Discuss the commitments you want the label to represent.',
    'Making the relationship official raises questions about freedom and expectations. Those are concrete topics you can negotiate. Pulling away before naming them may turn a discussion about terms into uncertainty about your interest.',
    'You approach commitment as something to discuss. Keep that strength practical: compare expectations about time, exclusivity, and how you handle disagreement rather than relying on the label alone.',
    'Commitment brings both appeal and hesitation in your choice. You can want the relationship while needing to understand what saying yes actually changes. Make the next conversation specific enough to answer that.'),
  scene('When a disagreement gets tense',
    'Leaving things unresolved feels harder than continuing. A conversation can then become an attempt to secure the relationship immediately, even when neither person is listening well. An agreed return time can separate a pause from being abandoned with the issue.',
    'Your choice moves away from the tension. A pause may help you settle; without a return, it can also leave the disagreement waiting indefinitely. The repair begins with making the return part of the pause.',
    'You try to keep the disagreement workable. A clear pause and a real return can protect that ability when the conversation gets heated. You do not have to solve every part at once.',
    'Your answer contains the pull to settle the conflict and the urge to escape it. Switching between those moves can make the conversation hard to follow. State which part you can discuss now and what needs a pause.'),
  scene('When they tell you that you hurt them',
    'Their hurt may quickly become a question about whether the relationship is still okay. Seeking reassurance too early can move attention away from the impact they are describing. Hear that part before asking where you stand.',
    'Your answer protects your position when your behavior is challenged. Explaining your intention can matter, but it may arrive before they feel heard. Make room for impact and intention as two separate parts of the conversation.',
    'You chose to hear their experience without treating it as the whole story about you. That leaves room to own your part and still clarify a misunderstanding. A specific change is more useful than a perfect apology.',
    'Feedback brings both a wish to repair and a wish to protect yourself. You may need to slow the conversation enough to separate what you did from what you fear it says about the connection.'),
  scene('When it is time to return to a hard conversation',
    'Waiting for the agreed time is difficult in your answer. Reaching out sooner may reduce your discomfort while changing the agreement you made together. Notice whether you need a clearer return time or help tolerating the one already set.',
    'Once things feel calmer, you hope the issue can stay behind you. Relief and resolution are different here. Returning gives both people a chance to find out whether anything actually changed.',
    'You chose to return as agreed or explain a change. That follow-through helps make a pause trustworthy. Keep the return focused on one issue that can be discussed clearly.',
    'You prepare to reconnect and then hesitate when the moment arrives. The difficulty may be starting again rather than knowing that repair matters. A brief opening can make the return less all-or-nothing.'),
  scene('After an apology',
    'Your answer looks for reassurance that the hurt will not happen again. No apology can guarantee that; follow-through can give you information over time. Name the change you need to see rather than asking the words to remove every doubt.',
    'You tend to protect yourself by expecting less after being hurt. That can reduce immediate exposure while leaving repair unfinished. Consider whether there is a specific change that would make renewed trust possible.',
    'You allow an apology to matter while keeping behavior in view. That lets you accept the effort without requiring yourself to feel fully restored immediately.',
    'You want the repair and remain guarded about trusting it. Those can coexist. A small, observable agreement gives you something to evaluate without forcing yourself to decide all at once.'),
  scene('When you need to say no',
    'Your choice makes their reaction part of whether you allow yourself time alone. Agreeing may preserve contact tonight while creating resentment about a need you did not express. A considerate no still gives them a chance to know you.',
    'Your answer protects time alone by creating distance. The boundary may be valid even when the explanation is missing. State the limit clearly so they are not left guessing whether it means something larger.',
    'You make your limit visible without turning it into a rejection of the person. Keep any alternative plan genuine; you do not have to offer one simply to earn the right to rest.',
    'You want time alone and worry about what saying no will do to the connection. An unclear yes or sudden retreat can leave both needs unmet. A small, explicit boundary gives the relationship a clearer test of respect.'),
  scene('When you want more contact',
    'Your answer seeks more signs of connection. The useful question is what amount of contact would actually work for you. Making that request concrete lets you learn about their capacity instead of repeatedly checking their feelings.',
    'You have a wish for contact but are inclined to contain it yourself. Staying silent can make independence look easier than it feels. Naming one preference gives the other person a chance to respond.',
    'You chose to make a direct request. The next step is hearing whether the other person can genuinely meet it. A clear answer, including a no, gives you information about fit.',
    'You want more contact but hesitate to make that need visible. Hints can protect you from an explicit refusal while leaving you uncertain. A small request makes the question answerable.'),
  scene('When an important preference differs',
    'Keeping the connection can make your own preference feel negotiable before you have considered its importance. Agreeing quickly may end discomfort without producing an agreement you can live with.',
    'Your choice leans toward distance or handling the difference alone. Before treating the mismatch as settled, identify what is flexible and what you genuinely want to keep.',
    'You let both preferences enter the conversation. That creates room for negotiation without assuming every difference has a workable compromise. Some answers reveal compatibility; others reveal a limit.',
    'You want to hold your preference and avoid the exposure of disagreeing. Moving between accommodating and pulling back can hide what matters. Name the part you are willing to adjust and the part you are not.'),
  scene('When they need emotional support',
    'Your answer makes their distress something you want to settle quickly. Helping may also become a way to feel secure in your place with them. Check what they are asking for before taking responsibility for changing the feeling.',
    'You lean toward solutions or distance when emotions become demanding. Practical help may miss a request simply to be heard. Ask which kind of support would help, and name the limit of what you can offer.',
    'You make room for their experience and your own capacity. That supports care without requiring you to carry the whole feeling for them. Be clear about when you need a break.',
    'You want to be there and may also feel overwhelmed by what closeness asks of you. A bounded offer lets you participate without promising more emotional availability than you have.'),
  scene('When the relationship feels steady',
    'Calm does not fully quiet the search for what could change in your answer. Checking can become a habit even when there is no new problem to solve. Notice the difference between current evidence and preparing for a possible loss.',
    'Your answer turns toward more independence as things settle. Consider whether the space is making the relationship more comfortable or slowly removing the shared time you still want.',
    'You chose to enjoy the steadiness. Notice the actual agreements and habits that support it so the calm becomes something you both maintain, rather than something you simply hope will last.',
    'Steadiness brings comfort and anticipation that it may change. Protecting yourself early can reduce your ability to enjoy what is happening now. Choose one small way to participate while uncertainty remains.'),
  scene('When your evenings are separate',
    'Their independent evening still holds your attention in this answer. Contact may begin to function as a check that you remain important. An agreed check-in can leave more of the evening available for your own life.',
    'You welcome the independence and may put reconnecting to one side. Notice whether you also make room for the shared time you want, without treating either kind of time as a problem.',
    'You allow both people to have their own evening. That independence can coexist with a clear, mutual plan to reconnect. It does not require pretending you never miss them.',
    'You want independence to be fine and also feel the pull to protect yourself from being left out. Name what you actually want before deciding to create more distance in response.'),
  scene('When you make a mistake',
    'Repair may feel urgent because the mistake raises a question about the relationship. Asking for immediate forgiveness can make the other person responsible for settling your discomfort. Own the action and let the repair include follow-through.',
    'Your choice leans toward containing the mistake or explaining it. That may reduce exposure while leaving its impact unaddressed. A specific acknowledgment gives you a starting point beyond defending your intention.',
    'You can take responsibility without treating one mistake as your whole identity. Make the change observable and leave room for the other person to have their own pace of response.',
    'You want to put things right and may also want to disappear from the discomfort. A small, clear act of responsibility is easier to follow than alternating between intense apologies and retreat.'),
  scene('When reassurance starts to wear off',
    'The conversation helps, but doubt returns. That makes the duration of relief worth noticing: another reassuring statement may answer the same question without changing how you respond when uncertainty comes back.',
    'You may prefer to settle things internally rather than keep revisiting the conversation. Check whether that means the issue feels resolved or whether you have stopped expecting it to be understood.',
    'You allow reassurance to count while remaining open to new information. That makes it possible to avoid repeating a settled conversation and still revisit it if behavior actually changes.',
    'You can feel reassured and then question whether it is safe to trust the feeling. Notice what prompts the shift: a new action, an old prediction, or the discomfort of letting the conversation matter.'),
];

const questions = [
  'What does a change in their replies make you do next?',
  'What are you trying to find out when a plan falls through?',
  'What would make time apart easier for you?',
  'What do you need before you can settle back into closeness?',
  'What changes for you when affection increases?',
  'What makes help easy or difficult to accept?',
  'What happens after you let someone see more of you?',
  'Which part of commitment needs to become clearer?',
  'What are you trying to resolve when an argument escalates?',
  'What gets in the way of hearing each other?',
  'What makes returning to a hard conversation difficult?',
  'What would help you trust the repair?',
  'What does saying no seem to put at risk?',
  'How can you make your wish for contact easier to answer?',
  'Which differences can you compromise on without losing what matters?',
  'What support can you offer without taking over?',
  'What do you do when there is no problem to solve?',
  'How do you keep connection while living separate lives?',
  'What does taking responsibility look like after the apology?',
  'What makes reassurance last or wear off?',
];

function detail(answer: AnswerEvidence) {
  const source = launchQuestions.find(q => q.id === answer.questionId);
  // A rewritten managed question or option must never inherit an unrelated scene interpretation.
  const known = source?.prompt === answer.prompt && source.options.some(o => o.label === answer.answer && o.styleKey === answer.response);
  return known ? scenes[Number(answer.questionId.slice(-2)) - 1] : undefined;
}

export function enrichLaunchReport(report: LaunchReport): LaunchReport {
  if (report.reading?.version === 'attachment-reading-v2') return report;
  const answers = report.answers;
  if (!answers.length) return report;
  const ranked = RESPONSE_KEYS.slice().sort((a, b) => report.overview.counts[b] - report.overview.counts[a]);
  const top = ranked[0], mixed = report.overview.counts[top] - report.overview.counts[ranked[1]] <= 1;
  const p = portraits[top];
  const broadMix = ranked.filter(key => report.overview.counts[top] - report.overview.counts[key] <= 1).length > 2;
  const first = answers.find(a => a.response === top) ?? answers[0];
  const second = answers.find(a => a.response === (mixed ? ranked[1] : top) && a.domain !== first.domain)
    ?? answers.find(a => a.questionId !== first.questionId) ?? first;
  const different = answers.find(a => a.response !== first.response);
  const excerpt = detail(first)?.readings[first.response] ?? `You selected: “${first.answer}” ${portraits[first.response].opening}`;
  const scenarios = report.scenarios.map(s => {
    const d = detail(s.evidence), portrait = portraits[s.evidence.response];
    return { ...s, title: d?.title ?? s.evidence.prompt, question: d ? questions[Number(s.evidence.questionId.slice(-2)) - 1] : portrait.question,
      reading: d?.readings[s.evidence.response] ?? s.reading, need: portrait.need, cost: portrait.cost,
      loop: [s.evidence.prompt, portrait.protection, s.evidence.answer, portrait.cost] };
  });
  const contrast = different
    ? `In another moment you chose: “${different.answer}” That moves toward ${RESPONSE_LABELS[different.response].toLowerCase()}, rather than ${RESPONSE_LABELS[first.response].toLowerCase()}. Your reaction changes with the situation. The contrast is worth exploring before treating your most frequent answer as a fixed identity.`
    : `Your ${answers.length} choices follow the same response thread. That makes the pattern clear in this quiz, but it does not tell us whether it appears with every person. Look for a recent exception when you read the situations below.`;
  const insight = {
    title: mixed ? 'Your reactions change depending on what is at stake.' : p.title,
    opening: mixed ? broadMix ? 'Your answers span several different reactions, with no clear single lead. The useful question is which situations make you seek contact, take space, stay direct, or hesitate between reaching out and holding back.' : `Your answers move between ${RESPONSE_LABELS[top].toLowerCase()} and ${RESPONSE_LABELS[ranked[1]].toLowerCase()}, without one clearly dominating. A single label would miss that difference. The useful question is which situations change what you need to feel comfortable.` : p.opening,
    excerpt, evidence: [first, second].filter((a, i, all) => all.findIndex(x => x.questionId === a.questionId) === i),
    contrastTitle: different ? 'The answer that adds another side to your result' : 'A strong thread, with one question still open',
    contrast, contrastEvidence: different,
    chapters: scenarios.map(s => ({ title: s.title, question: s.question, questionId: s.evidence.questionId })),
  };
  const domains = report.domains.map(d => {
    const subset = answers.filter(a => a.domain === d.title);
    const ranked = RESPONSE_KEYS.slice().sort((a, b) => d.counts[b] - d.counts[a]);
    const evidence = subset.find(a => a.response === ranked[0]);
    const other = subset.find(a => a.response !== ranked[0]);
    const reading = evidence ? `${detail(evidence)?.readings[evidence.response] ?? portraits[evidence.response].opening}${other ? ` Another response in this area was: “${other.answer}” Keep that difference in view; this area is not described by one reaction alone.` : ''}` : d.reading;
    return { ...d, reading };
  });
  return { ...report, overview: { ...report.overview, insight }, domains, scenarios,
    reading: { version: 'attachment-reading-v2', need: mixed ? 'Different moments bring different needs forward. Compare the selected situations before deciding whether closeness, space, or a clearer agreement is what you need next.' : p.need,
      protection: mixed ? `One thread in your answers: ${p.protection} Another: ${portraits[ranked[1]].protection}` : p.protection,
      cost: mixed ? 'A response that helps in one situation can complicate another. If either response becomes automatic, the immediate need may go unnamed. Comparing the situations is more useful than asking which single label is the real you.' : p.cost,
      misread: mixed ? 'A change of response can look inconsistent from the outside. Your answers suggest it is worth asking what changed in the situation, rather than assuming all the choices come from the same need.' : p.misread,
      pivot: mixed ? 'Before acting, name the immediate need: more contact, less pressure, a clear limit, or a specific repair. Ask for that one thing instead of making the moment decide the whole relationship.' : p.pivot,
      relationship: [
        { title: 'When they respond and follow through', body: 'Let that behavior count as information. Notice whether you can receive it, or whether you immediately change what would be enough. A workable agreement does not have to remove every uncomfortable feeling.' },
        { title: 'When the words are warm but behavior stays the same', body: 'Look at the repeated action: the plan not made, the return that does not happen, or the boundary that keeps being crossed. Ask about that specific pattern. More self-understanding does not make an unmet need disappear.' },
        { title: 'When your request is dismissed', body: 'You can clarify once without taking responsibility for both sides of the conversation. Decide what you can accept and what you will do if it continues. Your next step may be a limit rather than a better explanation.' },
      ],
    },
  };
}
