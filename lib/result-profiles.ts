import { TRAIT_KEYS, type LockedModule, type ResultAxis, type TraitKey } from "@/lib/quiz";

type TypeCopy = {
  title: string;
  summary: string;
  coreDrive: string;
  inRelationships: string;
  underPressure: string;
  trigger: string;
  superpower: string;
};

const types: Record<string, Record<TraitKey, TypeCopy>> = {
  "attachment-style": {
    explorer: {
      title: "You reach first",
      summary: "When closeness feels uncertain, your instinct is to move toward it. A clear question or a visible next step is how your body looks for safety.",
      coreDrive: "You restore safety by making contact. Silence feels harder than an imperfect conversation.",
      inRelationships: "Partners may experience you as direct and engaged, and sometimes as needing an answer before they have found their words.",
      underPressure: "If the other person stays quiet, you may push for clarity faster than the bond can metabolize the moment.",
      trigger: "Unanswered messages, sudden distance, or a change in tone.",
      superpower: "You can name the gap and start repair before a small silence becomes a story.",
    },
    connector: {
      title: "You soften first",
      summary: "When closeness feels uncertain, you look for warmth before facts. A caring signal tells your body the bond is still intact.",
      coreDrive: "You restore safety through reassurance and emotional presence, not through solving the problem first.",
      inRelationships: "Partners may feel deeply considered, and may also feel responsible for soothing you when they need space.",
      underPressure: "If warmth is missing, you can read ordinary delay as a threat to the relationship.",
      trigger: "A cooler reply, a cancelled plan, or affection that suddenly feels generic.",
      superpower: "You notice the emotional temperature early and can bring care back into the room.",
    },
    architect: {
      title: "You need a map",
      summary: "When closeness feels uncertain, you want space and a clear return point. Distance is manageable when you know what happens next.",
      coreDrive: "You restore safety through structure: time, expectations, and enough privacy to settle.",
      inRelationships: "Partners may experience you as steady and fair, and sometimes as hard to reach while you sort the situation.",
      underPressure: "If someone rushes you, you may close further, waiting for the interaction to have a workable shape.",
      trigger: "Ambiguous plans, emotional flooding, or being asked to talk before you are ready.",
      superpower: "You can turn a messy moment into something both people can actually follow.",
    },
    creator: {
      title: "You wait for the feeling",
      summary: "When closeness feels uncertain, you wait for the moment to feel emotionally true. Timing and atmosphere matter as much as the words.",
      coreDrive: "You restore safety when the inner weather matches the conversation you are being asked to have.",
      inRelationships: "Partners may experience you as sensitive and deep, and sometimes as difficult to read until the moment is right.",
      underPressure: "Mixed signals can hold you in place. You may replay tone more than content.",
      trigger: "Pressure to decide, a conversation that feels off, or affection that skips the emotional truth.",
      superpower: "You can sense what is actually happening under the argument and wait for a more honest opening.",
    },
  },
  "emotional-needs": {
    explorer: {
      title: "You need movement",
      summary: "When life gets noisy, your mind asks for room to change direction. Agency is the feeling of enough.",
      coreDrive: "You settle when you can choose, start, or physically change the scene.",
      inRelationships: "People close to you may see your aliveness, and may misread your need to move as restlessness with them.",
      underPressure: "Feeling trapped can make even good care feel heavy.",
      trigger: "Stuck plans, repeated advice, or a day with no exit.",
      superpower: "You can reopen a stale situation by creating one real option.",
    },
    connector: {
      title: "You need to be held",
      summary: "When life gets noisy, you need to feel received, not merely advised. Being accurately understood is the reset.",
      coreDrive: "You settle when someone meets the feeling before they try to fix it.",
      inRelationships: "People close to you may feel trusted with your inner world, and may not always know that presence matters more than solutions.",
      underPressure: "Advice without warmth can land as distance.",
      trigger: "Being handled, rushed, or talked out of a feeling.",
      superpower: "You can name the need under the complaint and invite real contact.",
    },
    architect: {
      title: "You need order",
      summary: "When life gets noisy, you ask for a smaller, clearer world. One dependable structure reduces the load.",
      coreDrive: "You settle when the next step is visible and the extras are contained.",
      inRelationships: "People close to you may rely on your clarity, and may feel you go quiet while you rebuild order.",
      underPressure: "Open-ended emotion with no edge can exhaust you.",
      trigger: "Chaos, unclear expectations, or too many open loops.",
      superpower: "You can turn overwhelm into a sequence that the nervous system can follow.",
    },
    creator: {
      title: "You need a world of your own",
      summary: "When life gets noisy, you need private space where feelings do not have to be simplified.",
      coreDrive: "You settle in solitude, beauty, or a room that asks nothing of you.",
      inRelationships: "People close to you may admire your inner life, and may feel shut out when you disappear into it.",
      underPressure: "Being asked to explain yourself too soon can make you withdraw further.",
      trigger: "Constant availability, bright social noise, or having to perform okay.",
      superpower: "You can metabolize experience in private and return with a truer sentence.",
    },
  },
  "conflict-style": {
    explorer: {
      title: "You name it now",
      summary: "When tension enters the room, you move toward the issue. Unresolved silence is harder than an imperfect conversation.",
      coreDrive: "You reduce threat by putting the problem on the table.",
      inRelationships: "Others may feel your honesty as respect, and sometimes as intensity they were not ready for.",
      underPressure: "You may push for resolution while the other person is still flooded.",
      trigger: "Avoided topics, delayed replies after a rupture, or polite pretending.",
      superpower: "You can start the repair others are circling.",
    },
    connector: {
      title: "You warm the room",
      summary: "When tension enters, you protect the bond first. Softening the temperature matters more than winning the point.",
      coreDrive: "You look for a sign that you are still on the same side.",
      inRelationships: "Others may feel safer with you in conflict, and may also notice you postpone the hard sentence.",
      underPressure: "You can smooth things over before the real issue has been named.",
      trigger: "A hard tone, a public disagreement, or the fear that truth will cost closeness.",
      superpower: "You can keep two people in the conversation long enough for repair.",
    },
    architect: {
      title: "You step back first",
      summary: "When tension rises, you sort the facts before you return. Intensity is easier after the situation has a shape.",
      coreDrive: "You trust a calm, organized response more than an immediate emotional one.",
      inRelationships: "Others may experience your pause as fairness, and sometimes as withdrawal.",
      underPressure: "If you are crowded, you may stay gone longer than the other person can tolerate.",
      trigger: "Raised voices, moving goalposts, or being asked to decide mid-flood.",
      superpower: "You can come back with a version of the problem both people can work with.",
    },
    creator: {
      title: "You find the real issue",
      summary: "When tension rises, you listen under the argument. Tone, timing, and contradiction tell you more than the words.",
      coreDrive: "You want the emotional truth, not only the surface complaint.",
      inRelationships: "Others may feel unusually seen, and may also feel you read more than they meant to show.",
      underPressure: "You can get lost in meaning and delay the practical repair.",
      trigger: "A conversation that sounds fine and feels wrong.",
      superpower: "You can name the thing the fight is actually about.",
    },
  },
  "social-energy": {
    explorer: {
      title: "You jump in",
      summary: "Other people give you energy when there is movement and low-friction participation. Doing together restores you more than long explanation.",
      coreDrive: "You charge through novelty, activity, and easy entry.",
      inRelationships: "Friends may love your yes, and may not see how quickly a sticky social script drains you.",
      underPressure: "A night with no momentum can feel heavier than a full room.",
      trigger: "Small talk with no exit, or plans that stall.",
      superpower: "You can turn a flat gathering into something that actually moves.",
    },
    connector: {
      title: "You want one real person",
      summary: "Your social battery fills through warmth and one mutual exchange, not through crowd size.",
      coreDrive: "Quality of contact matters more than how many people are there.",
      inRelationships: "People may feel specially chosen by you, and large groups may leave you looking for the one conversation that counts.",
      underPressure: "A loud room with no intimacy can empty you fast.",
      trigger: "Being passed around, or never getting past the surface.",
      superpower: "You can make one person feel like the whole night landed.",
    },
    architect: {
      title: "You watch first",
      summary: "You enter social life more easily when you know the shape of the interaction and have time to observe.",
      coreDrive: "Predictable roles and a manageable level of stimulation protect your attention.",
      inRelationships: "Others may see you as reserved at first, then unusually reliable once you have a place in the room.",
      underPressure: "Surprise guests or unclear plans can make you decline the whole thing.",
      trigger: "Open-ended hangouts, last-minute changes, or no quiet corner.",
      superpower: "You can hold a group steady by giving it structure.",
    },
    creator: {
      title: "You leave while you still like them",
      summary: "You restore your social battery through autonomy and atmosphere. After carrying other people, you need a world that asks nothing.",
      coreDrive: "Solitude is not rejection. It is how your system comes back online.",
      inRelationships: "Friends may misread your early exit as distance, when it is often how you stay fond of them.",
      underPressure: "Being guilted into one more hour can sour the whole memory.",
      trigger: "No permission to leave, or a night that keeps demanding performance.",
      superpower: "You know when to protect the part of you that makes you good company later.",
    },
  },
  "love-language": {
    explorer: {
      title: "Go with me",
      summary: "You feel most loved when someone enters your world and makes something happen with you. Shared motion is the message.",
      coreDrive: "Love lands as initiative and lived experience, not only as words.",
      inRelationships: "Partners who plan, invite, and show up in your actual life feel closest.",
      underPressure: "Affection that stays verbal while nothing changes can feel empty.",
      trigger: "Cancelled adventures, or love that never leaves the chat.",
      superpower: "You can turn ordinary time into a memory the relationship can stand on.",
    },
    connector: {
      title: "Say it so I can feel it",
      summary: "You feel most loved when care is personal and spoken. Evidence that you are specifically known lands deeper than a generic gesture.",
      coreDrive: "Recognition is the gift. Someone noticed the exact person you are.",
      inRelationships: "Partners who name what they see in you make the bond feel real.",
      underPressure: "Practical help without tenderness can feel like being managed.",
      trigger: "Generic compliments, or silence after you have been vulnerable.",
      superpower: "You can make love audible in a way people remember.",
    },
    architect: {
      title: "Handle it with me",
      summary: "You feel most loved when promises become visible. Follow-through is emotional evidence.",
      coreDrive: "Consistency makes affection trustworthy rather than temporary.",
      inRelationships: "Partners who reduce your load without being asked often reach you first.",
      underPressure: "Grand words with no follow-through can feel less safe than quiet competence.",
      trigger: "Broken small promises, or romance that never becomes reliable.",
      superpower: "You know how to love in a way that makes daily life lighter.",
    },
    creator: {
      title: "Make it mean something",
      summary: "You feel most loved through details made on purpose. The story behind a gesture can matter as much as the gesture.",
      coreDrive: "Intention and emotional texture are the signal.",
      inRelationships: "Partners who remember the private language of the relationship reach you quickly.",
      underPressure: "Efficient, generic care can miss you entirely.",
      trigger: "Copy-paste affection, or beautiful words with no personal mark.",
      superpower: "You can make a small moment feel like it belongs only to the two of you.",
    },
  },
  "stress-reset": {
    explorer: {
      title: "You reset by moving",
      summary: "When everything is too much, your body asks for a change of scene. Motion interrupts the loop.",
      coreDrive: "You reorganize after your body has somewhere to go.",
      inRelationships: "People may see you leave the room and think you are avoiding them, when you are trying to come back usable.",
      underPressure: "Being told to sit still and talk it through can raise the charge.",
      trigger: "Stuck indoor hours, or rumination with no physical exit.",
      superpower: "You can break a spiral with one change of place.",
    },
    connector: {
      title: "You reset beside someone",
      summary: "Stress drops when the burden is no longer carried alone. Safe contact tells your system support is available.",
      coreDrive: "A responsive person or welcoming space is the fastest downshift.",
      inRelationships: "You may reach for company first, even when you cannot yet explain the problem.",
      underPressure: "Being left to handle it alone can make the stress feel bigger than it is.",
      trigger: "Isolation during a hard day, or comfort that stays logistical.",
      superpower: "You can co-regulate and help another nervous system settle too.",
    },
    architect: {
      title: "You reset by making one thing clear",
      summary: "Stress drops when noise shrinks and one piece becomes controllable. Order is not coldness; it is oxygen.",
      coreDrive: "A workable boundary separates the real problem from the surrounding flood.",
      inRelationships: "Others may see you tidy, list, or close tabs and not realize that is how you come back to them.",
      underPressure: "Open emotion with no container can keep you flooded.",
      trigger: "Piles, unclear asks, or five emergencies at once.",
      superpower: "You can find the one next action that makes the rest smaller.",
    },
    creator: {
      title: "You reset in quiet",
      summary: "When everything is too much, you need low stimulation and room for the feeling to finish. Beauty or silence does the work words cannot.",
      coreDrive: "Your system metabolizes experience before language returns.",
      inRelationships: "People may experience your quiet as absence. For you it is often the only way not to snap.",
      underPressure: "Being asked to narrate the stress while it is still happening can keep it stuck.",
      trigger: "Noise, bright lights, or a demand to be okay in public.",
      superpower: "You can return from quiet with a truer, calmer self.",
    },
  },
  "boundary-style": {
    explorer: {
      title: "Clear open or closed",
      summary: "A healthy boundary, for you, is easy to see. A direct yes or no prevents hidden resentment later.",
      coreDrive: "You respect limits that are explicit and decisive.",
      inRelationships: "Others always know where they stand, and may sometimes feel the door close faster than they expected.",
      underPressure: "You may state the limit before you have explained the care around it.",
      trigger: "Hinting, lingering maybes, or people who keep pushing a soft no.",
      superpower: "You can stop a leak before it becomes a rupture.",
    },
    connector: {
      title: "Warm but firm",
      summary: "You protect your space in a way that still communicates care. The limit and the relationship have to travel together.",
      coreDrive: "A boundary feels safe when it does not have to sound cold.",
      inRelationships: "People often accept your no because they still feel wanted. You may delay the no to keep that feeling.",
      underPressure: "Fear of disappointing someone can make the boundary arrive late.",
      trigger: "A choice that seems to cost love, or a person who treats firmness as rejection.",
      superpower: "You can say no without making the other person into an enemy.",
    },
    architect: {
      title: "Private and protected",
      summary: "You protect time, privacy, and access with dependable rules. People feel safer when they know the edge.",
      coreDrive: "Consistency is how you stay available without being invaded.",
      inRelationships: "Others may find you hard to reach at first, then unusually trustworthy once the rules are clear.",
      underPressure: "Surprise access to your time or inner life can feel like a break-in.",
      trigger: "Dropped-in plans, reading over your shoulder, or 'just this once'.",
      superpower: "You can design a life that stays kind because it is not constantly overrun.",
    },
    creator: {
      title: "Open when it feels right",
      summary: "Your boundary follows internal timing. You may notice the limit only after your capacity has already changed.",
      coreDrive: "Context and emotional truth decide the edge more than a fixed rule.",
      inRelationships: "People may find you flexible and confusing: yes on Tuesday, not on Thursday, both sincere.",
      underPressure: "You can over-give, then disappear to recover.",
      trigger: "Being locked into a rule that no longer matches the moment.",
      superpower: "You can revise a limit when the relationship actually needs a different shape.",
    },
  },
  "hidden-strength": {
    explorer: {
      title: "You start before it is certain",
      summary: "The strength people miss is your willingness to begin. You turn uncertainty into information by moving.",
      coreDrive: "Initiation is how you think.",
      inRelationships: "Others borrow your momentum and may forget you also need a reason to stay.",
      underPressure: "You may start too many doors and finish fewer than you meant to.",
      trigger: "Endless planning with no first step.",
      superpower: "You can create movement in rooms that have been stuck.",
    },
    connector: {
      title: "You make people feel possible",
      summary: "The strength people miss is how you notice emotional context and help others feel understood.",
      coreDrive: "You look for what can be nurtured between people.",
      inRelationships: "You are often the quiet reason a group feels human. You may not count that as a skill.",
      underPressure: "You can carry other people's feelings until there is no room for your own.",
      trigger: "A room where no one is being seen.",
      superpower: "You can change the temperature of a relationship without making it a performance.",
    },
    architect: {
      title: "You keep the pattern workable",
      summary: "The strength people miss is your eye for structure. You preserve what matters after the first impression fades.",
      coreDrive: "You look for the version that will still make sense tomorrow.",
      inRelationships: "Others rely on you to remember, organize, and hold the thread. They may not see the cost.",
      underPressure: "You can become the only adult in the room and resent it.",
      trigger: "Sloppiness that endangers something you care about.",
      superpower: "You can make complexity livable.",
    },
    creator: {
      title: "You see the second meaning",
      summary: "The strength people miss is how you connect unlikely details. You notice the interpretation others skip.",
      coreDrive: "Your mind comes alive where more than one reading can be true.",
      inRelationships: "People come to you for language they did not have. You may underestimate how rare that is.",
      underPressure: "You can over-interpret and delay a simple action.",
      trigger: "Being told to keep it simple when the simple version is not true.",
      superpower: "You can name a pattern in a way that makes someone feel less alone inside it.",
    },
  },
};

