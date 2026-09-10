import { ATTACHMENT_STYLE_META, type AttachmentStyle } from "./attachment";
import { type QuizQuestion, type QuizTest } from "./quiz";

export const ATTACHMENT_TEST_ID = "attachment-style";

export const defaultTests: QuizTest[] = [
  {
    id: ATTACHMENT_TEST_ID,
    title: "Attachment Style Quiz",
    kicker: "Free · 12 image choices",
    description: "See how you move toward or away from closeness when a relationship feels uncertain.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#9b4f5e",
    position: 1,
    active: true,
    featured: true,
    reportPriceCents: 499,
  },
  {
    id: "emotional-needs",
    title: "Your Hidden Emotional Need",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/rooms.png",
    accent: "#2f6653",
    position: 2,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "conflict-style",
    title: "Your Conflict Instinct",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#b46e43",
    position: 3,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "social-energy",
    title: "Your Social Battery Type",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/rooms.png",
    accent: "#6c5a91",
    position: 4,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "love-language",
    title: "How You Feel Most Loved",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#b35c72",
    position: 5,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "stress-reset",
    title: "How You Reset Under Stress",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#39747b",
    position: 6,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "boundary-style",
    title: "Your Relationship Boundary Style",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#74533b",
    position: 7,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "hidden-strength",
    title: "The Strength People Miss in You",
    kicker: "Paused · Being rebuilt",
    description: "This older visual test is no longer offered. Take the free attachment quiz instead.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#4d628b",
    position: 8,
    active: false,
    featured: false,
    reportPriceCents: 499,
  },
];

type SceneOption = {
  label: string;
  microcopy: string;
  meaning: string;
  projection: string;
};

type SceneQuestion = {
  kicker: string;
  prompt: string;
  scene: string;
  options: [SceneOption, SceneOption, SceneOption, SceneOption];
};

const styleOrder: AttachmentStyle[] = ["anxious", "avoidant", "secure", "fearful"];

