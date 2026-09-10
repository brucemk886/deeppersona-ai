import Link from "next/link";
import type { QuizTest } from "@/lib/quiz";
import { SiteFooter, SiteNav } from "@/app/_components/site-chrome";

const anxiousSigns = [
  "You replay a partner’s words until the meaning feels unsafe.",
  "A slow reply can pull your whole evening off center.",
  "You work hard to keep the bond warm, sometimes before you rest.",
  "Closeness feels best when you can feel the other person nearby.",
];

const avoidantSigns = [
  "You look for air when someone moves closer, faster than you like.",
  "It can be easier to spot a flaw than to stay in the tender part.",
  "Vulnerability may feel like giving away the room you need.",
  "You recover by doing something useful, not by talking it through first.",
];

export function HomeLanding({
  error,
  featuredTest,
  loading,
  onStart,
}: {
  error?: string;
  featuredTest?: QuizTest;
  loading?: boolean;
  onStart: (test: QuizTest) => void;
}) {
  const price = featuredTest && featuredTest.reportPriceCents > 0
    ? `USD ${(featuredTest.reportPriceCents / 100).toFixed(2)}`
    : null;
  const questionCount = featuredTest?.questionCount;
  const duration = questionCount ? Math.max(1, Math.ceil(questionCount / 4)) : null;

  return (
    <main className="landing-shell marketing-shell editorial-home">
      <SiteNav active="home" />

      <section className="attach-hero" id="top">
        <div className="attach-hero-copy">
          <span className="editorial-kicker">A visual quiz for real relationships</span>
          <h1>How do you move toward closeness?</h1>
          <p className="hero-lede">
            Explore your relationship patterns through {questionCount ? `${questionCount} image choices` : "a short visual quiz"}.
          </p>
          <div className="attach-hero-actions">
            <button
              className="primary-button hero-cta"
              disabled={!featuredTest || loading}
              onClick={() => featuredTest && onStart(featuredTest)}
              type="button"
            >
              {loading ? "Opening…" : "Start the free quiz"} <span aria-hidden="true">→</span>
            </button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="trust-row">
            <span>{duration ? `${duration} minutes` : "Go at your own pace"}</span>
            <i />
            <span>Free summary</span>
          </div>
        </div>
        <figure className="editorial-hero-image">
          <img src="/images/editorial/connection-1200.webp"
            srcSet="/images/editorial/connection-640.webp 640w, /images/editorial/connection-1200.webp 1200w"
            sizes="(max-width: 900px) 100vw, 50vw" width={1200} height={800}
            fetchPriority="high" decoding="async"
            alt="Two adults sharing a quiet conversation at home" />
        </figure>
      </section>

      <p className="editorial-price">{price ? `Full report: ${price} · One-time payment` : featuredTest ? "This report is currently free" : "Report pricing will appear when the quiz loads"}</p>

      <section className="editorial-preview" aria-labelledby="preview-title">
        <span className="editorial-kicker">What you’ll see</span>
        <h2 id="preview-title">A closer look at your patterns</h2>
        <div className="editorial-preview-content">
          <div>
            <h3>Your choices, explained</h3>
            <p>Explore each image you chose, its interpretation, and a reflection to bring back to your own relationships.</p>
            <a href="#report-sample">Read a sample</a>
            <p className="editorial-delivery">After payment, read your report here. We’ll also email a private link so you can return to it.</p>
          </div>
          <details className="editorial-sample" id="report-sample" open>
            <summary>Sample report</summary>
            <h3>A pattern, not a verdict</h3>
            <p>These scores describe how often your image choices leaned toward reaching, stepping back, staying steady, or doing both. They are a reflection prompt for this moment, not a diagnosis or a fixed identity.</p>
            <p><strong>A question to take with you</strong></p>
            <p>Where did your first picture feel familiar, and where would you choose differently on a calmer day?</p>
          </details>
        </div>
        <p className="editorial-note">For self-reflection and educational purposes only. Not a diagnosis.</p>
      </section>

      <section className="attach-section" id="attachment">
        <div className="attach-section-copy">
          <span>What this is about</span>
          <h2>Attachment is the pattern you bring to closeness.</h2>
          <p>
            In adult life, attachment shows up in how you ask for contact, how you take space,
            and what your body does when a message is late or a plan gets more intimate.
            It is a useful map for relationships—not a label you have to wear forever.
          </p>
          <p>
            Researchers often talk about two leanings: how strongly you seek reassurance,
            and how strongly you protect independence. Those leanings can combine into four
            familiar styles: anxious, avoidant, secure, and fearful-avoidant.
          </p>
        </div>
        <div className="attach-points">
          <article>
            <span>01</span>
            <h3>It shows up in ordinary moments</h3>
            <p>A quiet phone, a weekend invite, or a request for space can reveal the move you trust first.</p>
          </article>
          <article>
            <span>02</span>
            <h3>It shapes talk, timing, and repair</h3>
            <p>The same disagreement can feel like a threat to the bond, a threat to your air, or a problem you can return to.</p>
          </article>
          <article>
            <span>03</span>
            <h3>It can change with context</h3>
            <p>You may look one way with a partner and another way with family. This quiz reflects the pattern that feels loudest right now.</p>
          </article>
        </div>
      </section>

      <section className="attach-signs" id="signs">
        <header>
          <span>How it can look in a relationship</span>
          <h2>Two common pulls: reaching, and stepping back.</h2>
          <p>Most people recognize a little of both. The question is which move your body chooses first.</p>
        </header>
        <div className="sign-grid">
          <article className="sign-card sign-anxious">
            <span>Anxious-leaning</span>
            <h3>Do you get pulled toward the bond?</h3>
            <ul>
              {anxiousSigns.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="sign-card sign-avoidant">
            <span>Avoidant-leaning</span>
            <h3>Do you get pulled toward space?</h3>
            <ul>
              {avoidantSigns.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
        <p className="sign-note">
          Secure-leaning people can want closeness and still keep their own pace.
          Fearful-avoidant-leaning people often want both contact and an exit in the same stretch of time.
        </p>
      </section>

      <section className="attach-trust" id="trust">
        <div>
          <span>How to use this</span>
          <h2>A learning tool, not a diagnosis.</h2>
          <p>
            DeepPersona is for self-reflection and conversation. The quiz does not assess, treat, or name a
            mental-health condition. If you are in distress, talk with a licensed clinician or a trusted local resource.
          </p>
          <p>
            <Link prefetch={false} href="/disclaimer">Read the limitations</Link>
            {" · "}
            <Link prefetch={false} href="/insights">Learn more in Insights</Link>
            {" · "}
            <Link prefetch={false} href="/blog">Read the blog</Link>
          </p>
        </div>
      </section>

      <section className="how-it-works attach-how" id="how">
        <span>01 · Notice</span>
        <p>Look at four scenes. Let your eyes land before you explain the choice.</p>
        <span>02 · Choose</span>
        <p>Pick A, B, C, or D — the picture that matches your first move.</p>
        <span>03 · Explore your pattern</span>
        <p>See your free summary. Unlock the full written interpretation if you want to go deeper.</p>
      </section>

      <section className="attach-cta" id="quiz">
        <div>
          <span>Ready when you are</span>
          <h2>Take the free attachment quiz.</h2>
          <p>
            {questionCount ? `${questionCount} situational image choices. ` : "A short visual quiz. "}Your free result explores how strongly
            you leaned toward reaching and stepping back.{price ? ` You can unlock the full report for ${price}. One-time payment, no subscription.` : ""}
          </p>
          <button
            className="primary-button"
            disabled={!featuredTest || loading}
            onClick={() => featuredTest && onStart(featuredTest)}
            type="button"
          >
            {loading ? "Opening…" : "Start quiz"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