const axes: Record<string, { left: { label: string; keys: TraitKey[] }; right: { label: string; keys: TraitKey[] } }> = {
  "attachment-style": {
    left: { label: "Reach for closeness", keys: ["explorer", "connector"] },
    right: { label: "Protect space", keys: ["architect", "creator"] },
  },
  "emotional-needs": {
    left: { label: "Need contact or motion", keys: ["explorer", "connector"] },
    right: { label: "Need quiet or order", keys: ["architect", "creator"] },
  },
  "conflict-style": {
    left: { label: "Engage the tension", keys: ["explorer", "connector"] },
    right: { label: "Step back to sort it", keys: ["architect", "creator"] },
  },
  "social-energy": {
    left: { label: "Charge with people", keys: ["explorer", "connector"] },
    right: { label: "Restore alone", keys: ["architect", "creator"] },
  },
  "love-language": {
    left: { label: "Love as shared experience", keys: ["explorer", "connector"] },
    right: { label: "Love as follow-through", keys: ["architect", "creator"] },
  },
  "stress-reset": {
    left: { label: "Reset by moving or reaching", keys: ["explorer", "connector"] },
    right: { label: "Reset by quiet or order", keys: ["architect", "creator"] },
  },
  "boundary-style": {
    left: { label: "Show the edge", keys: ["explorer", "connector"] },
    right: { label: "Guard access", keys: ["architect", "creator"] },
  },
  "hidden-strength": {
    left: { label: "Outward strength", keys: ["explorer", "connector"] },
    right: { label: "Inner strength", keys: ["architect", "creator"] },
  },
};

