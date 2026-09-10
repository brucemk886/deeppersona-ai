export type BankQuestion = {
  kicker: string;
  prompt: string;
  options: [string, string, string, string];
  atlas?: "/quiz/doors.png" | "/quiz/rooms.png" | "/quiz/landscapes.png" | "/quiz/symbols.png";
};

/**
 * Emotional-test belt. Every item is a relationship scene a woman will recognize,
 * written with "they" so it is not branded as women-only.
 *
 * 15 questions per test:
 *   Q1     Video hook. One filmable moment. Always visual.
 *   Q2–Q5  More images, same wound.
 *   Q6–Q10 High-frequency scenes: texting, space, tone, night, pace.
 *   Q11–Q15 Pattern: fight, assumption, safety, hurt, what repeats.
 *
 * A/B/C/D never change meaning:
 *   A explorer  — go toward them, ask, define
 *   B connector — soften, stay close, soothe the bond
 *   C architect — space, a plan, a clear edge
 *   D creator   — wait, reread, follow the inner weather
 */
export const questionBank: Record<string, BankQuestion[]> = {
  "attachment-style": [
    { kicker: "Trust your first response", prompt: "They suddenly go quiet. Which door feels most like your next move?", atlas: "/quiz/doors.png", options: ["Ask what changed", "Send a warm check-in", "Give them space", "Wait, then reach out"] },
    { kicker: "After the tension", prompt: "You share a home after a hard conversation. Which room do you want tonight?", atlas: "/quiz/rooms.png", options: ["The open studio", "The candlelit table", "The private library", "The rain-lit retreat"] },
    { kicker: "They said we need to talk", prompt: "Which path matches what your body does first?", atlas: "/quiz/landscapes.png", options: ["Walk toward it now", "Find a softer place to sit", "Take the steady trail first", "Wait for night to settle"] },
    { kicker: "When it feels uncertain", prompt: "Which object would you keep near?", atlas: "/quiz/symbols.png", options: ["The compass", "The growing sprout", "The journal", "The prism"] },
    { kicker: "Coming back together", prompt: "After days apart, which welcome feels safest?", atlas: "/quiz/doors.png", options: ["Come in, let's go", "I've missed you", "I already handled it", "When it feels right"] },
    { kicker: "The read receipt", prompt: "They leave you on read for six hours. What do you actually do?", options: ["Ask a direct question", "Send something warm and light", "Stay quiet and wait for their timing", "Write it, delete it, wait for the feeling"] },
    { kicker: "Seen, then nothing", prompt: "They viewed your story and did not reply. You…", options: ["Ask if everything is okay", "Post something softer and wait", "Do not mention it", "Replay it until it means something"] },
    { kicker: "They asked for space", prompt: "They want a few days alone. You…", options: ["Set a time to reconnect", "Tell them you still care", "Agree and protect the boundary", "Say yes, then hover in the feeling"] },
    { kicker: "It is not defined", prompt: "You are catching feelings and the relationship has no name. You…", options: ["Ask what this is", "Stay close and hope they feel it", "Slow down until the terms are clear", "Keep one inner door closed"] },
    { kicker: "A change in tone", prompt: "One message sounds cooler than yesterday. You…", options: ["Ask what is going on", "Offer softness first", "Give it time unless a pattern appears", "Reread it until the meaning settles"] },
    { kicker: "Right after a fight", prompt: "The argument just ended. You first…", options: ["Reopen the issue", "Repair the warmth", "Leave and sort the facts", "Wait for the emotional truth"] },
    { kicker: "One in the morning", prompt: "You miss them and cannot sleep. You…", options: ["Send the honest message", "Send a small caring note", "Write it down and wait until morning", "Sit with the feeling and not send"] },
    { kicker: "If they pull away", prompt: "Your private assumption is usually…", options: ["Something can be fixed if we talk", "The bond needs a warm signal", "They need room; I need a return time", "The timing is wrong; wait"] },
    { kicker: "What safety feels like", prompt: "You feel safest in love when…", options: ["Problems get named quickly", "Affection stays visible", "Plans and space are clear", "The mood between you feels true"] },
    { kicker: "When you are hurt", prompt: "You usually…", options: ["Go toward the person", "Look for comfort", "Create distance until you are steady", "Wait until the feeling has a shape"] },
  ],
  "emotional-needs": [
    { kicker: "They went a little cold", prompt: "Which room is what you need from them tonight?", atlas: "/quiz/rooms.png", options: ["Space to move again", "A place to be held", "Quiet and a plan", "A world of your own"] },
    { kicker: "The invitation that would help", prompt: "Which door feels like relief, not chasing?", atlas: "/quiz/doors.png", options: ["The open red door", "The warm cottage", "The hidden ivy door", "The starlit doorway"] },
    { kicker: "First feeling only", prompt: "Which landscape feels like enough, after they pulled back?", atlas: "/quiz/landscapes.png", options: ["The open coast", "The flower meadow", "The grounded forest", "The moonlit desert"] },
    { kicker: "The missing piece", prompt: "Which object is what this relationship is not giving you?", atlas: "/quiz/symbols.png", options: ["A compass", "A living sprout", "A blank journal", "A prism"] },
    { kicker: "A hard day ends", prompt: "They are available for ten minutes. Which welcome would restore you?", atlas: "/quiz/doors.png", options: ["Let's get out of here", "Come here", "It's already handled", "No one needs anything from you"] },
    { kicker: "They got practical", prompt: "You needed comfort and they offered a solution. You needed…", options: ["A change of scene together", "To be received first", "One clear next step, but later", "To be left in peace"] },
    { kicker: "Saturday without you", prompt: "They made plans and told you after. Underneath, you were missing…", options: ["To be chosen in motion", "To feel you still matter", "A say in the shape of the day", "Room to have your own day"] },
    { kicker: "You snap at a small thing", prompt: "In this relationship, you were probably starving for…", options: ["Freedom to move", "To feel received", "A bit of control", "Uninterrupted inner space"] },
    { kicker: "They ask what you need", prompt: "The honest answer is…", options: ["Don't trap me in this mood", "Don't just fix me", "Don't add more chaos", "Don't make me perform okay"] },
    { kicker: "Advice vs presence", prompt: "When you are low about them, what helps first?", options: ["A plan you can act on", "Being understood", "A smaller, ordered problem", "Silence and no questions"] },
    { kicker: "Your body keeps the score", prompt: "Distance from them shows up as a need for…", options: ["Motion", "Contact", "Structure", "Withdrawal"] },
    { kicker: "You cannot name it yet", prompt: "Before you have words for this relationship, you want…", options: ["To do something", "A person nearby", "To tidy one corner", "To disappear for a while"] },
    { kicker: "After you get that need", prompt: "You usually feel…", options: ["Alive again", "Softer", "Clearer", "Returned to yourself"] },
    { kicker: "If they keep missing it", prompt: "You tend to…", options: ["Push for a change", "Get quieter and sadder", "Control what you can", "Leave the room, then the week"] },
    { kicker: "The sentence you wish they knew", prompt: "The truest one is…", options: ["Don't make me chase you", "Stay with the feeling before you solve it", "Tell me what happens next", "Let me come back when I am real"] },
  ],
  "conflict-style": [
    { kicker: "When tension rises", prompt: "After a fight with them, which path would you take?", atlas: "/quiz/landscapes.png", options: ["The exposed cliff", "The gentle meadow", "The quiet forest", "The wide desert"] },
    { kicker: "How you return", prompt: "Which door matches how you come back after an argument?", atlas: "/quiz/doors.png", options: ["Open it now", "Bring warmth first", "Knock when ready", "Wait for the right moment"] },
    { kicker: "Where it can be solved", prompt: "Which room feels best for something important between you?", atlas: "/quiz/rooms.png", options: ["The open studio", "The shared table", "The private library", "The quiet rain room"] },
    { kicker: "What you trust in a fight", prompt: "Which object would guide you back to them?", atlas: "/quiz/symbols.png", options: ["The compass", "The sprout", "The journal", "The prism"] },
    { kicker: "The first 10 seconds", prompt: "They raise their voice. Your body goes toward…", atlas: "/quiz/doors.png", options: ["The issue", "The relationship", "The exit", "The meaning"] },
    { kicker: "A text fight starts", prompt: "You…", options: ["Call or answer the point", "Soften and check the bond", "Pause until you can be precise", "Read between the lines first"] },
    { kicker: "The silent treatment", prompt: "They go silent mid-conflict. You…", options: ["Name the silence", "Send a caring olive branch", "Give a clear window and wait", "Assume something unspoken is happening"] },
    { kicker: "You were wrong", prompt: "Your repair usually starts with…", options: ["A direct apology and next step", "Warmth and making up", "A precise account of what you will change", "Waiting until you mean every word"] },
    { kicker: "They were wrong", prompt: "You need…", options: ["The issue named", "The connection restored", "A fair structure going forward", "Them to see the real hurt"] },
    { kicker: "In front of other people", prompt: "A couple disagreement appears in public. You…", options: ["Address it anyway", "Protect the warmth and take it private", "Shut it down until later", "File the subtext for later"] },
    { kicker: "The same fight again", prompt: "It is about texting, again. Your instinct is to…", options: ["Force a decision this time", "Get back to liking each other", "Write the pattern down", "Ask what this fight is really about"] },
    { kicker: "After you cool down", prompt: "The useful thing is…", options: ["Reopening it cleanly", "A kind check-in", "A plan so it does not repeat", "The sentence that was under the anger"] },
    { kicker: "What you cannot stand", prompt: "In a fight with them, the worst feeling is…", options: ["Being ignored", "Being disliked in the moment", "Being flooded with no structure", "Being misunderstood"] },
    { kicker: "What repair looks like", prompt: "You believe a fight is over when…", options: ["The issue is decided", "You feel close again", "The rule is clear", "The emotional truth was said"] },
    { kicker: "If it never gets resolved", prompt: "You tend to…", options: ["Keep bringing it up", "Paper over it with care", "Build a private system around it", "Live in the unanswered question"] },
  ],
  "social-energy": [
    { kicker: "You cannot put them down", prompt: "Which room is where your mind goes when you cannot stop thinking about them?", atlas: "/quiz/rooms.png", options: ["The active studio", "The intimate table", "The quiet library", "The rain room"] },
    { kicker: "The crush has a landscape", prompt: "Which path matches this pull?", atlas: "/quiz/landscapes.png", options: ["A coastal chase", "A picnic that feels like fate", "A familiar loop you keep walking", "A moonlit drive you take alone"] },
    { kicker: "Another notification", prompt: "Which door do you open when their name appears?", atlas: "/quiz/doors.png", options: ["Step straight in", "Look for a warm sign first", "Check the facts before you feel it", "Stay on the threshold"] },
    { kicker: "What the obsession holds", prompt: "Which object is this feeling, if you are honest?", atlas: "/quiz/symbols.png", options: ["The compass", "The sprout", "The journal", "The prism"] },
    { kicker: "The high", prompt: "When they finally write back, you want…", atlas: "/quiz/rooms.png", options: ["To start something now", "To stay in the warmth", "To understand what changed", "To keep the moment from breaking"] },
    { kicker: "Crumbs", prompt: "They give you ten minutes of heat, then go quiet. You…", options: ["Ask for a real plan", "Hold on to the warmth they gave", "Track the pattern and pull back", "Build the rest of the story yourself"] },
    { kicker: "You refresh anyway", prompt: "You know you should stop checking. You…", options: ["Send something that moves it", "Look for one more caring sign", "Set a rule, then break it once", "Stay in the feeling and not send"] },
    { kicker: "Friends would say run", prompt: "The honest part is…", options: ["I still want a way in", "I still want to feel chosen", "I need this to make sense", "I already live in the version where it means more"] },
    { kicker: "Their past appears", prompt: "You see an old photo, an ex, a like. You…", options: ["Ask about it", "Look for reassurance", "Tell yourself it is data, not a story", "Read it as a secret meaning"] },
    { kicker: "Almost, then nothing", prompt: "A late-night talk feels like a turning point. Morning is ordinary. You…", options: ["Name what last night was", "Reach for the closeness again", "Wait for a consistent pattern", "Keep last night as the real version"] },
    { kicker: "You try to get your mind back", prompt: "The move that actually helps is…", options: ["Doing something that breaks the loop", "Talking to one safe person", "Writing the facts in a list", "Going dark and letting the weather pass"] },
    { kicker: "If they became consistent", prompt: "You suspect you would…", options: ["Want the next chapter immediately", "Relax, then watch for the warmth", "Need proof it will stay this way", "Miss the intensity of the almost"] },
    { kicker: "What you are actually hungry for", prompt: "Under the spiral, you want…", options: ["A yes you can act on", "To feel unmistakably wanted", "A story that holds together", "A feeling that stays cinematic"] },
    { kicker: "The tell", prompt: "You know it is a spiral, not ordinary liking, when you…", options: ["Cannot stop making a next move", "Cannot feel okay without a sign", "Cannot rest until you have explained it", "Cannot tell the fantasy from the person"] },
    { kicker: "The sentence that fits", prompt: "This is…", options: ["A chase I keep starting", "A need to be chosen", "A puzzle I refuse to leave", "A story I am living in"] },
  ],
  "love-language": [
    { kicker: "What lands deepest", prompt: "Which object would feel most meaningful from them?", atlas: "/quiz/symbols.png", options: ["A compass for a trip", "A growing plant", "A letter in a journal", "A prism chosen for you"] },
    { kicker: "Picture being cared for", prompt: "Which room holds the kind of closeness you actually want?", atlas: "/quiz/rooms.png", options: ["Making something together", "A dinner for two", "A task quietly handled", "A beautiful private ritual"] },
    { kicker: "Choose the memory", prompt: "Which landscape would make you feel most chosen?", atlas: "/quiz/landscapes.png", options: ["A shared adventure", "A soft place to talk", "A dependable familiar path", "A magical surprise"] },
    { kicker: "One door opens", prompt: "Which welcome would make you feel most loved?", atlas: "/quiz/doors.png", options: ["Come, let's go", "I've missed you", "I took care of it", "I made this for us"] },
    { kicker: "A hard week", prompt: "The care from them that would actually reach you is…", atlas: "/quiz/rooms.png", options: ["Getting you out of the house", "Sitting with you", "Handling the life stuff", "A small thing that is clearly yours"] },
    { kicker: "They only have 20 minutes", prompt: "Best use of that time is…", options: ["Do one thing together", "Say the true thing", "Knock something off your list", "Make a small moment"] },
    { kicker: "You doubt the bond", prompt: "What would restore it fastest?", options: ["A plan for time together", "Words that are specifically about you", "Them following through", "A gesture that could only be for you"] },
    { kicker: "Public vs private", prompt: "You feel more loved when they…", options: ["Include you in their life in motion", "Speak to you like you matter", "Keep their word when no one is watching", "Leave a private mark only you would notice"] },
    { kicker: "A gift arrives", prompt: "It works if it is…", options: ["A ticket, a tool, a next adventure", "Proof they listen", "Useful in the life you actually live", "Strange and exact"] },
    { kicker: "After a fight", prompt: "Love looks like…", options: ["Coming to get you", "I'm still here", "I will not repeat that", "I see what that was really about"] },
    { kicker: "A busy month", prompt: "You need…", options: ["Something to look forward to", "Frequent emotional contact", "Reliable check-ins", "A ritual that stays yours"] },
    { kicker: "They say I love you", prompt: "It lands when…", options: ["It comes with a next chapter", "It sounds like they know you", "It matches their behavior", "It has a private meaning"] },
    { kicker: "You try to love them back", prompt: "Your natural offering is…", options: ["Experiences", "Words and warmth", "Practical loyalty", "Details and atmosphere"] },
    { kicker: "The miss", prompt: "You feel unseen when they…", options: ["Never make plans", "Stay generic", "Drop the ball", "Give something that could be for anyone"] },
    { kicker: "The deepest yes", prompt: "I feel loved when you…", options: ["Come into my world", "See me in words", "Make my life lighter", "Make it ours on purpose"] },
  ],
  "stress-reset": [
    { kicker: "Your body knows first", prompt: "After a weird text from them, which landscape would lower the charge?", atlas: "/quiz/landscapes.png", options: ["A brisk coastal walk", "A gentle meadow", "A steady forest path", "A silent moonlit desert"] },
    { kicker: "One free hour", prompt: "The relationship is loud in your chest. Which room would reset you?", atlas: "/quiz/rooms.png", options: ["The active studio", "The warm table", "The ordered library", "The quiet rain room"] },
    { kicker: "The first tool", prompt: "Which object helps when you cannot stop thinking about them?", atlas: "/quiz/symbols.png", options: ["The compass", "The living sprout", "The blank journal", "The light-catching prism"] },
    { kicker: "Step out of the loop", prompt: "Which door is the reset you need after they go quiet?", atlas: "/quiz/doors.png", options: ["The bold open door", "The warm cottage", "The private ivy door", "The starlit doorway"] },
    { kicker: "Sunday night tight chest", prompt: "You are already bracing for Monday, and for them. The move that helps is…", atlas: "/quiz/landscapes.png", options: ["Leave the house", "Text someone safe", "List tomorrow into pieces", "Lights down, no input"] },
    { kicker: "The typing bubble", prompt: "They start typing, then stop. Before you do anything, you need…", options: ["To walk first", "A person nearby", "A minute to get orderly", "The room to yourself"] },
    { kicker: "You cannot sleep", prompt: "It is about them. You reset by…", options: ["Getting up and moving", "Hearing a familiar voice", "Writing the open loops down", "Making the dark quieter"] },
    { kicker: "Someone says just relax", prompt: "About this relationship, what actually works is…", options: ["Doing something", "Being with someone", "Making it smaller", "Being left alone"] },
    { kicker: "After a cool reply", prompt: "Your body wants…", options: ["Air and movement", "A hand or a call", "Facts and a next step", "A cave"] },
    { kicker: "The overstimulation tell", prompt: "Love has put you over your limit when you…", options: ["Need to go", "Need someone kind", "Need to control one thing", "Need silence immediately"] },
    { kicker: "Help that misses", prompt: "The least useful offer, when you are spiraling about them, is…", options: ["Sit still and talk longer", "Advice without company", "More emotion with no plan", "Company when you need empty space"] },
    { kicker: "20 minutes, no more", prompt: "Best reset before you text them…", options: ["Walk or change rooms", "Voice note a safe person", "Clear one surface or one task", "No phone, no talk"] },
    { kicker: "You come back to the chat", prompt: "You are ready when…", options: ["The charge has moved", "You feel accompanied again", "The problem has an edge", "The inner weather has changed"] },
    { kicker: "If you skip the reset", prompt: "You usually…", options: ["Get restless and sharp with them", "Get clingy or collapsed", "Get rigid", "Disappear"] },
    { kicker: "What this stress is about", prompt: "Underneath, your system is asking for…", options: ["A way to move the feeling", "To not carry it alone", "One thing that is decided", "A room with no more input"] },
  ],
  "boundary-style": [
    { kicker: "Protect your energy", prompt: "With them, which door is a healthy boundary?", atlas: "/quiz/doors.png", options: ["Clearly open or closed", "Warm but intentional", "Private and protected", "Open when it feels right"] },
    { kicker: "Your time is yours", prompt: "Which room would you keep as a place they cannot walk into?", atlas: "/quiz/rooms.png", options: ["The working studio", "The intimate table", "The private library", "The quiet retreat"] },
    { kicker: "The right distance", prompt: "Which landscape feels like enough space in this relationship?", atlas: "/quiz/landscapes.png", options: ["A clear horizon", "A nearby meadow", "A sheltered forest", "A wide open desert"] },
    { kicker: "How you say no to them", prompt: "Which object best represents it?", atlas: "/quiz/symbols.png", options: ["The compass", "The sprout", "The written page", "The prism"] },
    { kicker: "A last-minute ask", prompt: "They want your evening after you already planned to rest. You…", atlas: "/quiz/doors.png", options: ["Give a clean yes or no", "Soften the no if you decline", "Check the existing rule first", "See if the moment actually has room"] },
    { kicker: "They keep pushing", prompt: "After the second ask, you…", options: ["Repeat the no, shorter", "Explain you still care", "Point to the boundary you already set", "Go quiet until the pressure passes"] },
    { kicker: "Access to you", prompt: "They want your location, your passwords, or your whole day. You…", options: ["Name the line in one sentence", "Explain that you still want them", "Keep a standing rule about access", "Answer only when it feels emotionally okay"] },
    { kicker: "One in the morning", prompt: "They want to talk after you said you were done for the night. You…", options: ["A visible off switch", "A warm delay", "The rule you already have", "It depends how the message feels"] },
    { kicker: "Someone reads your mood", prompt: "You want them to…", options: ["Ask straight", "Stay close but not pry", "Respect the closed door", "Wait until you open"] },
    { kicker: "You already over-gave", prompt: "The correction looks like…", options: ["A blunt stop", "A kind downgrade", "A new standing rule", "A disappearing week"] },
    { kicker: "Guilt after a no", prompt: "You tell yourself…", options: ["Clear is kind", "I can be warm and still refuse", "The rule protects both of us", "I will know if I need to reopen it"] },
    { kicker: "Their friends want details", prompt: "You…", options: ["Say what is and is not shareable", "Keep it kind and vague", "Hold a private rule about what leaves the two of you", "Share only when the feeling is right"] },
    { kicker: "A partner wants more access", prompt: "You feel safest if…", options: ["The ask is named and decided", "They want you, not just the access", "There is a predictable rhythm", "You can open on your own timing"] },
    { kicker: "Privacy", prompt: "The thing you protect hardest with them is…", options: ["Your right to a direct no", "The relationship around the no", "Access to your time and inner room", "The freedom to change your mind"] },
    { kicker: "The boundary that lasts", prompt: "It works when it is…", options: ["Obvious", "Human", "Consistent", "Alive to context"] },
  ],
  "hidden-strength": [
    { kicker: "What feels natural", prompt: "In love, which object is the way you actually help?", atlas: "/quiz/symbols.png", options: ["The compass", "The sprout", "The journal", "The prism"] },
    { kicker: "The first door", prompt: "When the relationship is stuck, which door do you open first?", atlas: "/quiz/doors.png", options: ["The bold red door", "The welcoming cottage", "The storied ivy door", "The impossible starlit door"] },
    { kicker: "The strength you bring", prompt: "Which landscape is what you give them without trying?", atlas: "/quiz/landscapes.png", options: ["The daring coast", "The generous meadow", "The grounded forest", "The visionary desert"] },
    { kicker: "Where you come alive", prompt: "Which room makes your best quality in love easiest to access?", atlas: "/quiz/rooms.png", options: ["The active studio", "The gathering table", "The thoughtful library", "The imaginative rain room"] },
    { kicker: "A stuck couple", prompt: "Without trying, you tend to…", atlas: "/quiz/doors.png", options: ["Start something", "Make the other person feel possible", "Find a workable structure", "Name the thing no one is saying"] },
    { kicker: "They describe you", prompt: "The compliment you half-dismiss is…", options: ["You just go first", "You really see me", "You make it make sense", "You find the hidden layer"] },
    { kicker: "A messy moment", prompt: "Your first useful move in the relationship is…", options: ["Try a path", "Ask who is hurting", "Map it", "Sit with the contradiction"] },
    { kicker: "Underestimated", prompt: "They miss that you…", options: ["Create motion before it is certain", "Hold the emotional field", "Keep the thing from falling apart", "Catch the second meaning"] },
    { kicker: "In a rupture", prompt: "You quietly become the person who…", options: ["Goes first", "Steadies them", "Makes a plan", "Reads what is actually happening"] },
    { kicker: "A compliment that is true", prompt: "In love, you are unusually good at…", options: ["Beginning", "Attunement", "Continuity", "Reframing"] },
    { kicker: "When you hide it", prompt: "You hide this strength when…", options: ["You don't want to look too much", "You don't want to carry them", "You don't want to be the only adult", "You don't want to sound strange"] },
    { kicker: "They come to you for…", prompt: "Usually it is…", options: ["A kickstart", "To feel less alone", "A system", "Language for a feeling"] },
    { kicker: "The cost", prompt: "The same strength, in love, costs you…", options: ["Unfinished starts", "Emotional overload", "Invisible labor", "Overthinking"] },
    { kicker: "If you trusted it more", prompt: "You would…", options: ["Lead more first steps", "Let yourself be needed on purpose", "Claim the architect role", "Share the odd observation sooner"] },
    { kicker: "The sentence that fits", prompt: "In love, I am the person who…", options: ["gets things moving", "makes it human", "keeps it standing", "sees what else it could mean"] },
  ],
};
