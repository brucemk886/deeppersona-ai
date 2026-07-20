"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  calculateResult,
  type QuizQuestion,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";

type Stage = "intro" | "quiz" | "email" | "result";

function getAttribution() {
  if (typeof window === "undefined") return { source: "direct", campaign: "" };
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  const source =
    params.get("utm_source") ||
    (params.get("ttclid") || referrer.includes("tiktok.com")
      ? "tiktok"
      : referrer
        ? new URL(referrer).hostname
        : "direct");
  return { source, campaign: params.get("utm_campaign") ?? "" };
}

function getSessionId() {
  const existing = window.sessionStorage.getItem("inner-atlas-session");
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem("inner-atlas-session", next);
  return next;
}

export function QuizApp({ initialQuestions }: { initialQuestions: QuizQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraitKey>>({});
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultProfile | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sessionId] = useState(() =>
    typeof window === "undefined" ? "" : getSessionId(),
  );
  const [attribution] = useState(() =>
    typeof window === "undefined" ? { source: "direct", campaign: "" } : getAttribution(),
  );

  const track = useCallback(
    (eventName: string, step = 0, questionId?: string, optionLabel?: string) => {
      if (!sessionId) return;
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          eventName,
          step,
          source: attribution.source,
          campaign: attribution.campaign,
          questionId,
          optionLabel,
        }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [attribution, sessionId],
  );

  useEffect(() => {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        eventName: "session_started",
        source: attribution.source,
        campaign: attribution.campaign,
      }),
    }).catch(() => undefined);

    void fetch("/api/questions")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.questions?.length) setQuestions(data.questions);
      })
      .catch(() => undefined);
  }, [attribution, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => track("heartbeat"), 60_000);
    return () => window.clearInterval(timer);
  }, [sessionId, track]);

  const activeQuestion = questions[questionIndex];
  const progress = stage === "email" ? 100 : ((questionIndex + 1) / questions.length) * 100;
  const selectedOption = activeQuestion ? answers[activeQuestion.id] : undefined;

  const previewImages = useMemo(() => {
    const atlas = initialQuestions[0]?.atlasPath;
    return [0, 1, 2, 3].map((index) => ({ atlas, index }));
  }, [initialQuestions]);

  function startQuiz() {
    setStage("quiz");
    setQuestionIndex(0);
    track("quiz_started", 1);
    track("question_viewed", 1, questions[0]?.id);
  }

  function chooseAnswer(scoreKey: TraitKey, optionLabel: string) {
    if (!activeQuestion) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: scoreKey }));
    track("answer_selected", questionIndex + 1, activeQuestion.id, optionLabel);
  }

  function continueQuiz() {
    if (!selectedOption) return;
    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      track("question_viewed", nextIndex + 1, questions[nextIndex]?.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStage("email");
    track("email_gate_viewed", questions.length + 1);
  }

  async function unlockResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const nextResult = calculateResult(answers);
    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          marketingConsent,
          answers,
          resultType: nextResult.key,
          source: attribution.source,
          campaign: attribution.campaign,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(nextResult);
      setStage("result");
      track("result_viewed", questions.length + 2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "intro") {
    return (
      <main className="landing-shell">
        <nav className="nav-bar" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Inner Atlas home">
            <span className="brand-mark">IA</span>
            <span>Inner Atlas</span>
          </a>
          <span className="nav-note">A 2-minute visual reflection</span>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="pill">Visual personality test · 4 questions</span>
            <h1>Don’t explain yourself.<br />Choose what pulls you in.</h1>
            <p className="hero-lede">
              Your first instinct can reveal how you move through possibility,
              connection, structure, and creativity.
            </p>
            <button className="primary-button hero-cta" onClick={startQuiz}>
              Discover my type <span aria-hidden="true">↗</span>
            </button>
            <div className="trust-row" aria-label="Test details">
              <span>No right answers</span><i />
              <span>Private by design</span><i />
              <span>2 min</span>
            </div>
          </div>

          <div className="hero-mosaic" aria-label="A preview of four visual choices">
            {previewImages.map((item) => (
              <div
                className={`atlas-image atlas-${item.index}`}
                key={item.index}
                style={{ backgroundImage: `url(${item.atlas})` }}
              />
            ))}
            <div className="mosaic-prompt">Which one feels like you?</div>
          </div>
        </section>

        <section className="how-it-works">
          <span>01 · Notice</span>
          <p>Let your eyes land before your reasoning catches up.</p>
          <span>02 · Choose</span>
          <p>Pick the image that creates the strongest first response.</p>
          <span>03 · Reveal</span>
          <p>Get a concise profile with strengths, blind spots, and a next step.</p>
        </section>

        <footer className="site-footer">
          <span>Inner Atlas © 2026</span>
          <span>For self-reflection, not clinical diagnosis.</span>
          <Link href="/admin">Admin</Link>
        </footer>
      </main>
    );
  }

  if (stage === "quiz" && activeQuestion) {
    return (
      <main className="quiz-shell">
        <header className="quiz-header">
          <button className="brand brand-button" onClick={() => setStage("intro")}>
            <span className="brand-mark">IA</span><span>Inner Atlas</span>
          </button>
          <div className="progress-copy">
            <span>Question {questionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </header>

        <section className="question-section">
          <div className="question-heading">
            <span>{activeQuestion.kicker}</span>
            <h1>{activeQuestion.prompt}</h1>
            <p>There’s no correct choice. Notice your first emotional response.</p>
          </div>

          <div className="option-grid" role="radiogroup" aria-label={activeQuestion.prompt}>
            {activeQuestion.options.map((option, index) => {
              const selected = selectedOption === option.scoreKey;
              return (
                <button
                  aria-checked={selected}
                  className={`option-card ${selected ? "selected" : ""}`}
                  key={`${activeQuestion.id}-${index}`}
                  onClick={() => chooseAnswer(option.scoreKey, option.label)}
                  role="radio"
                >
                  <span
                    className={`option-image atlas-image atlas-${index}`}
                    style={{ backgroundImage: `url(${activeQuestion.atlasPath})` }}
                  />
                  <span className="option-meta">
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span><strong>{option.label}</strong><small>{option.microcopy}</small></span>
                    <span className="selection-mark" aria-hidden="true">✓</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="quiz-actions">
            <button
              className="text-button"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
            >
              ← Back
            </button>
            <button className="primary-button" disabled={!selectedOption} onClick={continueQuiz}>
              {questionIndex === questions.length - 1 ? "See my result" : "Continue"} →
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (stage === "email") {
    return (
      <main className="gate-shell">
        <section className="email-gate">
          <div className="result-teaser">
            <span className="result-seal">Profile found</span>
            <div className="blurred-result">
              <span>Your instinctive style</span>
              <h2>{calculateResult(answers).title}</h2>
              <p>{calculateResult(answers).summary}</p>
            </div>
          </div>
          <form className="email-form" onSubmit={unlockResult}>
            <span className="pill">Your result is ready</span>
            <h1>Where should we send your reveal?</h1>
            <p>Enter your email to unlock the full profile on this screen.</p>
            <label htmlFor="email">Email address</label>
            <input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            <label className="consent-row">
              <input
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                type="checkbox"
              />
              <span>Send me occasional reflection prompts and new tests. Unsubscribe anytime.</span>
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button full-button" disabled={submitting} type="submit">
              {submitting ? "Opening your profile…" : "Unlock my result →"}
            </button>
            <small className="privacy-note">We use your email to deliver this result. Marketing is optional.</small>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="result-shell">
      <nav className="nav-bar">
        <Link className="brand" href="/"><span className="brand-mark">IA</span><span>Inner Atlas</span></Link>
        <button className="text-button" onClick={() => window.print()}>Save profile</button>
      </nav>
      {result ? (
        <article className="result-card">
          <div className={`result-orbit result-${result.key}`}><span>{result.key.slice(0, 1).toUpperCase()}</span></div>
          <span className="result-eyebrow">{result.eyebrow}</span>
          <h1>{result.title}</h1>
          <p className="result-summary">{result.summary}</p>
          <div className="insight-grid">
            <section><span>Natural strength</span><p>{result.strength}</p></section>
            <section><span>Watch for</span><p>{result.watchout}</p></section>
            <section><span>Try this next</span><p>{result.nextStep}</p></section>
          </div>
        </article>
      ) : null}

      <section className="premium-card">
        <div>
          <span className="premium-label">Coming next · Deep report</span>
          <h2>Turn your type into a practical personal map.</h2>
          <p>Expanded patterns, relationship dynamics, stress signals, and a 7-day action guide.</p>
        </div>
        <button
          className="premium-button"
          onClick={() => {
            setShowUpgrade(true);
            track("upgrade_clicked", questions.length + 3);
          }}
        >
          Preview full report <span>↗</span>
        </button>
      </section>

      <button className="retake-button" onClick={() => window.location.assign("/")}>Retake the test</button>

      {showUpgrade ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}>
          <div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>×</button>
            <span className="result-seal">Premium preview</span>
            <h2 id="upgrade-title">Your deeper report is almost here.</h2>
            <p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p>
            <div className="premium-list"><span>✓ 12-page personalized report</span><span>✓ Relationships and stress patterns</span><span>✓ 7-day practical reset</span></div>
            <button className="primary-button full-button" disabled>Checkout coming soon</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
