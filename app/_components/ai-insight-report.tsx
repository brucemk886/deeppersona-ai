import type { ReactNode } from "react";
import type { AiInsightReport } from "@/lib/ai-reading-parse";

function Block({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ap-section ai-insight">
      <span className="ai-insight-kicker">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function AiInsightPreview({
  paradox,
  selfSabotage,
  closeness,
  silenceAlarm,
  conflictAlarm,
  fear,
  onUnlock,
}: {
  paradox: string;
  selfSabotage: string;
  closeness: { alarm: string; action: string };
  silenceAlarm: string;
  conflictAlarm: string;
  fear: string;
  onUnlock: () => void;
}) {
  return (
    <div className="ai-insight-report">
      <AiInsightPortrait paradox={paradox} selfSabotage={selfSabotage} />
      <Block eyebrow="Part 2" title="Three moments that blow up">
        <article className="ai-insight-scene">
          <h3>When they move closer</h3>
          <p><strong>The alarm</strong>{closeness.alarm}</p>
          <p><strong>The reflex</strong>{closeness.action}</p>
        </article>
        <article className="ai-insight-scene">
          <h3>When they go quiet</h3>
          <p><strong>The catastrophe script</strong>{silenceAlarm}</p>
          <p className="ai-insight-tease">What you do next — the text you send, the silence you weaponize — sits in the full reading.</p>
        </article>
        <article className="ai-insight-scene">
          <h3>When conflict hits</h3>
          <p><strong>What the body does</strong>{conflictAlarm}</p>
          <p className="ai-insight-tease">The extreme move is the part that usually ends the night. It unlocks with the rest.</p>
        </article>
      </Block>
      <Block eyebrow="Part 3" title="What the defense is actually doing">
        <p className="ap-essay"><strong>The real fear </strong>{fear}</p>
        <p className="ai-insight-tease">The cover story you use to stay proud of the distance is in the paid pages, with the two lines you can send before you vanish.</p>
        <button className="unlock-button" onClick={onUnlock} type="button">Unlock the rest of this reading</button>
      </Block>
    </div>
  );
}

export function AiInsightPortrait({ paradox, selfSabotage }: { paradox: string; selfSabotage: string }) {
  return (
    <Block eyebrow="Part 1" title="The contradiction underneath">
      <p className="ap-essay">{paradox}</p>
      <p className="ap-essay">{selfSabotage}</p>
    </Block>
  );
}

export function AiInsightReport({ reading }: { reading: AiInsightReport }) {
  return (
    <div className="ai-insight-report">
      <AiInsightPortrait paradox={reading.contradiction.paradox} selfSabotage={reading.contradiction.selfSabotage} />
      <Block eyebrow="Part 2" title="Three moments that blow up">
        <article className="ai-insight-scene">
          <h3>When they move closer</h3>
          <p><strong>The alarm</strong>{reading.scenes.closeness.alarm}</p>
          <p><strong>The reflex</strong>{reading.scenes.closeness.action}</p>
        </article>
        <article className="ai-insight-scene">
          <h3>When they go quiet</h3>
          <p><strong>The catastrophe script</strong>{reading.scenes.silence.alarm}</p>
          <p><strong>The retaliatory move</strong>{reading.scenes.silence.action}</p>
        </article>
        <article className="ai-insight-scene">
          <h3>When conflict hits</h3>
          <p><strong>What the body does</strong>{reading.scenes.conflict.alarm}</p>
          <p><strong>The extreme move</strong>{reading.scenes.conflict.action}</p>
        </article>
      </Block>
      <Block eyebrow="Part 3" title="What the defense is actually doing">
        <p className="ap-essay"><strong>The real fear </strong>{reading.defense.fear}</p>
        <p className="ap-essay"><strong>The cover story </strong>{reading.defense.excuse}</p>
      </Block>
      <Block eyebrow="Part 4" title="What to do when it spikes">
        <article className="ai-insight-scene">
          <h3>Emergency brake</h3>
          <ol>
            {reading.toolkit.brake.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
        <article className="ai-insight-scene">
          <h3>Lines you can send as-is</h3>
          {reading.toolkit.scripts.map((line) => <blockquote key={line}>{line}</blockquote>)}
        </article>
      </Block>
    </div>
  );
}
