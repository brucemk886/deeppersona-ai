import type { TraitKey } from "@/lib/quiz";

export type ChoiceInsight = {
  meaning: string;
  projection: string;
};

type SignalSet = Record<TraitKey, ChoiceInsight>;

const testSignals: Record<string, SignalSet> = {
  "attachment-style": {
    explorer: {
      meaning: "A preference for direct contact and visible repair when closeness becomes uncertain.",
      projection: "You may read safety as something that can be restored through a clear move, an honest question, or a shared next step.",
    },
    connector: {
      meaning: "A preference for warmth, reassurance, and signs that the emotional bond is still intact.",
      projection: "You may notice small changes in availability quickly and look for a caring response before your body can fully relax.",
    },
    architect: {
      meaning: "A preference for space, consistency, and enough privacy to regulate before reconnecting.",
      projection: "You may associate safety with not being rushed; distance feels manageable when expectations and return points are clear.",
    },
    creator: {
      meaning: "A preference for emotional timing, nuance, and a response that can hold both closeness and freedom.",
      projection: "You may experience connection through atmosphere and meaning, so mixed signals can feel especially powerful until the moment feels emotionally true.",
    },
  },
  "emotional-needs": {
    explorer: {
      meaning: "A need for movement, choice, and room to change direction without feeling trapped.",
      projection: "You may project relief onto open possibilities because agency helps your inner world feel alive again.",
    },
    connector: {
      meaning: "A need to feel emotionally received rather than merely listened to or advised.",
      projection: "You may project comfort onto signs of warmth and mutual presence; being accurately understood can matter more than having the problem solved.",
    },
    architect: {
      meaning: "A need for order, dependable boundaries, and a clear sense of what happens next.",
      projection: "You may project calm onto structure because clarity reduces the amount of uncertainty your attention has to carry.",
    },
    creator: {
      meaning: "A need for private expression, imagination, and space where feelings do not have to be simplified.",
      projection: "You may project relief onto beauty or solitude because symbolic experiences give your inner world room to become understandable.",
    },
  },
  "conflict-style": {
    explorer: {
      meaning: "An instinct to move toward the issue and reduce tension through direct engagement.",
      projection: "You may assume that clarity arrives through action, making unresolved silence feel harder to tolerate than an imperfect conversation.",
    },
    connector: {
      meaning: "An instinct to protect the bond and soften the emotional temperature before solving the disagreement.",
      projection: "You may read harmony as evidence that the relationship is safe, which can make another person's discomfort feel urgent to repair.",
    },
    architect: {
      meaning: "An instinct to step back, sort the facts, and return when the situation has a workable structure.",
      projection: "You may trust a calm, organized response more than an immediate emotional one, especially when intensity threatens accuracy.",
    },
    creator: {
      meaning: "An instinct to find the emotional truth beneath the surface argument.",
      projection: "You may sense hidden meanings quickly and project importance onto tone, timing, and contradiction—not only the words being said.",
    },
  },
  "social-energy": {
    explorer: {
      meaning: "A social preference for novelty, movement, and low-friction participation.",
      projection: "You may project energy onto environments that offer momentum and possibility, where connection can happen through doing rather than prolonged self-explanation.",
    },
    connector: {
      meaning: "A social preference for warmth, familiarity, and one genuinely mutual exchange.",
      projection: "You may measure a social experience by emotional quality rather than crowd size; one attentive person can change the entire room for you.",
    },
    architect: {
      meaning: "A social preference for manageable stimulation, a clear role, and time to observe before joining.",
      projection: "You may project ease onto predictable settings because knowing the shape of the interaction protects your attention.",
    },
    creator: {
      meaning: "A social preference for autonomy, atmosphere, and enough solitude to hear your own thoughts.",
      projection: "You may project restoration onto spaces that ask nothing from you, especially after carrying noise, performance, or other people's expectations.",
    },
  },
  "love-language": {
    explorer: {
      meaning: "Care expressed through shared experience, initiative, and choosing aliveness together.",
      projection: "You may read love most clearly when someone actively enters your world and creates a memory with you.",
    },
    connector: {
      meaning: "Care expressed through attentive words, emotional presence, and signs that you are specifically known.",
      projection: "You may project love onto personal recognition; generic affection lands less deeply than evidence that someone truly noticed you.",
    },
    architect: {
      meaning: "Care expressed through reliability, practical help, and promises that become visible actions.",
      projection: "You may read follow-through as emotional evidence because consistency makes affection feel trustworthy rather than temporary.",
    },
    creator: {
      meaning: "Care expressed through thoughtful details, symbolism, and moments made meaningful on purpose.",
      projection: "You may project love onto intention and emotional texture; the story behind a gesture can matter as much as the gesture itself.",
    },
  },
  "stress-reset": {
    explorer: {
      meaning: "A reset through movement, changed scenery, and enough momentum to interrupt feeling stuck.",
      projection: "You may project relief onto forward motion because your thoughts often reorganize after your body has somewhere to go.",
    },
    connector: {
      meaning: "A reset through safe contact, shared presence, and the feeling that the burden is no longer carried alone.",
      projection: "You may project calm onto a responsive person or welcoming space because connection tells your nervous system that support is available.",
    },
    architect: {
      meaning: "A reset through reduced noise, clear priorities, and one controllable piece of order.",
      projection: "You may project safety onto structure because a workable boundary helps separate the real problem from the surrounding overwhelm.",
    },
    creator: {
      meaning: "A reset through low stimulation, solitude, and room for feelings to settle without demand.",
      projection: "You may project restoration onto quiet or beauty because your system needs space to metabolize experience before language returns.",
    },
  },
  "boundary-style": {
    explorer: {
      meaning: "A boundary that is explicit, decisive, and easy for both people to understand.",
      projection: "You may project respect onto directness, believing that a visible yes or no prevents hidden resentment later.",
    },
    connector: {
      meaning: "A boundary delivered with warmth and consideration for the relationship around it.",
      projection: "You may project safety onto a limit that still communicates care, and may hesitate when firmness risks disappointing someone.",
    },
    architect: {
      meaning: "A boundary built around privacy, ownership, and dependable rules of access.",
      projection: "You may project trust onto consistency; people feel safer when they respect the limits that protect your time and inner world.",
    },
    creator: {
      meaning: "A boundary guided by internal timing, context, and whether the moment feels emotionally right.",
      projection: "You may project freedom onto flexible limits, but can notice the boundary only after your internal capacity has already changed.",
    },
  },
  "hidden-strength": {
    explorer: {
      meaning: "The ability to initiate, experiment, and create movement before certainty is available.",
      projection: "You may be drawn to cues of direction and possibility because beginning is one of the ways you turn uncertainty into information.",
    },
    connector: {
      meaning: "The ability to notice emotional context and help different people feel understood.",
      projection: "You may be drawn to signs of life and welcome because your attention naturally looks for what can be nurtured between people.",
    },
    architect: {
      meaning: "The ability to detect structure, preserve what matters, and make complexity workable.",
      projection: "You may be drawn to depth and order because your mind looks for the pattern that will still make sense after the first impression fades.",
    },
    creator: {
      meaning: "The ability to connect unlikely details and reveal meaning that other people overlook.",
      projection: "You may be drawn to ambiguity and visual surprise because your mind comes alive where more than one interpretation can be true.",
    },
  },
};

