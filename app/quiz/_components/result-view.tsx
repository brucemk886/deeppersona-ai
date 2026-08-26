"use client";

import Link from "next/link";
import { AtlasImage } from "@/app/quiz/_components/atlas-image";
import { InnerMap } from "@/app/quiz/_components/inner-map";
import { FEATURES } from "@/app/quiz/_lib/features";
import { getDeepResultContent } from "@/lib/deep-results";
import { getDimensionProgress, TEST_DIMENSIONS } from "@/lib/inner-map";
import type { AffiliateProduct, QuizQuestion, QuizTest, ResultProfile } from "@/lib/quiz";
import type { RelationshipNode } from "@/lib/relationship-network";

export function ResultView({
  affiliateProducts,
  answerChoices,
  completedTestIds,
  onOpenDetail,
  onReturnHome,
  onTrack,
  questions,
  recommendedTest,
  relationshipContext,
  result,
  selectedTest,
  showUpgrade,
  setShowUpgrade,
}: {
  affiliateProducts: AffiliateProduct[];
  answerChoices: Record<string, number>;
  completedTestIds: string[];
  onOpenDetail: (test: QuizTest) => void;
  onReturnHome: () => void;
  onTrack: (eventName: string, step?: number) => void;
  questions: QuizQuestion[];
  recommendedTest?: QuizTest;
  relationshipContext: RelationshipNode | null;
  result: ResultProfile | null;
  selectedTest: QuizTest | null;
  showUpgrade: boolean;
  setShowUpgrade: (value: boolean) => void;
}) {
  const deepResult = result && selectedTest ? getDeepResultContent(selectedTest.id, result) : null;
  const mapDimensions = getDimensionProgress(completedTestIds);
  const answeredChoices = questions.flatMap((question, index) => {
    const selectedIndex = answerChoices[question.id];
    const option = selectedIndex === undefined ? undefined : question.options[selectedIndex];
    return option ? [{ option, question, questionNumber: index + 1, selectedIndex }] : [];
  });
  const affiliateProduct =
    result?.affiliateProductId
      ? affiliateProducts.find((product) => product.id === result.affiliateProductId && product.active)
      : undefined;

  return (
    <main className="result-shell">
      <nav className="nav-bar">
        <button className="brand brand-button" onClick={onReturnHome}>
          <span className="brand-mark">DP</span>
          <span>DeepPersona AI</span>
        </button>
        <button className="text-button" onClick={() => window.print()}>
          Save profile
        </button>
      </nav>
      {result && selectedTest && deepResult ? (
        <article className="result-card result-card-expanded">
          <span className="result-test-name">{selectedTest.title}</span>
          <span className="result-basis">Based on {answeredChoices.length} visual choices</span>
          <span className="result-eyebrow">{result.eyebrow}</span>
          <h1>{result.title}</h1>
          <p className="result-summary">{result.summary}</p>

          <section className="choice-review" aria-labelledby="choice-review-title">
            <header>
              <span>Your choices, decoded</span>
              <h2 id="choice-review-title">What each image may be reflecting back to you</h2>
              <p>
                This is the part that shaped your result: not a generic type label, but the specific pattern behind each image you
                selected.
              </p>
            </header>
            <div className="choice-review-list">
              {answeredChoices.map(({ option, question, questionNumber, selectedIndex }) => (
                <article className="choice-review-card" key={question.id}>
                  <AtlasImage className="choice-review-image" index={selectedIndex} loading="eager" path={question.atlasPath} sizes="180px" />
                  <div className="choice-review-copy">
                    <div className="choice-review-meta">
                      <span>Question {questionNumber}</span>
                      <strong>You chose {String.fromCharCode(65 + selectedIndex)}</strong>
                    </div>
                    <p className="choice-review-question">{question.prompt}</p>
                    <h3>{option.label}</h3>
                    <div>
                      <strong>What this choice represents</strong>
                      <p>{option.meaning}</p>
                    </div>
                    <div>
                      <strong>Your projection</strong>
                      <p>{option.projection}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="pattern-lens">
            <span>What this test is actually noticing</span>
            <h2>{deepResult.lens.title}</h2>
            <p>{deepResult.lens.explanation}</p>
          </section>

          <div className="deep-insight-grid">
            <section>
              <span>Core motivation</span>
              <h3>What sits underneath the pattern</h3>
              <p>{deepResult.depth.coreDrive}</p>
            </section>
            <section>
              <span>In relationships</span>
              <h3>What other people may experience</h3>
              <p>{deepResult.depth.inRelationships}</p>
            </section>
            <section>
              <span>Under pressure</span>
              <h3>When the strength becomes protection</h3>
              <p>{deepResult.depth.underPressure}</p>
            </section>
          </div>

          <section className="reflection-card">
            <span>A question worth keeping</span>
            <p>“{deepResult.lens.reflectionPrompt}”</p>
          </section>
          <p className="result-disclaimer">
            This is a self-reflection tool based on four visual choices, not a clinical assessment or diagnosis.
          </p>

          {relationshipContext ? (
            <section className="relationship-saved">
              <span>Relationship map updated</span>
              <h2>This reflection now belongs to your connection with {relationshipContext.nickname}.</h2>
              <p>
                It records your experience in this relationship, not a conclusion about the other person. Return to your map to keep
                adding context over time.
              </p>
            </section>
          ) : null}

          {FEATURES.resultMap ? (
            <>
              <section className="map-unlock-copy">
                <span>New dimension added</span>
                <h2>
                  {TEST_DIMENSIONS[selectedTest.id]
                    ? `${mapDimensions.find((dimension) => dimension.id === TEST_DIMENSIONS[selectedTest.id])?.label} is now part of your map.`
                    : "Your Inner Map has started."}
                </h2>
                <p>This is not a fixed label. Every future reflection adds context and can make the pattern more precise.</p>
              </section>
              <InnerMap completedTestIds={completedTestIds} />
            </>
          ) : null}

          {affiliateProduct ? (
            <section className="affiliate-recommendation" aria-labelledby="affiliate-recommendation-title">
              <div className="affiliate-recommendation-copy">
                <span>Selected for your result</span>
                <h2 id="affiliate-recommendation-title">A next step that may support you</h2>
                <h3>{affiliateProduct.name}</h3>
                <p>{affiliateProduct.description}</p>
                <small>
                  Affiliate disclosure: we may earn a commission if you choose to purchase through this link, at no extra cost to you.
                </small>
              </div>
              <a
                className="affiliate-recommendation-link"
                href={affiliateProduct.url}
                onClick={() => onTrack("affiliate_link_clicked", questions.length + 4)}
                rel="sponsored nofollow noopener"
                target="_blank"
              >
                {affiliateProduct.buttonLabel} <span aria-hidden="true">↗</span>
              </a>
            </section>
          ) : null}

          {recommendedTest ? (
            <section className="next-exploration" style={{ "--test-accent": recommendedTest.accent } as React.CSSProperties}>
              <div>
                <span>Recommended next</span>
                <h2>{recommendedTest.title}</h2>
                <p>{recommendedTest.description}</p>
              </div>
              <button className="primary-button" onClick={() => onOpenDetail(recommendedTest)} type="button">
                Explore this dimension →
              </button>
            </section>
          ) : null}
        </article>
      ) : null}

      {FEATURES.crossTestReport ? (
        <section className="premium-card">
          <div>
            <span className="premium-label">Coming next · Cross-test report</span>
            <h2>Connect your patterns across all eight tests.</h2>
            <p>
              A combined projection map showing repeated choices, contradictions between profiles, and the situations that change your
              response.
            </p>
          </div>
          <button
            className="premium-button"
            onClick={() => {
              setShowUpgrade(true);
              onTrack("upgrade_clicked", questions.length + 3);
            }}
          >
            Preview combined report <span>↗</span>
          </button>
        </section>
      ) : null}

      <button className="retake-button" onClick={onReturnHome}>
        Explore more visual tests
      </button>

      {FEATURES.crossTestReport && showUpgrade ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}>
          <div
            className="upgrade-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>
              ×
            </button>
            <span className="result-seal">Premium preview</span>
            <h2 id="upgrade-title">Your deeper report is almost here.</h2>
            <p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p>
            <div className="premium-list">
              <span>✓ Every choice explained in context</span>
              <span>✓ Repeated relationship and stress signals</span>
              <span>✓ Contradictions that reveal when your pattern changes</span>
            </div>
            <button className="primary-button full-button" disabled>
              Checkout coming soon
            </button>
            <p className="checkout-legal">
              Future purchases will be subject to our <Link href="/terms">Terms</Link>, <Link href="/privacy">Privacy Policy</Link>, and{" "}
              <Link href="/refunds">Refund & Delivery Policy</Link>.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
