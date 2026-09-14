import type { ReactNode } from "react";
import type { AiInsightReport, AiInsightV2 } from "@/lib/ai-reading-parse";
import type { ReportPreview } from "@/lib/payment-types";

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((part) => <p className="ap-essay" key={part}>{part}</p>)}</>;
}

function LockGlyph() {
  return (
    <svg aria-hidden="true" className="ai-insight-lock" viewBox="0 0 24 24" width="16" height="16">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PatternBlock({ patternName, mirror, tell }: { patternName: string; mirror: string; tell: string }) {
  return (
    <Block eyebrow="Part 1 · Your move" title={patternName}>
      <Paragraphs text={mirror} />
      <aside className="ai-insight-tell">
        <span>The tell</span>
        <p>{tell}</p>
      </aside>
    </Block>
  );
}

function CostBlock({ cost }: { cost: string[] }) {
  return (
    <Block eyebrow="Part 2" title="What it has already cost you">
      <ul className="ai-insight-cost">
        {cost.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </Block>
  );
}

export function AiInsightPreviewV2({
  insight,
  unlockLabel,
  onUnlock,
}: {
  insight: NonNullable<ReportPreview["aiInsightV2"]>;
  unlockLabel: string;
  onUnlock: () => void;
}) {
  return (
    <div className="ai-insight-report">
      <PatternBlock patternName={insight.patternName} mirror={insight.mirror} tell={insight.tell} />
      <CostBlock cost={insight.cost} />
      <Block eyebrow="Part 3" title="The moment you lose them">
        <Paragraphs text={insight.turningPointSetup} />
        <div className="ai-insight-locked">
          <span className="ai-insight-kicker">Behind the lock</span>
          <ul>
            {insight.teasers.map((line) => <li key={line}><LockGlyph />{line}</li>)}
          </ul>
          <button className="unlock-button unlock-button-primary" onClick={onUnlock} type="button">{unlockLabel}</button>
          <p className="ai-insight-tease">Written once from this result and kept. It does not change when you come back.</p>
        </div>
      </Block>
    </div>
  );
}

export function AiInsightReportV2({ reading }: { reading: AiInsightV2 }) {
  return (
    <div className="ai-insight-report">
      <PatternBlock patternName={reading.hook.patternName} mirror={reading.hook.mirror} tell={reading.hook.tell} />
      <CostBlock cost={reading.cost} />
      <Block eyebrow="Part 3" title="The moment you lose them">
        <Paragraphs text={reading.turningPoint.setup} />
        <article className="ai-insight-scene">
          <h3>The move</h3>
          <Paragraphs text={reading.turningPoint.move} />
        </article>
        <article className="ai-insight-scene">
          <h3>How it lands on their side</h3>
          <Paragraphs text={reading.turningPoint.misread} />
        </article>
      </Block>
      <Block eyebrow="Part 4" title="Through their eyes">
        <Paragraphs text={reading.throughTheirEyes} />
      </Block>
      <Block eyebrow="Part 5" title="The next 60 days if nothing changes">
        <Paragraphs text={reading.forecast} />
      </Block>
      <Block eyebrow="Part 6" title="The cover story">
        <Paragraphs text={reading.coverStory} />
      </Block>
      <Block eyebrow="Part 7" title="What to do when it spikes">
        <article className="ai-insight-scene">
          <h3>Emergency brake</h3>
          <ol>
            {reading.toolkit.brake.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
        <article className="ai-insight-scene">
          <h3>Send this instead</h3>
          {reading.toolkit.scripts.map((line) => <blockquote key={line}>{line}</blockquote>)}
        </article>
      </Block>
    </div>
  );
}

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
