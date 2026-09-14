import type { AttachmentStyle } from "./attachment";
import type { QuizQuestion } from "./quiz";

const FOCUS: Record<AttachmentStyle, string> = {
  anxious: "reassurance",
  avoidant: "space",
  secure: "planning",
  fearful: "reflection",
};

function option(style: AttachmentStyle, text: string) {
  return {
    label: text,
    microcopy: "",
    meaning: "",
    projection: "",
    styleKey: style,
    readingFocus: FOCUS[style],
  };
}

/** V1.2 attachment bank. A anxious, V avoidant, S secure, D fearful-avoidant. */
export const ATTACHMENT_V12_BANK: Array<{ prompt: string; anxious: string; avoidant: string; secure: string; fearful: string }> = [
  {
    prompt: "When their texting suddenly goes cold and dry, what hits you first?",
    anxious: "A sinking feeling in my chest: Did I say something wrong?",
    avoidant: "Perfect, peace and quiet. I just go back to my own thing.",
    secure: "I notice it, but casually ask: \"Tough day?\"",
    fearful: "Panic makes me want to fix it, while another part screams: \"Why am I always the one groveling?\"",
  },
  {
    prompt: "Right after a fight or when things get dead serious, what’s your physical instinct?",
    anxious: "Fix it right now. If they ignore me, I'll keep calling—every second feels like a breakup.",
    avoidant: "Leave me alone. I want to shut my phone off, sleep, walk out, or just end the relationship.",
    secure: "It hurts, but I can say: \"Let’s both take 30 minutes to cool off, then talk.\"",
    fearful: "Storm out the door, then freeze in the hallway staring at my phone, praying they chase after me.",
  },
  {
    prompt: "When they don’t reply for most of the day, how are you actually doing?",
    anxious: "Checking my phone every two minutes, completely unable to focus on anything else.",
    avoidant: "Barely noticed the time. Honestly, not having to reply instantly feels like a relief.",
    secure: "Figure they're just busy. I get on with my day and catch up with them tonight.",
    fearful: "Furious enough to block them, yet constantly checking their profile over and over.",
  },
  {
    prompt: "When they suddenly get super clingy and shower you with affection, your real reaction is?",
    anxious: "Pure dopamine, but terrified it's temporary—I need them to keep reassuring me.",
    avoidant: "My skin crawls. I instinctively pull back—it feels way too fast and suffocating.",
    secure: "Happy. I take it in naturally and enjoy the sweet moment.",
    fearful: "Touched for one second, then the panic hits: \"What if they change their mind later?\"",
  },
  {
    prompt: "When they’re visibly moody and giving you one-word answers, your first thought is?",
    anxious: "\"Are they mad at me? What did I do wrong today?\"",
    avoidant: "\"Whoever pissed you off, go take it out on them. Don't bring that energy to me.\"",
    secure: "\"They probably had a rough day. I'll ask what's going on.\"",
    fearful: "\"Fine. You want to be cold? I can be colder. Let’s see who lasts longer.\"",
  },
  {
    prompt: "When you feel deeply hurt or upset inside, how do you usually handle it?",
    anxious: "Send massive paragraphs and vent intensely—I need an answer that calms my anxiety.",
    avoidant: "Swallow it. I say nothing because \"talking about it is pointless anyway.\"",
    secure: "Gather my thoughts and find a calm moment to tell them directly how I feel.",
    fearful: "Say \"I'm fine,\" but secretly play out worst-case scenarios, waiting for them to notice and fix it.",
  },
  {
    prompt: "If they cancel plans last minute or show up really late, your immediate thought is?",
    anxious: "They clearly don't care about me. I'm just not a priority to them.",
    avoidant: "Whatever. Honestly, I'm glad I don't have to socialize.",
    secure: "That's annoying, but let me hear their reason first.",
    fearful: "Hurt meets resentment: \"Am I that disposable? Fine, see if I ever show up on time for you again.\"",
  },
  {
    prompt: "When a relationship stays completely calm and stable for a long time, you feel?",
    anxious: "Anxious: Is the spark gone? Are they falling out of love with me?",
    avoidant: "Suffocated: it feels like a cage, and I want an excuse to be alone for a few days.",
    secure: "Grounded: finally able to focus my energy on work, friends, and life.",
    fearful: "Restless: I'll start picking fights just to test if they still care enough to tolerate me.",
  },
  {
    prompt: "To ease your inner anxiety, what is your go-to defense mechanism?",
    anxious: "Dropping hints and testing them just to force out the reassurance I need to hear.",
    avoidant: "Intentionally delaying replies or pulling away to prove I don't need anyone.",
    secure: "Being direct: stating clearly what's making me uncomfortable.",
    fearful: "Pushing for answers, then suddenly going completely cold or ghosting to see if they'll chase me.",
  },
  {
    prompt: "When they double-text you \"Where are you?\" and \"Why aren't you answering?\", your first gut reaction is?",
    anxious: "Reassured: at least it proves they're thinking about me constantly.",
    avoidant: "Instant claustrophobia: it feels like a major violation of my personal space.",
    secure: "Understandable: I reply when I can, or set clear boundaries if it becomes too much.",
    fearful: "Part of me likes being wanted, but another part finds it annoying—my reply depends entirely on my mood.",
  },
  {
    prompt: "When they say \"I just need some alone time and space,\" your internal response is?",
    anxious: "The world is ending: They don't want me anymore. This is the beginning of a breakup.",
    avoidant: "Thank god. I was just about to ask for the exact same thing.",
    secure: "\"Sounds good. Get some rest and hit me up whenever you're ready.\"",
    fearful: "Say \"Sure, no problem,\" while spiraling into paranoia that they're talking to someone else.",
  },
  {
    prompt: "What is your classic post-fight pattern?",
    anxious: "I chase: demanding answers, hugs, and reassurance—the more they pull away, the more frantic I get.",
    avoidant: "I shut down: put my phone on silent, go to sleep, and wait for the drama to die on its own.",
    secure: "Once tempers cool down, we sit down and talk things through rationally.",
    fearful: "Constant whiplash: I want to chase and run away at the same time, apologizing one minute and throwing low blows the next.",
  },
  {
    prompt: "When they take hours to send back a dry, low-effort reply, your inner monologue is?",
    anxious: "\"If they actually cared, they’d find two seconds to text back. They just don't love me anymore.\"",
    avoidant: "\"Cool, then I won't bother either. A quick 'k' is all you get.\"",
    secure: "\"They're probably slammed. I'll ask how their day went later.\"",
    fearful: "\"Who do they think they are?\"—yet the second the notification pops up, I reply instantly anyway.",
  },
  {
    prompt: "When you feel them visibly pulling away, what do you do?",
    anxious: "Double down: send more texts, buy gifts, reach out more—the colder they get, the harder I chase.",
    avoidant: "Pull back even faster: cut contact immediately so they never get the chance to dump me first.",
    secure: "Tap the brakes and initiate an honest check-in: \"Feels like we've been a bit out of sync lately, everything okay?\"",
    fearful: "Cling desperately for three days, then suddenly shut down and block them out of nowhere.",
  },
  {
    prompt: "While waiting for their text, what are you physically doing with your phone?",
    anxious: "Stalking their Instagram, Snapchat score, TikTok activity, or Find My location to see what they're doing.",
    avoidant: "Swiping away the chat, watching reels, or playing games without giving it a second thought.",
    secure: "Putting the phone down and getting back to my day.",
    fearful: "Re-reading old texts over and over while beating myself up for being so pathetic.",
  },
  {
    prompt: "When things heat up fast and you're about to make things official, the voice in your head says?",
    anxious: "\"Lock it down now. A title and a commitment are the only things that will make me feel safe.\"",
    avoidant: "\"This is moving way too fast. I'm not ready for this—I need an exit strategy.\"",
    secure: "\"This feels great. Let's take it step by step and see where it goes naturally.\"",
    fearful: "\"I want this so badly, but a mess like me is definitely going to ruin it.\"",
  },
  {
    prompt: "When a date gets canceled last minute, your emotional state is?",
    anxious: "Instant freefall: spending the whole day wondering if they had someone better to see.",
    avoidant: "Zero reaction—honestly, secretly relieved I don't have to leave the house.",
    secure: "Bummer, but understandable. We'll just reschedule for another time.",
    fearful: "Dying inside, but texting back: \"All good! Honestly, I was exhausted anyway.\"",
  },
  {
    prompt: "When you sense a crack in the relationship, your first move is?",
    anxious: "Over-accommodating: apologizing, pleasing, and shrinking myself just to keep them from leaving.",
    avoidant: "Armoring up: emotionally detaching and mentally preparing to walk away at any second.",
    secure: "Addressing the elephant in the room: figuring out what's broken and seeing if we can fix it together.",
    fearful: "Begging for peace first; the moment they stay cold, flipping into rage and bringing up every past mistake.",
  },
  {
    prompt: "During an explosive, out-of-control argument, what do you look like?",
    anxious: "Crying so hard I can barely breathe, begging them to hold me and promise not to leave.",
    avoidant: "Dead silent, staring blankly while they blow up, completely walled off.",
    secure: "Voices might get raised, but I stick to the actual problem without throwing personal insults.",
    fearful: "Aiming straight for their deepest insecurities—using the sharpest words to hurt the person closest to me.",
  },
  {
    prompt: "When your partner has an emotional breakdown/starts sobbing, your instant instinct is?",
    anxious: "Total panic: convinced it's all my fault, scrambling frantically to make them feel better.",
    avoidant: "An urge to step back: wanting to avoid getting sucked into their emotional black hole.",
    secure: "Walking over, handing them a tissue, holding them, and sitting with them quietly until it passes.",
    fearful: "Wanting to hug them, but feeling an overwhelming wave of irritability and wanting to snap at the same time.",
  },
];

export const relationshipQuestions: QuizQuestion[] = ATTACHMENT_V12_BANK.map((item, index) => ({
  id: `attachment-style-v3-q${String(index + 1).padStart(2, "0")}`,
  testId: "attachment-style",
  kicker: "First reaction",
  prompt: item.prompt,
  atlasPath: "",
  position: index + 1,
  active: true,
  options: [
    option("anxious", item.anxious),
    option("avoidant", item.avoidant),
    option("secure", item.secure),
    option("fearful", item.fearful),
  ],
}));
