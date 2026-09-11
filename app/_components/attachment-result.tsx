import {
  ATTACHMENT_STYLE_META,
  attachmentPlotPosition,
  intensityLabel,
  isAttachmentStyle,
  plotVisualQuadrant,
  scoreOnSeven,
  type IntensityLabel,
} from "@/lib/attachment";
import type { ResultProfile } from "@/lib/quiz";

export function HowYouScored({
  anxiety,
  avoidance,
  heading = "How you scored",
}: {
  anxiety: number;
  avoidance: number;
  heading?: string;
}) {
  return (
    <section className="ap-score-card" aria-label={heading}>
      <h2>{heading}</h2>
      <ScoreBar label="Anxiety" percent={anxiety} tone="anxiety" />
      <ScoreBar label="Avoidance" percent={avoidance} tone="avoidance" />
    </section>
  );
}

function ScoreBar({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: "anxiety" | "avoidance";
}) {
  const value = scoreOnSeven(percent);
  const intensity: IntensityLabel = intensityLabel(percent);
  return (
    <div className={`ap-score-bar ap-score-${tone}`}>
      <div className="ap-score-bar-head">
        <span>{label}</span>
        <strong>{value.toFixed(1)}</strong>
      </div>
      <div className="ap-score-track">
        <span style={{ width: `${Math.max(0, Math.min(100, (value / 7) * 100))}%` }} />
        <i style={{ left: `${Math.max(0, Math.min(100, (value / 7) * 100))}%` }} />
      </div>
      <em>{intensity}</em>
    </div>
  );
}

export function AttachmentResult({ result }: { result: ResultProfile }) {
  if (result.key === "choices") return result.strength ? (
    <section className="attach-result-reads" aria-label="Your relationship reflection">
      <article><span>A possible resource</span><p>{result.strength}</p></article>
      <article><span>Something to notice</span><p>{result.watchout}</p></article>
    </section>
  ) : null;
  const anxiety = Math.max(0, Math.min(100, result.anxiety ?? 0));
  const avoidance = Math.max(0, Math.min(100, result.avoidance ?? 0));
  const style = isAttachmentStyle(result.key) ? result.key : null;
  const { leftPercent, topPercent } = attachmentPlotPosition(anxiety, avoidance);
  const visualQuadrant = plotVisualQuadrant(anxiety, avoidance);

  return (
    <section className="attach-result" aria-label="Anxiety and avoidance">
      <HowYouScored anxiety={anxiety} avoidance={avoidance} />
      <div className="quadrant-board" aria-hidden="true">
        <i className="quadrant-crosshair" />
        <span className="quadrant-label quadrant-anxious">Preoccupied</span>
        <span className="quadrant-label quadrant-fearful">Fearful-Avoidant</span>
        <span className="quadrant-label quadrant-secure">Secure</span>
        <span className="quadrant-label quadrant-avoidant">Dismissing</span>
        <span className="quadrant-axis-y">↑ Anxiety</span>
        <span className="quadrant-axis-x">Avoidance →</span>
        <i
          className="quadrant-dot"
          data-anxiety={anxiety}
          data-avoidance={avoidance}
          data-visual-quadrant={visualQuadrant}
          style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
        />
      </div>
      <p className="quadrant-legend">One overall score from this quiz. Higher anxiety leans toward reaching when the bond feels uncertain. Higher avoidance leans toward space when closeness intensifies.</p>
      {style ? <p className="attach-result-blurb">{ATTACHMENT_STYLE_META[style].blurb}</p> : null}
    </section>
  );
}

export function PatternLoop({ name, steps }: { name: string; steps: string[] }) {
  return (
    <section className="pattern-loop" aria-labelledby="pattern-loop-title">
      <span>Your common loop</span>
      <h2 id="pattern-loop-title">{name}</h2>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StyleBanner({ styleKey }: { styleKey?: string }) {
  const tone = isAttachmentStyle(styleKey) ? styleKey : "secure";
  return (
    <div className={`ap-banner ap-banner-${tone}`} aria-hidden="true">
      <i className="ap-blob ap-blob-a" />
      <i className="ap-blob ap-blob-b" />
      <i className="ap-blob ap-blob-c" />
    </div>
  );
}

export function SelfWorthRing({ level, percent }: { level: string; percent: number }) {
  const offset = 251.2 - (Math.max(0, Math.min(100, percent)) / 100) * 251.2;
  return (
    <div className="ap-worth-ring" aria-label={`Self-worth ${level}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ap-worth-track" cx="60" cy="60" r="40" />
        <circle className="ap-worth-fill" cx="60" cy="60" r="40" style={{ strokeDashoffset: offset }} />
      </svg>
      <div>
        <strong>{level}</strong>
        <span>Self-worth</span>
      </div>
    </div>
  );
}

export function PremiumLock({
  title,
  eyebrow = "Premium insight",
  onUnlock,
}: {
  title: string;
  eyebrow?: string;
  onUnlock: () => void;
}) {
  return (
    <article className="ap-premium-block">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <div className="ap-blur-lock">
        <p className="ap-blur-body">
          This longer reading follows the pictures you chose and the first move they suggest in closeness, silence, repair, and self-talk. It stays behind the lock until you open the full report. The sentences here are only a visual tease, not the paid interpretation. This longer reading follows the pictures you chose and the first move they suggest in closeness, silence, repair, and self-talk.
        </p>
        <div className="ap-unlock-overlay">
          <span className="ap-lock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M17 8V7a5 5 0 0 0-10 0v1H5v14h14V8zm-8-1a3 3 0 0 1 6 0v1H9zm8 13H7V10h10z"/></svg>
          </span>
          <strong>Unlock Now</strong>
          <button className="unlock-button" onClick={onUnlock} type="button">Unlock full results</button>
        </div>
      </div>
    </article>
  );
}

export function LockedInsightCard({
  title,
  kind,
  onUnlock,
}: {
  title: string;
  kind: "superpower" | "trigger";
  onUnlock: () => void;
}) {
  return (
    <button className="ap-locked-card" onClick={onUnlock} type="button">
      <span className={`ap-locked-thumb ap-locked-${kind}`} aria-hidden="true">
        {kind === "superpower" ? (
          <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M13 2 4 14h7l-1 8 10-14h-7z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"/></svg>
        )}
        <i className="ap-lock-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M17 8V7a5 5 0 0 0-10 0v1H5v14h14V8zm-8-1a3 3 0 0 1 6 0v1H9z"/></svg>
        </i>
      </span>
      <span className="ap-locked-card-copy">
        <small>Premium insight</small>
        <strong>{title}</strong>
      </span>
    </button>
  );
}
