import { ATTACHMENT_STYLE_META, isAttachmentStyle } from "@/lib/attachment";
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
  const left = `${avoidance}%`;
  const top = `${100 - anxiety}%`;

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
        <span className="quadrant-label quadrant-anxious">Anxious</span>
        <span className="quadrant-label quadrant-fearful">Fearful-Avoidant</span>
        <span className="quadrant-label quadrant-secure">Secure</span>
        <span className="quadrant-label quadrant-avoidant">Avoidant</span>
        <span className="quadrant-axis-y">Anxiety</span>
        <span className="quadrant-axis-x">Avoidance</span>
        <i className="quadrant-dot" style={{ left, top }} />
      </div>
      {style ? <p className="attach-result-blurb">{ATTACHMENT_STYLE_META[style].blurb}</p> : null}
      {result.strength ? (
        <div className="attach-result-reads">
          <article><span>A short read</span><p>{result.strength}</p></article>
          <article><span>Watch for</span><p>{result.watchout}</p></article>
        </div>
      ) : null}
    </section>
  );
}
