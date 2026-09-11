import type { QuizQuestion, ResultProfile } from './quiz';

export const readingThemes: Record<string, { title: string; need: string; watch: string; ask: string }> = {
  presence: { title: 'Closeness you can feel', need: 'ordinary, tangible moments of shared presence', watch: 'Restoring warmth does not always resolve the issue underneath it.', ask: 'What small sign of connection would help, and what would you still need to discuss?' },
  voice: { title: 'Connection through being heard', need: 'attention and space to put experience into words', watch: 'An invitation to talk works best when both people have the capacity to listen.', ask: 'Do you want listening, reassurance, or a solution? Say which one would help first.' },
  action: { title: 'Care that becomes action', need: 'movement, participation, and practical changes', watch: 'Doing something useful can support a feeling without fully expressing it.', ask: 'After the activity or task, what feeling or request would still deserve words?' },
  novelty: { title: 'Room for discovery together', need: 'fresh experiences and a sense of shared possibility', watch: 'A change of setting can refresh a connection without changing a recurring problem.', ask: 'What would you like to bring from a good shared experience into ordinary days?' },
  community: { title: 'Connection within a wider world', need: 'friendship and belonging beyond one relationship', watch: 'Outside support can give perspective, but cannot replace a conversation that belongs between you and your partner.', ask: 'Which part would you share with a friend, and which part needs to reach your partner directly?' },
  space: { title: 'Closeness with room to be yourself', need: 'a personal pace and interests of your own', watch: 'Unexplained space can be read as disinterest even when it helps you reconnect.', ask: 'How could you make both your need for space and your intention to reconnect clear?' },
  rest: { title: 'A quieter place to recover', need: 'fewer demands before returning to contact', watch: 'A pause can help recovery; an indefinite pause can leave the other person guessing.', ask: 'What would tell you that you are ready to return, and how could you communicate that?' },
  reflection: { title: 'Time to understand before responding', need: 'a chance to organize experience at your own pace', watch: 'Private reflection can become a loop if the part that needs a response never gets shared.', ask: 'What is one fact, one feeling, and one request you could take into the next conversation?' },
  reassurance: { title: 'A visible thread of connection', need: 'a recognizable sign that the connection remains available', watch: 'Memories and phone checking cannot reliably tell you what another person currently thinks.', ask: 'What do you know about this moment, and what are you filling in while you wait?' },
  planning: { title: 'Trust through follow-through', need: 'agreements that become observable actions', watch: 'A workable plan needs consent from both people, and space to revisit it when circumstances change.', ask: 'What is one small agreement you can both carry out and review together?' },
};

export function buildRelationshipReading(questions: QuizQuestion[], choices: Record<string, number>) {
  const selected = questions.map(q => ({ q, o: q.options[choices[q.id]] })).filter(x => x.o);
  const counts = new Map<string, number>();
  for (const { o } of selected) if (o.readingFocus && readingThemes[o.readingFocus]) counts.set(o.readingFocus, (counts.get(o.readingFocus) ?? 0) + 1);
  const ranked = [...counts].sort((a,b) => b[1]-a[1]);
  const lead = ranked[0] ? readingThemes[ranked[0][0]] : readingThemes.voice;
  const mixed = !ranked[0] || ranked[0][1] === ranked[1]?.[1];
  const result: ResultProfile = {
    key: 'choices', eyebrow: 'Your relationship reflection',
    title: mixed ? 'Different moments, different ways of connecting' : lead.title,
    summary: mixed
      ? 'Your selections do not point to one single response. The way you approach closeness changes across these situations. Your full reading follows those shifts through meeting, waiting, receiving care, personal space, and repair.'
      : `Across these scenes, you returned to ${lead.need}. This is a theme in the images you chose, not a fixed attachment identity. Your full reading explores where that preference supports you and where a different situation changes what you need.`,
    strength: `A possible resource in your choices is ${lead.need}. Notice where that actually helps in your own relationships.`, watchout: lead.watch, nextStep: lead.ask,
    themeTitle: mixed ? 'Different moments, different ways of connecting' : lead.title,
  };
  const modules = [...new Set(selected.map(x => x.q.kicker))].map(title => {
    const entries=selected.filter(x=>x.q.kicker===title);
    const themes=[...new Set(entries.map(x=>x.o.readingFocus).filter((key): key is string=>!!key&&!!readingThemes[key]))];
    const needs=themes.map(k=>readingThemes[k].need);
    return { title, explanation: `In these situations, you chose ${entries.map(x=>`“${x.o.label}”`).join(', ')}.\n\n${themes.length>1 ? 'Your preferences shift with the situation: these scenes make room for ' : 'A recurring thread in these scenes is '}${needs.join('; ')}. Compare these preferences with what you actually do when the same situation happens. An appealing image and an automatic response are not always the same.`, reflection: themes.length>1 ? 'Which change in the situation changes what you need? Notice whether you make that shift clear to the other person, or expect them to infer it.' : (readingThemes[themes[0]]?.ask ?? lead.ask) };
  });
  return { result, deepResult: { modules, lens: { title: 'A pattern, not a verdict', explanation: 'These scores describe how often your image choices leaned toward reaching, stepping back, staying steady, or doing both. Your report also follows the actions and settings in the pictures you selected. A visual preference can have several explanations; it cannot establish childhood experiences, diagnose an attachment style, or reveal facts about another person.', reflectionPrompt: lead.ask } } };
}
