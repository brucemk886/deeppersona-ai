import { ATTACHMENT_STYLE_META, type AttachmentStyle } from "@/lib/attachment";
import type { ResultProfile } from "@/lib/quiz";

function isAttachmentStyle(key: ResultProfile["key"]): key is AttachmentStyle {
  return key === "anxious" || key === "avoidant" || key === "secure" || key === "fearful";
}

export function AttachmentResult({ result }: { result: ResultProfile }) {
  const anxiety = Math.max(0, Math.min(100, result.anxiety ?? 0));
  const avoidance = Math.max(0, Math.min(100, result.avoidance ?? 0));
  const style = isAttachmentStyle(result.key) ? result.key : null;
  const left = `${avoidance}%`;
  const top = `${100 - anxiety}%`;

  return (
    <section className="attach-result" aria-label="Attachment style summary">
      <div className="score-bars" aria-label="Anxiety and avoidance">
        <div>
          <span>Reaching / anxiety</span>
          <strong>{anxiety}</strong>
          <div className="score-track"><span style={{ width: `${anxiety}%` }} /></div>
        </div>
        <div>
          <span>Distance / avoidance</span>
          <strong>{avoidance}</strong>
          <div className="score-track"><span style={{ width: `${avoidance}%` }} /></div>
        </div>
      </div>
      <div className="quadrant-board" aria-hidden="true">
        <span className="quadrant-label quadrant-anxious">Anxious</span>
        <span className="quadrant-label quadrant-fearful">Fearful-avoidant</span>
        <span className="quadrant-label quadrant-secure">Secure</span>
        <span className="quadrant-label quadrant-avoidant">Avoidant</span>
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