const atlasProjections: Record<string, Record<TraitKey, string>> = {
  doors: {
    explorer: "In a doorway image, your eye chose the most actionable threshold.",
    connector: "In a doorway image, your eye chose the entrance that felt most welcoming.",
    architect: "In a doorway image, your eye chose the entrance with the clearest protection and control.",
    creator: "In a doorway image, your eye chose atmosphere and possibility over certainty.",
  },
  rooms: {
    explorer: "In a room image, your eye chose a space that leaves you free to move and participate.",
    connector: "In a room image, your eye chose a space organized around warmth and shared presence.",
    architect: "In a room image, your eye chose a space with privacy, order, and a defined purpose.",
    creator: "In a room image, your eye chose a space with mood, imagination, and emotional depth.",
  },
  landscapes: {
    explorer: "In a landscape image, your eye chose openness, momentum, and a visible horizon.",
    connector: "In a landscape image, your eye chose softness, nearness, and a sense of being held by the setting.",
    architect: "In a landscape image, your eye chose shelter, steadiness, and a path that can be trusted.",
    creator: "In a landscape image, your eye chose distance, mystery, and space for the mind to wander.",
  },
  symbols: {
    explorer: "In a symbol image, your eye chose direction—the object that could help you move.",
    connector: "In a symbol image, your eye chose growth—the object that suggests care and reciprocity.",
    architect: "In a symbol image, your eye chose a container—the object that can hold, record, or organize experience.",
    creator: "In a symbol image, your eye chose transformation—the object that changes how the same light is seen.",
  },
};

const fallbackSignals: SignalSet = {
  explorer: {
    meaning: "A preference for agency, movement, and a response that creates forward motion.",
    projection: "You may look for safety in what can be approached, changed, or explored directly.",
  },
  connector: {
    meaning: "A preference for warmth, reciprocity, and signs of emotional connection.",
    projection: "You may look for safety in what feels welcoming, responsive, and alive.",
  },
  architect: {
    meaning: "A preference for clarity, protection, and a response with dependable structure.",
    projection: "You may look for safety in what feels ordered, private, and predictable.",
  },
  creator: {
    meaning: "A preference for meaning, nuance, and room for more than one interpretation.",
    projection: "You may look for safety in what feels emotionally resonant, imaginative, and self-directed.",
  },
};

function atlasKey(path: string) {
  if (path.includes("rooms")) return "rooms";
  if (path.includes("landscapes")) return "landscapes";
  if (path.includes("symbols")) return "symbols";
  return "doors";
}

export function getOptionInsight(testId: string, atlasPath: string, scoreKey: TraitKey): ChoiceInsight {
  const signal = testSignals[testId]?.[scoreKey] ?? fallbackSignals[scoreKey];
  const visualProjection = atlasProjections[atlasKey(atlasPath)]?.[scoreKey] ?? "Your first visual pull is part of the pattern.";
  return {
    meaning: signal.meaning,
    projection: `${visualProjection} ${signal.projection}`,
  };
}
