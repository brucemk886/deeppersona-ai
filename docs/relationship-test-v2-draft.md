# Relationship test v2 — content draft

Status: rejected by the owner on 2026-09-08; retained only as historical design notes, not for implementation or deployment. The product must retain intuitive image choices rather than written scenario questions. Historical reports remain unchanged.

## What changes

The existing tests reuse four visual categories and derive broad personal claims from an aesthetic preference. Removing the category names alone does not fix that weakness. This version asks about a concrete situation, an initial reaction, what the person wants, and what they would actually do. The report connects those answers without assigning a personality type or a numerical score.

Start with one complete relationship test rather than eight variations of the same four questions. Proposed public title: **When They Pull Away, What Do You Do?** Description: **Explore the gap between what you feel, what you show, and what you need when someone becomes less available.** This is a reflection game for adults, not a validated assessment. Do not infer trauma, attachment diagnosis, a partner's intentions, or relationship compatibility.

## Six-question draft

Opening instruction: Think about someone you have been seeing for a few weeks. You usually hear from them most days. Choose what you would most likely do, even if it is different from what you wish you would do. If a situation is unfamiliar, choose the closest answer; the report describes these choices, not a permanent identity.

### 1. The change

**Their replies have become shorter over the last two days. Nothing happened between you that you know of. What is your first thought?**

- A: They probably have something else going on.
- B: I wonder whether I did something wrong.
- C: I want to ask whether something has changed.
- D: I should invest a little less until I know where I stand.

Purpose: distinguish the interpretation of one ambiguous change. B supports “you first considered your own role in this situation,” not “you have low self-esteem.” D may be pacing or self-protection; do not automatically call it avoidance.

### 2. What you show

**You sent a normal message this morning. It is now evening and there is still no reply. What would you most likely do next?**

- A: Leave it there and get on with my evening.
- B: Send one light check-in.
- C: Ask directly if everything is okay between us.
- D: Say nothing, but keep checking whether they have replied.

Purpose: distinguish outward action from internal attention. Q1 B + Q2 D supports a gap between visible quiet and private uncertainty; Q2 A alone does not prove confidence or indifference.

### 3. What would help

**They reply: “Sorry, it has been a busy day.” What would help you feel comfortable again?**

- A: That explanation is enough for now.
- B: A little warmth: “I still want to see you.”
- C: A concrete plan for when we will next talk or meet.
- D: A few days of consistent contact rather than one message.

Purpose: identify what the respondent says would help in this scenario: explanation, warmth, a plan, or continuity. No answer is the healthiest default.

### 4. When space is explicit

**They say: “I like seeing you, but I need a quiet evening to myself. Can we talk tomorrow?” What is closest to your response?**

- A: I feel fine when I know we will reconnect tomorrow.
- B: I agree, although part of me still feels rejected.
- C: I am relieved to have an evening to myself too.
- D: I would want to talk now rather than carry the uncertainty overnight.

Purpose: contrast unexplained silence with a stated boundary and a return time. Q2 D + Q4 A suggests that ambiguity, rather than all distance, matters in these answers. Do not flatten this into a single label.

### 5. Saying what you need

**If the shorter replies continued for another week, which message would you be most likely to send?**

- A: “I have noticed we talk less. Has something changed for you?”
- B: “I miss talking with you. Could we make time this week?”
- C: “No worries if you are busy.” I would leave my concern unsaid.
- D: I would step back without sending another message.

Purpose: compare stated need with communication. Q3 C + Q5 C supports “you want a plan but might not ask for one.” Q5 D does not establish why someone steps back; keep interpretations conditional.

### 6. What happens next

**You do talk about it. They understand, and their contact becomes consistent again. What is most likely over the next few days?**

- A: I settle back into enjoying the connection.
- B: I feel better but still watch for another change.
- C: I want us to agree on what to do next time one of us is busy.
- D: I would need more time before investing as much again.

Purpose: describe recovery after this specific repair. Do not diagnose distrust or suggest that someone should tolerate repeated broken commitments.

## Report composition