const attachmentScenes: SceneQuestion[] = [
  {
    kicker: "A quiet phone",
    prompt: "They have not replied. Which scene feels like your next move?",
    scene: "phone",
    options: [
      {
        label: "Check again",
        microcopy: "Stay close to the thread",
        meaning: "You look for contact when the bond feels unfinished.",
        projection: "An unanswered pause can feel like something you need to repair right away.",
      },
      {
        label: "Put it down",
        microcopy: "Return to your own night",
        meaning: "You protect your focus by stepping out of the wait.",
        projection: "Distance can feel cleaner than sitting inside someone else's silence.",
      },
      {
        label: "Continue, then check",
        microcopy: "Keep your evening, look later",
        meaning: "You can hold the relationship without hovering over it.",
        projection: "A delay is information, not an emergency, until there is more to go on.",
      },
      {
        label: "Draft, then delete",
        microcopy: "Reach, then pull the words back",
        meaning: "You want a reply and also fear sending the wrong signal.",
        projection: "The first impulse may be to move in and then erase the evidence of needing anyone.",
      },
    ],
  },
  {
    kicker: "A closer weekend",
    prompt: "They want the whole weekend together. Which picture do you step into?",
    scene: "weekend",
    options: [
      {
        label: "Say yes fast",
        microcopy: "Lean into the invite",
        meaning: "More time together can feel like proof the bond is real.",
        projection: "You may relax only after the plan is locked in.",
      },
      {
        label: "Keep one day free",
        microcopy: "Hold a pocket of air",
        meaning: "You enjoy them more when some of the weekend stays yours.",
        projection: "Full immersion can feel like too little room to breathe.",
      },
      {
        label: "Plan it together",
        microcopy: "Share the calendar",
        meaning: "You can want time together and still name what you need.",
        projection: "Closeness works better when both people can see the shape of the days.",
      },
      {
        label: "Yes, then hedge",
        microcopy: "Accept, then add an exit",
        meaning: "You want the closeness and a way out if it becomes too much.",
        projection: "A warm yes can sit next to a private plan to reclaim space.",
      },
    ],
  },
  {
    kicker: "After a sharp talk",
    prompt: "The kitchen is quiet again. Which scene is your repair?",
    scene: "kitchen",
    options: [
      {
        label: "Reopen it now",
        microcopy: "Need the air cleared",
        meaning: "Unresolved tension is hard to leave in the room.",
        projection: "You may not settle until the bond feels warm again.",
      },
      {
        label: "Do the dishes",
        microcopy: "Let the heat drop first",
        meaning: "You recover through action and a little distance.",
        projection: "Talking while you are still flooded can feel like a trap.",
      },
      {
        label: "Pause, then talk",
        microcopy: "Name a time to return",
        meaning: "You can take space without disappearing.",
        projection: "Repair is easier when both people know the conversation is coming back.",
      },
      {
        label: "Hover nearby",
        microcopy: "Stay close, stay quiet",
        meaning: "You want contact and also dread another round.",
        projection: "Being in the same room can feel safer than choosing words.",
      },
    ],
  },
  {
    kicker: "A hard day",
    prompt: "You had a rough day. Which scene do you want waiting at home?",
    scene: "home",
    options: [
      {
        label: "Be met at the door",
        microcopy: "Want to be received",
        meaning: "Comfort lands best when someone comes toward you.",
        projection: "Being seen quickly can matter more than solving the day.",
      },
      {
        label: "A quiet room first",
        microcopy: "Need the volume down",
        meaning: "You reset before you can take in care.",
        projection: "Even kind attention can feel like one more demand until you have space.",
      },
      {
        label: "A simple check-in",
        microcopy: "Share the headline, then rest",
        meaning: "You can take comfort without handing over the whole day.",
        projection: "A short, clear exchange is often enough to feel accompanied.",
      },
      {
        label: "Want both, pick neither",
        microcopy: "Crave care, then stall",
        meaning: "You want to be held and also fear being too much.",
        projection: "The need and the retreat can arrive in the same breath.",
      },
    ],
  },
  {
    kicker: "They ask for a night alone",
    prompt: "They want an evening to themselves. Which image matches your body?",
    scene: "alone",
    options: [
      {
        label: "The clock starts",
        microcopy: "Count the hours",
        meaning: "Their space can feel like a test of the bond.",
        projection: "You may fill the gap with stories about what the night means.",
      },
      {
        label: "Relief, then plans",
        microcopy: "Take the open air",
        meaning: "Their request can feel like permission to exhale.",
        projection: "Solitude may restore you faster than another shared evening.",
      },
      {
        label: "Okay — text later",
        microcopy: "Agree and stay warm",
        meaning: "You can honor space without turning it into a verdict.",
        projection: "A clear goodnight plan keeps the night from feeling like a cutoff.",
      },
      {
        label: "Say fine, stay tense",
        microcopy: "Agree on the outside",
        meaning: "You allow the space and brace against what it might mean.",
        projection: "The yes can hide a body that is still waiting for the door to close.",
      },
    ],
  },
  {
    kicker: "A room of people",
    prompt: "You walk into a room of people you care about. Where do you land?",
    scene: "room",
    options: [
      {
        label: "Find your person",
        microcopy: "Orient to the bond",
        meaning: "A familiar face can make the whole room feel safer.",
        projection: "Connection with one person may matter more than the group.",
      },
      {
        label: "Stay near the edge",
        microcopy: "Watch before joining",
        meaning: "You enter on your own terms.",
        projection: "A little distance can keep the room from taking too much.",
      },
      {
        label: "Greet, then settle",
        microcopy: "Present without performing",
        meaning: "You can be with people and still keep a steady pace.",
        projection: "Belonging does not have to mean scanning every face.",
      },
      {
        label: "In, then out",
        microcopy: "Join, then look for air",
        meaning: "You want to belong and also need an exit in sight.",
        projection: "Warmth and overwhelm can trade places in the same hour.",
      },
    ],
  },
  {
    kicker: "A future question",
    prompt: "They ask where this is going. Which scene is your first answer?",
    scene: "future",
    options: [
      {
        label: "Move closer",
        microcopy: "Want a clearer we",
        meaning: "Naming the future can feel like relief.",
        projection: "Uncertainty about the bond may be harder than a hard conversation.",
      },
      {
        label: "Slow the frame",
        microcopy: "Keep it in the present",
        meaning: "Big labels can feel like a door closing on your options.",
        projection: "You may trust what is happening now more than a promised shape.",
      },
      {
        label: "Talk in honest pieces",
        microcopy: "Share what is true today",
        meaning: "You can discuss the future without forcing a finished story.",
        projection: "Clarity can come in steps that both people can stand on.",
      },
      {
        label: "Want it, fear it",
        microcopy: "Lean in, then go vague",
        meaning: "A future together can feel like both safety and a trap.",
        projection: "You may offer warmth and then thin out the words.",
      },
    ],
  },
  {
    kicker: "They seem farther away",
    prompt: "Their tone is thinner than usual. Which move feels first?",
    scene: "distance",
    options: [
      {
        label: "Ask what changed",
        microcopy: "Close the gap",
        meaning: "A shift in warmth is hard to leave unexplained.",
        projection: "You may need a signal before you can rest.",
      },
      {
        label: "Match the space",
        microcopy: "Give them a wider berth",
        meaning: "You meet distance with distance.",
        projection: "Stepping back can feel like the least messy option.",
      },
      {
        label: "Notice, then check once",
        microcopy: "Stay curious, not flooded",
        meaning: "You can see a change without turning it into a crisis.",
        projection: "One clear question is often enough to start.",
      },
      {
        label: "Reach, then freeze",
        microcopy: "Start a message, stop",
        meaning: "You want to know you are safe and fear making it worse.",
        projection: "The mixed move can leave both of you in the fog.",
      },
    ],
  },
  {
    kicker: "Someone asks what you need",
    prompt: "They ask, simply, what would help. Which scene do you choose?",
    scene: "need",
    options: [
      {
        label: "Stay close tonight",
        microcopy: "Ask for presence",
        meaning: "Being with someone can be the help.",
        projection: "You may feel most cared for when you are not left to carry it alone.",
      },
      {
        label: "Time, then words",
        microcopy: "Ask for a later talk",
        meaning: "You know what you need after you have room to think.",
        projection: "An immediate emotional conversation can feel like pressure.",
      },
      {
        label: "Name one thing",
        microcopy: "Make it specific",
        meaning: "You can let someone help without handing over everything.",
        projection: "A concrete ask keeps care from becoming a guessing game.",
      },
      {
        label: "I don't know yet",
        microcopy: "Want help, can't pick",
        meaning: "The need is there before the words are.",
        projection: "You may feel torn between being held and being left alone.",
      },
    ],
  },
  {
    kicker: "Good news arrives",
    prompt: "Something good happens for you. Who is in the first picture?",
    scene: "news",
    options: [
      {
        label: "Tell them first",
        microcopy: "Share the spark",
        meaning: "Joy feels more real when someone important hears it.",
        projection: "The bond can be part of how you know the moment counts.",
      },
      {
        label: "Keep it a while",
        microcopy: "Hold it privately",
        meaning: "You let good news settle before it becomes a conversation.",
        projection: "Sharing too soon can feel like giving the moment away.",
      },
      {
        label: "Share, then celebrate",
        microcopy: "Invite them in",
        meaning: "You can enjoy it yourself and still let someone stand beside you.",
        projection: "Good news does not have to be a test of how close you are.",
      },
      {
        label: "Share, then downplay",
        microcopy: "Offer it, then shrink it",
        meaning: "You want them to know and also fear needing their reaction.",
        projection: "Pride and self-protection can edit the same sentence.",
      },
    ],
  },
  {
    kicker: "A late-night spiral",
    prompt: "It is late and your mind will not settle. Which scene do you enter?",
    scene: "night",
    options: [
      {
        label: "Send a note",
        microcopy: "Reach across the dark",
        meaning: "Contact can be the fastest way to come back to earth.",
        projection: "The night can make the bond feel like the only solid thing.",
      },
      {
        label: "Turn the light off",
        microcopy: "Handle it alone",
        meaning: "You would rather self-soothe than open a door you cannot close.",
        projection: "Needing someone at 1 a.m. can feel like too much to show.",
      },
      {
        label: "Write, send in the morning",
        microcopy: "Keep the thought, wait for day",
        meaning: "You can feel it fully without making the night carry it.",
        projection: "Morning light is often enough to choose a cleaner message.",
      },
      {
        label: "Type, delete, repeat",
        microcopy: "Almost reach out",
        meaning: "You want a hand and also want no one to see the wanting.",
        projection: "The draft folder can become the place the night goes.",
      },
    ],
  },
  {
    kicker: "Repair after distance",
    prompt: "You have been apart longer than usual. Which scene is the reunion?",
    scene: "repair",
    options: [
      {
        label: "Close the space fast",
        microcopy: "Need to feel chosen again",
        meaning: "Reunion is how you know the bond survived the gap.",
        projection: "You may look for warmth before you can talk about the days apart.",
      },
      {
        label: "Ease back in",
        microcopy: "Keep the first hour light",
        meaning: "You re-enter slowly so closeness does not swamp you.",
        projection: "A soft landing can matter more than a big emotional scene.",
      },
      {
        label: "Glad, then catch up",
        microcopy: "Warm hello, honest recap",
        meaning: "You can enjoy being back and still say what the distance was like.",
        projection: "Repair can be simple: presence first, then a clear conversation.",
      },
      {
        label: "Want it, flinch",
        microcopy: "Step in, then brace",
        meaning: "Coming back can feel like relief and danger in the same doorway.",
        projection: "You may smile and still keep one hand on the exit.",
      },
    ],
  },
];

