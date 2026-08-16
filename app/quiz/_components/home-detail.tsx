"use client";

import { AtlasImage } from "@/app/quiz/_components/atlas-image";
import { InnerMap } from "@/app/quiz/_components/inner-map";
import { RelationshipNetwork } from "@/app/quiz/_components/relationship-network";
import { SiteFooter, SiteNav } from "@/app/quiz/_components/site-chrome";
import { FEATURES } from "@/app/quiz/_lib/features";
import type { QuizTest } from "@/lib/quiz";
import type { RelationshipNode, RelationshipType } from "@/lib/relationship-network";

export function HomeView({
  completedTestIds,
  error,
  featuredTest,
  loadingTest,
  onCreateRelationship,
  onOpenDetail,
  onPrepareDetail,
  onStartWithRelationship,
  previewImages,
  recommendedTest,
  relationshipError,
  relationshipLoading,
  relationships,
  tests,
  unlockedDimensions,
}: {
  completedTestIds: string[];
  error: string;
  featuredTest?: QuizTest;
  loadingTest: string;
  onCreateRelationship: (nickname: string, relationshipType: RelationshipType) => Promise<boolean>;
  onOpenDetail: (test: QuizTest) => void;
  onPrepareDetail: (test: QuizTest) => void;
  onStartWithRelationship: (relationship: RelationshipNode) => void;
  previewImages: { atlas: string; index: number }[];
  recommendedTest?: QuizTest;
  relationshipError: string;
  relationshipLoading: boolean;
  relationships: RelationshipNode[];
  tests: QuizTest[];
  unlockedDimensions: number;
}) {
  return (
    <main className="landing-shell">
      <nav className="nav-bar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="DeepPersona AI home">
          <span className="brand-mark">DP</span>
          <span>DeepPersona AI</span>
        </a>
        <a className="nav-note nav-link" href="#tests">
          Explore 8 visual tests ↓
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="pill">Visual psychology tests · 2 minutes</span>
          <h1>One image can say what words miss.</h1>
          <p className="hero-lede">
            Choose what pulls you in. Get a concise reflection on how you connect, reset, set boundaries, and move through relationships.
          </p>
          {featuredTest ? (
            <button className="primary-button hero-cta" disabled={loadingTest === featuredTest.id} onClick={() => onOpenDetail(featuredTest)}>
              {loadingTest === featuredTest.id ? "Opening…" : "Explore the most popular test"} <span aria-hidden="true">↗</span>
            </button>
          ) : null}
          <div className="trust-row" aria-label="Test details">
            <span>No right answers</span>
            <i />
            <span>Private by design</span>
            <i />
            <span>4 visual choices</span>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button
          className="hero-mosaic"
          aria-label={featuredTest ? `Start ${featuredTest.title}` : "A preview of four visual choices"}
          disabled={!featuredTest || loadingTest === featuredTest.id}
          onClick={() => featuredTest && onOpenDetail(featuredTest)}
          type="button"
        >
          {previewImages.map((item) => (
            <AtlasImage
              index={item.index}
              key={item.index}
              loading="eager"
              path={item.atlas}
              priority={item.index === 0}
              sizes="(max-width: 640px) 360px, 560px"
            />
          ))}
          <div className="mosaic-prompt">Which one feels safest?</div>
        </button>
      </section>

      {FEATURES.returningMap && completedTestIds.length ? (
        <>
          <section className="returning-profile">
            <div className="returning-profile-copy">
              <span>Welcome back</span>
              <h2>Your map remembers where you left off.</h2>
              <p>
                {unlockedDimensions} of 6 dimensions discovered. One short reflection is enough to keep building.
              </p>
              {recommendedTest ? (
                <button className="primary-button" onClick={() => onOpenDetail(recommendedTest)} type="button">
                  Continue with {recommendedTest.title} →
                </button>
              ) : null}
            </div>
            <InnerMap compact completedTestIds={completedTestIds} />
          </section>
          {FEATURES.relationshipNetwork ? (
            <>
              <RelationshipNetwork
                loading={relationshipLoading}
                onCreate={onCreateRelationship}
                onExplore={onStartWithRelationship}
                relationships={relationships}
              />
              {relationshipError ? (
                <p className="relationship-error" role="alert">
                  {relationshipError}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <section className="test-library" id="tests">
        <div className="library-heading">
          <span>Choose your question</span>
          <h2>Eight ways to understand yourself a little better.</h2>
          <p>Short, visual, and designed for reflection—not diagnosis.</p>
        </div>
        <div className="test-card-grid">
          {tests.map((test, index) => (
            <button
              aria-label={`View details for ${test.title}`}
              className={`test-card ${test.featured ? "featured" : ""}`}
              disabled={loadingTest === test.id}
              key={test.id}
              onClick={() => onOpenDetail(test)}
              onFocus={() => onPrepareDetail(test)}
              onPointerEnter={() => onPrepareDetail(test)}
              style={{ "--test-accent": test.accent } as React.CSSProperties}
              type="button"
            >
              <div className="test-card-image">
                <AtlasImage index={0} path={test.coverAtlasPath} sizes="(max-width: 640px) 236px, 380px" />
                <span className="test-number">{String(index + 1).padStart(2, "0")}</span>
                {test.featured ? <span className="popular-badge">Most popular</span> : null}
              </div>
              <div className="test-card-copy">
                <span>{test.kicker}</span>
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <div>
                  <small>
                    {test.questionCount || 4} questions
                    {test.reportPriceCents > 0 ? (
                      <>
                        <br />
                        <em className="test-report-price">Full report ${(test.reportPriceCents / 100).toFixed(2)}</em>
                      </>
                    ) : null}
                  </small>
                  <strong className="test-card-start">{loadingTest === test.id ? "Opening…" : "Explore →"}</strong>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <span>01 · Notice</span>
        <p>Let your eyes land before your reasoning catches up.</p>
        <span>02 · Choose</span>
        <p>Pick the image that creates the strongest first response.</p>
        <span>03 · Reveal</span>
        <p>Get your type, strength, watchout, and a practical next step.</p>
      </section>
      <SiteFooter expanded />
    </main>
  );
}

export function DetailView({
  detailPrompt,
  error,
  loadingTest,
  onStart,
  selectedTest,
}: {
  detailPrompt: string;
  error: string;
  loadingTest: string;
  onStart: () => void;
  selectedTest: QuizTest;
}) {
  return (
    <main className="test-detail-shell">
      <SiteNav noteHref="/#tests" noteLabel="All visual tests ↓" />
      <section className="detail-stage" style={{ "--test-accent": selectedTest.accent } as React.CSSProperties}>
        <div className="detail-gallery" aria-label="Four visual choices preview">
          {[0, 1, 2, 3].map((index) => (
            <AtlasImage
              index={index}
              key={index}
              loading="eager"
              path={selectedTest.coverAtlasPath}
              priority={index === 0}
              sizes="(max-width: 640px) 50vw, 340px"
            />
          ))}
          <span className="detail-gallery-tag">Choose the one you feel first</span>
        </div>
        <div className="detail-story">
          <span className="detail-category">{selectedTest.kicker}</span>
          <p className="detail-count">4 visual choices · about 2 minutes</p>
          <h1>{detailPrompt}</h1>
          <p className="detail-intro">
            There is no right answer. The image you reach for first can reveal the pattern you use before words catch up.
          </p>
          <div className="detail-reveal">
            <span>YOUR REFLECTION WILL EXPLORE</span>
            <div>
              <p>What your first instinct is trying to protect.</p>
              <p>How this pattern shapes closeness, stress, or boundaries.</p>
              <p>The strength hidden inside the response you repeat.</p>
            </div>
          </div>
          <button className="primary-button detail-cta" disabled={loadingTest === selectedTest.id} onClick={onStart}>
            {loadingTest === selectedTest.id ? "Opening…" : "See what your first choice reveals"}{" "}
            <span aria-hidden="true">→</span>
          </button>
          <div className="detail-assurance">
            <span>Free visual test</span>
            <i /> <span>Private by design</span>
            {selectedTest.reportPriceCents > 0 ? (
              <>
                <i /> <span>Full report available for ${(selectedTest.reportPriceCents / 100).toFixed(2)}</span>
              </>
            ) : null}
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