The free summary contains one useful observation grounded in two answers. The full report adds the explanation, contrasts, and a practical example; it must not simply repeat the summary with more adjectives.

1. **What stands out in your answers:** cite two selections, then give a bounded interpretation. Title describes a situation, never a person category.
2. **What changes your response:** compare unexplained silence with explicit space (Q2/Q4). Consistency and contradiction are both legitimate outcomes.
3. **What you want versus what you communicate:** pair Q3 and Q5. If they align, explain that alignment; never fabricate a hidden contradiction.
4. **After reassurance:** use Q6 to explain what the person selected about recovery, without extrapolating a life history.
5. **One thing to try:** a short message tailored to Q3/Q5. Suggestions must allow the other person to decline and the user to leave an unsuitable relationship.
6. **Your answers:** exact question and option text, with original ordering, so readers can understand the basis of the report.

Implementation: versioned question IDs and content, editorial pair rules over explicit question/option IDs, with saved report snapshots. No global four-type mapping, no letter-majority result, no inference based on the position of an answer. A rule can only mention answers that actually triggered it. All other combinations use a factual comparison of the selected answers and a question for reflection, rather than forcing a prewritten profile.

Admin should edit the question, choices, their individual explanation, and a small set of cross-question interpretation rules. Rule editing belongs with report content, not email users. Email users remain a record of submissions and answers. Publication must validate references and reject rules targeting deleted choices.

## Example report, based on Q1 B / Q2 D / Q3 C / Q4 A / Q5 C / Q6 B

### Free summary

**A clear next step matters more than constant contact.**

You chose to wait quietly while checking for a reply, but you also said an evening apart would feel fine if you knew you would talk tomorrow. In this scenario, the difficult part may be not knowing what happens next, rather than simply spending time apart.

### Paid continuation

**Your silence does not describe the whole experience.**

When their replies changed, your first thought was whether you had done something wrong. Later, you chose not to send another message, while continuing to check for a reply. Together, these answers describe an outwardly quiet response that still takes up attention. Someone seeing only the lack of another message would not necessarily know you were concerned. This does not establish that you always hide your feelings; it is the gap in these two choices.

**Notice what makes space easier.**

You were comfortable with “Can we talk tomorrow?” even though unexplained silence held your attention. The amount of contact is not the only difference: the second situation includes a reason and a return point. If this matches your experience, a practical conversation could be about what to expect on busy days rather than asking for more messages throughout every day.

**The information you want is also the information you might not ask for.**

You selected a concrete plan as the thing that would help, but chose “No worries if you are busy” if the pattern continued. That message offers room without asking when you will reconnect. It might be exactly what you want to say in the moment, but it leaves your preferred next step unstated. The other person could reasonably read it as reassurance that nothing needs discussing.

**One reassuring conversation may not immediately free your attention.**

Even after their contact became consistent, you selected continuing to watch for another change. That answer does not tell us whether the concern comes from this person, previous experiences, or simply the imagined scenario. A useful distinction is whether you are noticing new behavior or repeatedly checking for evidence of something that has not happened again.

**A message you could adapt.**

“I understand that some days are busy. I do not need us to message constantly, but I would like to know when we can next catch up. Would tomorrow evening work?”

This states your preference without claiming to know why they were quiet. Their answer may help you understand whether the contact you each want is compatible; the wording cannot guarantee reassurance or a particular response.

**Keep this question:** Would I still feel this uncertain if we had agreed on when to reconnect?

## Release checks

- Review contrasting answer combinations, including calm/warm, direct/plan-seeking, private/consistent, and mixed responses. Do not write every report as an anxiety story.
- Automated coverage enumerates all 4^6 = 4,096 combinations for valid references, complete output and conflicting rules. This verifies mechanics, not psychological validity or editorial quality.
- Human review checks specificity, repetition, unsupported claims, and whether the paid material adds value beyond the free summary.
- Preview the mobile experience before publication; do not reuse the current atlas images against new answer labels unless their visual meaning actually matches.
- Keep this a draft until question format and the sample's editorial direction are settled. No historical data deletion is required.
