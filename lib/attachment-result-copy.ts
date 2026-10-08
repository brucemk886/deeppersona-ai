import type { FixedKey, FixedOverview } from './attachment-fixed';

// Exact corrections to the former default introductions. Custom managed copy
// remains verbatim; stored reports and their paid interpretations are not rewritten.
export const FIXED_INTRO_REVISIONS:Record<FixedKey,{before:string;after:string}> = {
  "anxious": {
    "before": "Small changes in contact can take up a lot of space in your mind. You may want to talk, check, and make sure you still matter. Reassurance can help in the moment, while the next unanswered message brings the question back.",
    "after": "A slower reply can leave you wondering whether something has changed between you. You may replay the conversation, reach out again, and struggle to relax until you feel close again. Keeping the connection can take so much effort that what originally upset you never gets resolved."
  },
  "avoidant": {
    "before": "You often turn toward yourself when feelings are difficult, and create space when closeness becomes demanding. Other people may see independence without realizing that you also have needs you rarely bring into the conversation.",
    "after": "You may care deeply about someone and still expect less when you feel disappointed. Instead of saying what hurt, you handle things yourself and reveal less of what you need. Your partner may assume you are fine, while you find it harder to feel supported in the relationship."
  },
  "fearful": {
    "before": "You may reach for connection and then feel exposed when it arrives. A need comes out and is taken back; distance feels safer until you begin to miss the person. Wanting care and wanting protection can show up in the same moment.",
    "after": "You want to be close, but once you open up, you may worry that you have trusted too much. You pull back to feel safer, then miss the person and want contact again. You can spend more time deciding whether to trust the relationship than enjoying being in it."
  },
  "secure": {
    "before": "You tend to express what you need, allow room for time apart, and return to difficult conversations. You can still feel hurt or uncertain, while using what actually happens to judge the relationship instead of having to re-establish your worth each time.",
    "after": "You can care about someone, ask for what you need, and still keep time for your own life. A disagreement does not immediately make you doubt the whole relationship. But being patient and understanding can still leave you accepting too little if the other person repeatedly fails to follow through."
  }
};

export function fixedResultIntro(o:Pick<FixedOverview,'primary'|'summary'>):string {
 const change=o.primary?FIXED_INTRO_REVISIONS[o.primary]:undefined;
 return change&&o.summary===change.before?change.after:o.summary;
}

export const FIXED_RISK_QUESTIONS:Record<FixedKey,string> = {
  "anxious": "When does trying to keep them close start costing you too much?",
  "avoidant": "How can protecting your space leave you feeling more alone?",
  "fearful": "How can wanting closeness turn into pushing it away?",
  "secure": "When does understanding someone become accepting too little?"
};
