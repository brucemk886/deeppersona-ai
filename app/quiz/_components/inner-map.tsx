import { getDimensionProgress } from "@/lib/inner-map";

export function InnerMap({ completedTestIds, compact = false }: { completedTestIds: string[]; compact?: boolean }) {
  const dimensions = getDimensionProgress(completedTestIds);
  const unlocked = dimensions.filter((dimension) => dimension.unlocked).length;
  return (
    <section className={`inner-map ${compact ? "inner-map-compact" : ""}`} aria-label="Your six-part Inner Map">
      <header>
        <span>Your evolving profile</span>
        <h2>Your Inner Map</h2>
        <p>Each visual exploration adds evidence to one part of the person you are becoming.</p>
      </header>
      <div className="inner-map-board">
        <div className="inner-map-core">
          <strong>
            {unlocked}
            <small>/ 6</small>
          </strong>
          <span>dimensions discovered</span>
        </div>
        {dimensions.map((dimension, index) => (
          <article
            className={`inner-map-node inner-map-node-${index + 1} ${dimension.unlocked ? "is-unlocked" : ""}`}
            key={dimension.id}
          >
            <i>{dimension.unlocked ? "✓" : String(index + 1).padStart(2, "0")}</i>
            <div>
              <strong>{dimension.label}</strong>
              <span>{dimension.unlocked ? `${dimension.completedCount}/${dimension.testCount} reflections` : "Not explored yet"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