export function scoreTraitChoices(choices: number[]) {
  const scores = { explorer: 0, connector: 0, architect: 0, creator: 0 };
  for (const index of choices) {
    const key = TRAIT_KEYS[index];
    if (key) scores[key] += 1;
  }
  const winner = TRAIT_KEYS.reduce((best, key) => (scores[key] > scores[best] ? key : best));
  return { scores, winner, answered: choices.length };
}

function axisValue(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 10 * 10) / 10;
}

export function buildTypedResult(testId: string, choiceIndexes: number[]) {
  const { scores, winner, answered } = scoreTraitChoices(choiceIndexes);
  const copy = types[testId]?.[winner] ?? types["attachment-style"].explorer;
  const pair = axes[testId] ?? axes["attachment-style"];
  const leftScore = pair.left.keys.reduce((sum, key) => sum + scores[key], 0);
  const rightScore = pair.right.keys.reduce((sum, key) => sum + scores[key], 0);
  const resultAxes: ResultAxis[] = [
    { label: pair.left.label, value: axisValue(leftScore, answered), caption: leftScore >= rightScore ? "Stronger in this test" : "Present" },
    { label: pair.right.label, value: axisValue(rightScore, answered), caption: rightScore > leftScore ? "Stronger in this test" : "Present" },
  ];
  const lockedModules: LockedModule[] = [
    { title: "Every choice decoded", teaser: `What each of your ${answered || 15} answers may be reflecting back to you.` },
    { title: "In close relationships", teaser: copy.inRelationships },
    { title: "Your trigger", teaser: copy.trigger },
    { title: "Your superpower", teaser: copy.superpower },
  ];
  return { copy, winner, scores, answered, axes: resultAxes, lockedModules };
}

export function resultCopyFor(testId: string, key: TraitKey) {
  return types[testId]?.[key] ?? types["attachment-style"][key];
}