function optionTone(style: AttachmentStyle): string {
  return ATTACHMENT_STYLE_META[style].accent;
}

export const defaultQuestions: QuizQuestion[] = attachmentScenes.map((question, questionIndex) => ({
  id: `${ATTACHMENT_TEST_ID}-q${String(questionIndex + 1).padStart(2, "0")}`,
  testId: ATTACHMENT_TEST_ID,
  kicker: question.kicker,
  prompt: question.prompt,
  atlasPath: `scene:${question.scene}`,
  position: questionIndex + 1,
  active: true,
  options: question.options.map((option, optionIndex) => {
    const style = styleOrder[optionIndex] ?? "secure";
    return {
      label: option.label,
      microcopy: option.microcopy,
      meaning: option.meaning,
      projection: option.projection,
      styleKey: style,
      cardTone: optionTone(style),
    };
  }),
}));

export const PUBLIC_QUESTION_IDS = new Set(defaultQuestions.map((question) => question.id));

export const RETIRED_QUESTION_IDS = [
  ...defaultTests.flatMap((test) => [1, 2, 3, 4].map((index) => `${test.id}-${index}`)),
];

export const RETIRED_QUESTION_PROMPTS = [
  "They suddenly go quiet. Which door feels most like your next move?",
  "Which room feels safest to share with someone you love?",
  "Which path best matches the pace of love you trust?",
  "Which object would you keep near when a relationship feels uncertain?",
  "Which room would give you what you need most tonight?",
  "Which door feels like relief rather than escape?",
  "Which landscape gives you the deepest sense of enough?",
  "Which object feels like the missing piece today?",
  "Which path would you take after a difficult conversation?",
  "Which door matches how you return after an argument?",
  "Which room feels best for resolving something important?",
  "Which object would guide you through disagreement?",
  "Which room would restore your social battery?",
  "Which landscape matches the social plan you would actually enjoy?",
  "Which door matches your first reaction?",
  "Which object represents your energy in a group?",
  "Which object would feel most meaningful from someone you love?",
  "Which room holds your favorite kind of closeness?",
  "Which landscape would make you feel most connected?",
  "Which welcome would make you feel most loved?",
  "Which landscape would lower your stress fastest?",
  "Which room would you choose to reset?",
  "Which object feels most useful when everything is too much?",
  "Which door feels like the reset you need?",
  "Which door best represents a healthy boundary to you?",
  "Which room would you keep interruption-free?",
  "Which landscape feels like the right amount of distance?",
  "Which object best represents how you say no?",
  "Which object seems most like the way your mind works?",
  "Which door would you be most likely to open first?",
  "Which landscape reflects the strength you bring to others?",
  "Which room makes your best qualities easiest to access?",
];
