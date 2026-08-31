import { getInsightArticleCard, type InsightArticleCard } from "@/lib/insights-index";

export type InsightSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type InsightSource = {
  title: string;
  publication: string;
  url: string;
};

export type InsightArticle = InsightArticleCard & {
  directAnswer: string;
  keyPoints: string[];
  sections: InsightSection[];
  reflectionPrompts: string[];
  faq: { question: string; answer: string }[];
  sources: InsightSource[];
};

function defineArticle(
  slug: string,
  content: Omit<InsightArticle, keyof InsightArticleCard>,
): InsightArticle {
  const card = getInsightArticleCard(slug);
  if (!card) throw new Error(`Missing insight article card for ${slug}`);
  return { ...card, ...content };
}

export const insightArticles: InsightArticle[] = [
  defineArticle("why-do-i-pull-away-when-someone-gets-close", {
    directAnswer:
      "Pulling away when someone gets close can be a way to lower emotional intensity, protect your sense of independence, or gain time to understand what you feel. It does not automatically mean that you do not care. The useful question is not simply “Why am I distant?” but “What changed in the moment just before distance began to feel safer?”",
    keyPoints: [
      "Withdrawal can regulate intensity without reflecting a lack of affection.",
      "The trigger may be pressure, uncertainty, conflict, dependence, or a pace that feels too fast.",
      "A short, clearly communicated pause protects connection better than unexplained disappearance.",
    ],
    sections: [
      {
        heading: "Distance can be a regulation strategy",
        paragraphs: [
          "Closeness is not one single feeling. It can include warmth, excitement, responsibility, uncertainty, exposure, and the possibility of disappointment. When several of those arrive at once, creating distance may reduce the amount your mind has to process. You may answer more slowly, focus on work, become unusually practical, or suddenly notice reasons the relationship cannot work.",
          "Attachment research often describes avoidance and anxiety as dimensions rather than permanent personality boxes. Under stress, some people move toward reassurance while others reduce emotion, dependence, or contact. The same person can also react differently across relationships and stages of life. A brief visual reflection cannot establish an attachment style, but it can help you notice which response feels familiar right now.",
        ],
      },
      {
        heading: "Look at the five minutes before you wanted space",
        paragraphs: [
          "The urge to withdraw becomes easier to understand when you track the immediate sequence. Instead of judging the final behavior, replay the small moment that preceded it. Did the other person ask for a commitment? Did they become less predictable? Did you feel expected to reveal more than you were ready to share? Did a pleasant moment suddenly make the relationship feel real?",
          "Sometimes the trigger is not intimacy itself. You may be reacting to pressure, poor timing, unresolved conflict, a loss of privacy, or a relationship in which your limits have not been respected. Treating every desire for space as an attachment problem can hide important context.",
        ],
        bullets: [
          "What happened immediately before I became less available?",
          "Was I protecting time, privacy, emotional control, or freedom to choose?",
          "Did I want distance from this person—or from the intensity of the moment?",
          "Would closeness feel different if I could set the pace?",
        ],
      },
      {
        heading: "Four different experiences can look like the same withdrawal",
        paragraphs: [
          "You may need processing time. Some people understand emotion by speaking; others need quiet before words become accurate. You may also fear dependence, especially if needing another person has previously felt unreliable or costly. In a different situation, you may like the person but dislike the speed or expectations around the connection. And sometimes distance is information: your body may be responding to inconsistency, pressure, or a boundary being crossed.",
          "Those possibilities require different responses. More closeness is not always the answer, and more distance is not always protection. The goal is to identify the condition that would make an honest next step possible.",
        ],
      },
      {
        heading: "Try a named pause instead of an unexplained exit",
        paragraphs: [
          "If the relationship is basically safe and you want to remain connected, make space visible rather than mysterious. A useful pause includes three pieces: what is happening, what you need, and when you will return. For example: “I care about this conversation. I am overloaded and need tonight to think. Can we come back to it tomorrow after work?”",
          "This does not guarantee the other person will like the pause. It does make your intention easier to understand and gives you a way to test whether space actually helps you return with more clarity. If you repeatedly request respectful space and it is ignored, that is also relevant information about the relationship—not proof that you are incapable of intimacy.",
        ],
      },
    ],
    reflectionPrompts: [
      "When closeness feels intense, what do I fear I will lose: freedom, control, privacy, identity, or safety?",
      "What is one form of closeness I can tolerate more easily than a high-stakes conversation?",
      "If I take space, what specific signal would show that I intend to return?",
    ],
    faq: [
      {
        question: "Does pulling away mean I have an avoidant attachment style?",
        answer:
          "Not necessarily. Attachment avoidance is measured across patterns and contexts; one period of distance can also reflect stress, pace, compatibility, boundaries, or a need to process. A qualified professional and validated assessment are more appropriate if you need a formal evaluation.",
      },
      {
        question: "Can I need space and still want intimacy?",
        answer:
          "Yes. Autonomy and connection are not opposites. Research on close relationships suggests that feeling connected while retaining a sense of choice and self can support healthier relationship maintenance.",
      },
      {
        question: "What if the other person becomes upset when I ask for space?",
        answer:
          "Acknowledge the impact without promising access you cannot sustain. Be concrete about the length and purpose of the pause. If requests for space lead to threats, monitoring, coercion, or fear for your safety, seek support from a qualified local service or trusted person.",
      },
    ],
    sources: [
      {
        title: "Adult attachment, stress, and romantic relationships",
        publication: "Current Opinion in Psychology · PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/28813288/",
      },
      {
        title: "The relationship between adult attachment and mental health: A meta-analysis",
        publication: "Journal of Personality and Social Psychology · PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/36201836/",
      },
      {
        title: "Autonomy in Relatedness: How Need Fulfillment Interacts in Close Relationships",
        publication: "Personality and Social Psychology Bulletin · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7057354/",
      },
    ],
  }),
  defineArticle("how-to-know-what-you-need-in-a-relationship", {
    directAnswer:
      "To understand what you need in a relationship, examine the moments that repeatedly create relief, resentment, loneliness, or pressure. Then translate the feeling into a condition you can discuss: more responsiveness, more autonomy, clearer expectations, practical support, affection, or room to express yourself. A need is information about what helps you function—not a command another person must obey.",
    keyPoints: [
      "Repeated emotional friction often contains useful information about an unmet need.",
      "Connection and autonomy can both matter; you do not have to choose one identity forever.",
      "Specific, observable requests are easier to discuss than tests of whether someone should just know.",
    ],
    sections: [
      {
        heading: "Begin with patterns, not a perfect list",
        paragraphs: [
          "Many people struggle to name a need because they try to produce the correct answer in the abstract. It is easier to start with evidence from ordinary life. When did you feel unusually calm with someone? What interaction left you resentful even though nothing obviously terrible happened? Which disappointment keeps repeating in different forms?",
          "The emotion is not the need, but it can point toward one. Loneliness may suggest missing connection or understanding. Resentment may signal that you agreed to something without enough choice. Anxiety may reflect uncertainty, inconsistency, or a need for clearer information. Frustration may come from wanting practical cooperation rather than another conversation about intentions.",
        ],
      },
      {
        heading: "Use five working categories",
        paragraphs: [
          "These categories are a reflection tool, not a universal diagnostic system. They help turn a vague sense that something is wrong into questions you can test against your experience.",
        ],
        bullets: [
          "Connection: Do I feel emotionally included, cared for, and able to reach the other person?",
          "Responsiveness: Do I feel understood, taken seriously, and considered when I share something important?",
          "Autonomy: Can I choose, disagree, and remain myself without the relationship becoming a punishment?",
          "Clarity and reliability: Do words, expectations, and follow-through give me enough information to know where I stand?",
          "Support and expression: Is there practical help, affection, play, creativity, or space for the parts of me that need to be lived rather than explained?",
        ],
      },
      {
        heading: "Separate the need from your preferred strategy",
        paragraphs: [
          "A strategy is one way you hope a need will be met. “Text me every hour” is a strategy; the underlying need might be predictability, reassurance, or inclusion. “Never ask me where I am” is also a strategy; the underlying need might be privacy, trust, or freedom from monitoring.",
          "When you name the underlying need, more options become available. Predictability might be supported by agreeing when you will next speak. Privacy might be supported by deciding what information is voluntary. This does not mean every compromise is acceptable. It means the conversation can focus on the function of the request instead of defending one rigid solution.",
        ],
      },
      {
        heading: "Turn insight into a request someone can answer",
        paragraphs: [
          "Try the sequence: observation, impact, need, request. “When plans change and I do not hear until the last minute, I spend the evening unsure what is happening. Reliability matters to me. Could you message me when you know the plan has changed?” The request is specific enough for the other person to accept, decline, or negotiate.",
          "Then watch what happens over time. One imperfect response is not the whole relationship. Repeated willingness, follow-through, repair, and respect for a clear no provide stronger evidence. Your needs also deserve review: a request may be reasonable while the chosen person, timing, or relationship cannot meet it.",
        ],
      },
    ],
    reflectionPrompts: [
      "What happened the last three times I felt resentful, and what did I agree to before the resentment appeared?",
      "Which makes me feel safer: being understood, having a clear plan, receiving practical help, or having room to choose?",
      "What is one request that is specific enough for another person to answer honestly?",
    ],
    faq: [
      {
        question: "Are emotional needs the same as love languages?",
        answer:
          "No. A love-language label usually describes a preferred form of receiving or expressing care. Emotional and psychological needs can include connection, autonomy, responsiveness, competence, safety, clarity, and other conditions that extend beyond affection.",
      },
      {
        question: "Is it needy to ask for reassurance?",
        answer:
          "Asking for reassurance is not inherently unhealthy. The pattern matters: what uncertainty triggered it, whether reassurance helps, how often it is required, and whether both people can communicate without coercion. Repeated reassurance that never creates relief may be worth exploring more carefully.",
      },
      {
        question: "What if my partner cannot meet an important need?",
        answer:
          "Clarify whether the issue is skill, capacity, willingness, timing, or a basic incompatibility. Some needs can be supported through several relationships and practices; others are central to the relationship itself. A couples therapist or other qualified professional can help when the conversation remains stuck or unsafe.",
      },
    ],
    sources: [
      {
        title: "Autonomy in Relatedness: How Need Fulfillment Interacts in Close Relationships",
        publication: "Personality and Social Psychology Bulletin · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7057354/",
      },
      {
        title: "Responsiveness in romantic partners' interactions",
        publication: "Current Opinion in Psychology · PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/37515977/",
      },
      {
        title: "The Role of Rapport in Satisfying One’s Basic Psychological Needs",
        publication: "Motivation and Emotion · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8168610/",
      },
    ],
  }),
  defineArticle("why-do-i-feel-drained-after-socializing", {
    directAnswer:
      "Feeling drained after socializing—even after an enjoyable event—can be a normal response to sustained attention, stimulation, emotional effort, and the number of interactions you managed. Enjoyment and fatigue are not opposites. Instead of assuming the answer is simply “I am an introvert,” notice which part of the experience used the most energy and what kind of recovery actually restores it.",
    keyPoints: [
      "Social behavior can feel positive in the moment and still be followed by fatigue later.",
      "Duration, group size, sensory input, emotional labor, and uncertainty can all change the cost.",
      "Recovery works better when it matches the source of the load.",
    ],
    sections: [
      {
        heading: "Fun can still require work",
        paragraphs: [
          "A conversation asks your attention to move quickly: listen, interpret tone, decide what to share, notice reactions, remember context, and plan a response. A crowded room adds competing voices, movement, and sensory input. If you are also trying to keep everyone comfortable or present a version of yourself that fits the situation, the interaction carries additional emotional effort.",
          "Experience-sampling research has found that more extraverted or sociable behavior can coincide with better mood in the moment while predicting greater fatigue a few hours later. The effect was not limited neatly to people with one personality type. That is a useful correction to the popular idea that extroverts always gain energy and introverts always lose it.",
        ],
      },
      {
        heading: "Find the expensive part of the interaction",
        paragraphs: [
          "Two events of equal length can have very different costs. A quiet dinner with one trusted friend may require little self-monitoring. A shorter work reception may require names, small talk, noise filtering, role performance, and uncertainty about when you can leave.",
        ],
        bullets: [
          "Attention load: How many conversations, cues, and interruptions were you tracking?",
          "Sensory load: Were noise, light, movement, temperature, or travel part of the exhaustion?",
          "Emotional load: Were you supporting someone, suppressing irritation, or managing the mood of the group?",
          "Performance load: Did you feel free to be quiet, or responsible for appearing engaged and easygoing?",
          "Physical load: Were you hungry, underslept, standing for hours, using alcohol, or already stressed before the event?",
        ],
      },
      {
        heading: "Match the recovery to the load",
        paragraphs: [
          "If noise and interruption were the main cost, lower stimulation may help: a quiet walk, dimmer room, shower, or an hour without new input. If emotional performance was the cost, time with a person around whom you do not have to perform may restore more than isolation. If uncertainty was the cost, planning an exit time or role before the next event may reduce the drain at its source.",
          "Recovery is not always doing nothing. Some people feel better after gentle movement, an absorbing solo activity, or a short practical routine that closes the day. Test one variable at a time. “I need two days alone” is less informative than “Thirty minutes without conversation after a noisy group event helps me feel present again.”",
        ],
      },
      {
        heading: "Notice when fatigue deserves a wider look",
        paragraphs: [
          "Social fatigue is not a diagnosis. A major or sudden change in energy, exhaustion after very small interactions, persistent fatigue that does not improve with rest, or fatigue accompanied by low mood, pain, sleep problems, dizziness, or other symptoms may have causes beyond social style. A healthcare professional can help assess physical and mental-health factors.",
          "Also notice whether the fatigue is specific to certain people or settings. Feeling depleted only where you must stay vigilant, hide important parts of yourself, or tolerate repeated boundary violations is different from needing ordinary quiet after a lively day.",
        ],
      },
    ],
    reflectionPrompts: [
      "Which part of my last social event was most tiring: noise, duration, uncertainty, emotional support, or self-presentation?",
      "Who allows me to be quiet without treating it as rejection?",
      "What is the smallest recovery ritual that reliably improves my energy?",
    ],
    faq: [
      {
        question: "Does social exhaustion mean I am an introvert?",
        answer:
          "Not by itself. Introversion may influence preferences, but social behavior, group size, context, health, sleep, sensory conditions, and emotional effort can affect fatigue across personality types.",
      },
      {
        question: "Why do I feel tired after seeing people I love?",
        answer:
          "Affection does not remove cognitive or physical load. You can enjoy the person while still tracking a long conversation, traveling, staying up late, managing a busy environment, or providing emotional support.",
      },
      {
        question: "Should I cancel plans whenever my social battery feels low?",
        answer:
          "Not automatically. Consider changing the dose: shorten the event, choose a quieter setting, meet one person instead of a group, or protect recovery time afterward. If fatigue is persistent or unusually severe, seek an appropriate health assessment rather than treating every episode as a personality issue.",
      },
    ],
    sources: [
      {
        title: "Sociable behavior is related to later fatigue: moment-to-moment patterns of behavior and tiredness",
        publication: "Heliyon",
        url: "https://www.sciencedirect.com/science/article/pii/S240584402030877X",
      },
      {
        title: "Happy Now, Tired Later? Extraverted and Conscientious Behavior Are Related to Immediate Mood Gains, but to Later Fatigue",
        publication: "Journal of Personality · PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/27281444/",
      },
      {
        title: "Why do emotional labor strategies differentially predict exhaustion?",
        publication: "Journal of Occupational Health Psychology · PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/32191066/",
      },
      {
        title: "Homeostatic Regulation of Energetic Arousal During Acute Social Isolation",
        publication: "Psychological Science · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13029414/",
      },
    ],
  }),
  defineArticle("how-to-recognize-strengths-that-feel-ordinary", {
    directAnswer:
      "A strength can be difficult to notice precisely because it feels ordinary to you. Look for abilities that produce useful outcomes repeatedly, appear across more than one setting, and are recognized by people who have seen you in action. Then test the strength deliberately. Awareness matters, but evidence suggests that using a strength is more meaningful than collecting a flattering label.",
    keyPoints: [
      "Ease is not evidence that an ability has little value; it may reflect long practice or natural fluency.",
      "Strong evidence combines repeated outcomes, specific feedback, and use across contexts.",
      "A strength becomes useful when you can choose where, when, and how much to apply it.",
    ],
    sections: [
      {
        heading: "Why your best abilities can become invisible",
        paragraphs: [
          "You experience your own mind continuously, so the way you organize information, calm a tense room, notice patterns, begin projects, or make ideas concrete may feel like the default. Other people only see the outcome. What feels like “I just did what was obvious” to you may be the part they find unusually difficult.",
          "Strengths are also hidden by role expectations. The person who always plans may call it being responsible rather than systems thinking. The friend who translates tension into a clear sentence may call it basic empathy. Repetition can make an ability feel less visible even as other people rely on it more.",
        ],
      },
      {
        heading: "Collect behavioral evidence, not compliments",
        paragraphs: [
          "Broad praise such as “You are amazing” feels good but teaches little. Ask for specific evidence: What changed because I was there? What do people repeatedly ask me to handle? Which part of a difficult task do I make easier? A useful strength has a verb and an effect.",
        ],
        bullets: [
          "“Creative” becomes “connects unrelated ideas into a workable concept.”",
          "“Good with people” becomes “notices what someone is trying to say and checks the meaning without embarrassing them.”",
          "“Organized” becomes “turns an unclear goal into a sequence others can follow.”",
          "“Brave” becomes “starts before certainty is available and learns from a small experiment.”",
        ],
      },
      {
        heading: "Distinguish a strength from a survival role",
        paragraphs: [
          "Being capable at something does not mean it is always healthy or freely chosen. You may be excellent at reading a room because you learned to monitor other people's moods. You may solve every problem because asking for help once felt unsafe. The ability can still be real, while the compulsion to use it constantly becomes costly.",
          "A strength usually becomes more sustainable when you have choice. Ask whether the ability can be used with boundaries, whether it transfers to supportive contexts, and whether you can stop without feeling that everything will collapse. The goal is not to discard the skill, but to own it rather than be owned by it.",
        ],
      },
      {
        heading: "Run a one-week strength experiment",
        paragraphs: [
          "Choose one candidate strength and define a small behavior. If the strength is pattern recognition, spend fifteen minutes mapping a recurring problem. If it is emotional translation, summarize a difficult conversation only after the other person asks for help. If it is initiation, begin one task and define the finish line before starting another.",
          "At the end of the week, review three questions: Did the behavior create a useful result? Did it feel authentic rather than performative? Did the cost remain reasonable? Research on strengths use generally supports focusing on application, while also warning against assuming every named strength predicts every desirable outcome. Context and dosage matter.",
        ],
      },
    ],
    reflectionPrompts: [
      "What do people ask me to do when the situation becomes unclear, tense, or stuck?",
      "Which useful outcome do I create so quickly that I rarely count it as work?",
      "Where could I use this ability by choice instead of from obligation?",
    ],
    faq: [
      {
        question: "How do I know whether something is really a strength?",
        answer:
          "Look for repeated evidence: the ability appears in more than one setting, produces a useful effect, and is described specifically by people who have observed you. A single test result is a hypothesis, not proof.",
      },
      {
        question: "Can a strength become a weakness?",
        answer:
          "Any ability can become unhelpful when it is overused, used in the wrong context, or applied without consent or boundaries. Directness can become harshness; empathy can become emotional over-responsibility; initiation can become unfinished work.",
      },
      {
        question: "What if I cannot think of any strengths?",
        answer:
          "Start with recent behavior rather than self-esteem. Review one problem you handled, one thing someone trusted you with, and one task that became easier after your involvement. If persistent hopelessness makes it difficult to see any value in yourself, consider speaking with a qualified mental-health professional.",
      },
    ],
    sources: [
      {
        title: "The Strengths Use Scale: Psychometric Properties, Longitudinal Invariance and Criterion Validity",
        publication: "Frontiers in Psychology · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8239153/",
      },
      {
        title: "Character Strengths, Strengths Use, Future Self-Continuity and Subjective Well-Being",
        publication: "Frontiers in Psychology · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6034163/",
      },
      {
        title: "The Practice of Character Strengths: Unifying Definitions, Principles, and Exploration",
        publication: "Frontiers in Psychology · PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7873298/",
      },
    ],
  }),
];

export function getInsightArticle(slug: string) {
  return insightArticles.find((article) => article.slug === slug);
}
