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
    ? `$${(featuredTest.reportPriceCents / 100).toFixed(2)}`
    : "$4.99";

  return (
    <main className="landing-shell marketing-shell">
      <SiteNav active="home" />

      <section className="attach-hero" id="top">
        <div className="attach-hero-copy">
          <span className="pill">Free visual quiz · 12 image choices</span>
          <h1>Do you know your attachment style?</h1>
          <p className="hero-lede">
            When closeness feels uncertain, people reach, step back, stay steady, or do both.
            This short image quiz helps you notice the pattern you use in adult relationships.
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
            <a className="text-button attach-secondary-cta" href="#attachment">
              What attachment means
            </a>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="trust-row">
            <span>About 3 minutes</span>
            <i />
            <span>No right answer</span>
            <i />
            <span>Educational, not a diagnosis</span>
          </div>
        </div>
        <div className="attach-hero-panel" aria-hidden="true">
          <article className="style-tile style-tile-anxious"><span>A</span><strong>Anxious</strong><small>Reach when it goes quiet</small></article>
          <article className="style-tile style-tile-avoidant"><span>B</span><strong>Avoidant</strong><small>Protect space first</small></article>
          <article className="style-tile style-tile-secure"><span>C</span><strong>Secure</strong><small>Stay close, stay steady</small></article>
          <article className="style-tile style-tile-fearful"><span>D</span><strong>Fearful-avoidant</strong><small>Want in, keep an exit</small></article>
        </div>
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
            <Link href="/disclaimer">Read the limitations</Link>
            {" · "}
            <Link href="/insights">Learn more in Insights</Link>
            {" · "}
            <Link href="/blog">Read the blog</Link>
          </p>
        </div>
      </section>

      <section className="how-it-works attach-how" id="how">
        <span>01 · Notice</span>
        <p>Look at four scenes. Let your eyes land before you explain the choice.</p>
        <span>02 · Choose</span>
        <p>Pick A, B, C, or D — the picture that matches your first move.</p>
        <span>03 · See your style</span>
        <p>Get a free type, short reads, and bars. A longer report is optional.</p>
      </section>

      <section className="attach-cta" id="quiz">
        <div>
          <span>Ready when you are</span>
          <h2>Take the free attachment quiz.</h2>
          <p>
            Twelve situational image choices. Your free result names a style and shows how strongly
            you leaned toward reaching and stepping back. You can later unlock a written report for {price} if you want more detail.
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
