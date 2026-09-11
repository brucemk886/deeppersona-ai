import {
  ATTACHMENT_STYLE_META,
  attachmentPlotPosition,
  isAttachmentStyle,
  plotVisualQuadrant,
} from "@/lib/attachment";
import type { ResultProfile } from "@/lib/quiz";

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
      <div className="score-bars">
        <div>
          <span>Anxiety</span>
          <strong>{anxiety}</strong>
          <div className="score-track"><span style={{ width: `${anxiety}%` }} /></div>
        </div>
        <div>
          <span>Avoidance</span>
          <strong>{avoidance}</strong>
          <div className="score-track"><span style={{ width: `${avoidance}%` }} /></div>
        </div>
      </div>
      <div className="quadrant-board" aria-hidden="true">
        <i className="quadrant-crosshair" />
        <span className="quadrant-label quadrant-anxious">Anxious</span>
        <span className="quadrant-label quadrant-fearful">Fearful-Avoidant</span>
        <span className="quadrant-label quadrant-secure">Secure</span>
        <span className="quadrant-label quadrant-avoidant">Avoidant</span>
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
      <p className="quadrant-legend">Higher anxiety leans toward reaching when the bond feels uncertain. Higher avoidance leans toward space when closeness intensifies. Both high is the push-pull middle. Both low is steadier ground.</p>
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
