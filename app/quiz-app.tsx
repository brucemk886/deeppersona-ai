"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateResult,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";

type Stage = "home" | "quiz" | "email" | "result";

function getAttribution() {
  if (typeof window === "undefined") return { source: "direct", campaign: "" };
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  let referrerHost = "";
  try {
    referrerHost = referrer ? new URL(referrer).hostname : "";
  } catch {
    referrerHost = "";
  }
  const source =
    params.get("utm_source") ||
    (params.get("ttclid") || referrerHost.includes("tiktok.com")
      ? "tiktok"
      : referrerHost || "direct");
  return { source, campaign: params.get("utm_campaign") ?? "" };
}

export function QuizApp({ initialTests }: { initialTests: QuizTest[] }) {
  const [tests, setTests] = useState(initialTests);
  const [selectedTest, setSelectedTest] = useState<QuizTest | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stage, setStage] = useState<Stage>("home");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraitKey>>({});
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTest, setLoadingTest] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultProfile | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [attribution] = useState(() =>
    typeof window === "undefined" ? { source: "direct", campaign: "" } : getAttribution(),
  );

  useEffect(() => {
    void fetch("/api/tests", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.tests?.length) setTests(data.tests);
      })
      .catch(() => undefined);
  }, []);

  const track = useCallback(
    (eventName: string, step = 0, questionId?: string, optionLabel?: string, overrideTestId?: string) => {
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
          testId: overrideTestId ?? selectedTest?.id,
        }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [attribution, selectedTest, sessionId],
  );

  useEffect(() => {
    if (!sessionId || stage === "home") return;
    const timer = window.setInterval(() => track("heartbeat"), 60_000);
    return () => window.clearInterval(timer);
  }, [sessionId, stage, track]);

  const featuredTest = tests.find((test) => test.featured) ?? tests[0];
  const activeQuestion = questions[questionIndex];
  const progress = stage === "email" ? 100 : questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0;
  const selectedOption = activeQuestion ? answers[activeQuestion.id] : undefined;

  const previewImages = useMemo(() => {
    const atlas = featuredTest?.coverAtlasPath ?? "/quiz/doors.png";
    return [0, 1, 2, 3].map((index) => ({ atlas, index }));
  }, [featuredTest]);

  async function startTest(test: QuizTest) {
    setLoadingTest(test.id);
    setError("");
    try {
      const response = await fetch(`/api/questions?test=${encodeURIComponent(test.id)}`, { cache: "no-store" });
      const data = (await response.json()) as { error?: string; questions?: QuizQuestion[] };
      if (!response.ok || !data.questions?.length) throw new Error(data.error ?? "This test is not available yet.");
      const nextSession = crypto.randomUUID();
      setSessionId(nextSession);
      setSelectedTest(test);
      setQuestions(data.questions);
      setAnswers({});
      setQuestionIndex(0);
      setResult(null);
      setStage("quiz");
      window.history.replaceState({}, "", `/?test=${encodeURIComponent(test.id)}`);
      const payload = {
        sessionId: nextSession,
        source: attribution.source,
        campaign: attribution.campaign,
        testId: test.id,
      };
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "session_started" }) });
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "quiz_started", step: 1 }) });
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "question_viewed", step: 1, questionId: data.questions[0].id }) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to open this test.");
    } finally {
      setLoadingTest("");
    }
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
    if (!selectedTest) return;
    setError("");
    const nextResult = calculateResult(answers, selectedTest.results);
    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          testId: selectedTest.id,
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

  function returnHome() {
    setStage("home");
    setSelectedTest(null);
    setQuestions([]);
    setAnswers({});
    setSessionId("");
    setEmail("");
    setError("");
    window.history.replaceState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (stage === "home") {
    return (
      <main className="landing-shell">
        <nav className="nav-bar" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Inner Atlas home"><span className="brand-mark">IA</span><span>Inner Atlas</span></a>
          <a className="nav-note nav-link" href="#tests">Explore 8 visual tests ↓</a>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="pill">Visual psychology tests · 2 minutes</span>
            <h1>One image can say what words miss.</h1>
            <p className="hero-lede">Choose what pulls you in. Get a concise reflection on how you connect, reset, set boundaries, and move through relationships.</p>
            {featuredTest ? <button className="primary-button hero-cta" disabled={loadingTest === featuredTest.id} onClick={() => void startTest(featuredTest)}>{loadingTest === featuredTest.id ? "Opening…" : "Start the most popular test"} <span aria-hidden="true">↗</span></button> : null}
            <div className="trust-row" aria-label="Test details"><span>No right answers</span><i /><span>Private by design</span><i /><span>4 visual choices</span></div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </div>

          <div className="hero-mosaic" aria-label="A preview of four visual choices">
            {previewImages.map((item) => <div className={`atlas-image atlas-${item.index}`} key={item.index} style={{ backgroundImage: `url(${item.atlas})` }} />)}
            <div className="mosaic-prompt">Which one feels safest?</div>
          </div>
        </section>

        <section className="test-library" id="tests">
          <div className="library-heading"><span>Choose your question</span><h2>Eight ways to understand yourself a little better.</h2><p>Short, visual, and designed for reflection—not diagnosis.</p></div>
          <div className="test-card-grid">
            {tests.map((test, index) => (
              <article className={`test-card ${test.featured ? "featured" : ""}`} key={test.id} style={{ "--test-accent": test.accent } as React.CSSProperties}>
                <div className="test-card-image">
                  <span className="atlas-image atlas-0" style={{ backgroundImage: `url(${test.coverAtlasPath})` }} />
                  <span className="test-number">{String(index + 1).padStart(2, "0")}</span>
                  {test.featured ? <span className="popular-badge">Most popular</span> : null}
                </div>
                <div className="test-card-copy"><span>{test.kicker}</span><h3>{test.title}</h3><p>{test.description}</p><div><small>{test.questionCount || 4} questions · About 2 min</small><button aria-label={`Start ${test.title}`} disabled={loadingTest === test.id} onClick={() => void startTest(test)}>{loadingTest === test.id ? "…" : "Start →"}</button></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="how-it-works"><span>01 · Notice</span><p>Let your eyes land before your reasoning catches up.</p><span>02 · Choose</span><p>Pick the image that creates the strongest first response.</p><span>03 · Reveal</span><p>Get your type, strength, watchout, and a practical next step.</p></section>
        <footer className="site-footer"><span>Inner Atlas © 2026</span><span>For self-reflection, not clinical diagnosis.</span><Link href="/admin">Admin</Link></footer>
      </main>
    );
  }

  if (stage === "quiz" && activeQuestion && selectedTest) {
    return (
      <main className="quiz-shell">
        <header className="quiz-header">
          <button className="brand brand-button" onClick={returnHome}><span className="brand-mark">IA</span><span>Inner Atlas</span></button>
          <div className="progress-copy"><span>{selectedTest.title} · {questionIndex + 1} of {questions.length}</span><span>{Math.round(progress)}%</span></div>
          <div className="progress-track"><span style={{ width: `${progress}%`, background: selectedTest.accent }} /></div>
        </header>
        <section className="question-section">
          <div className="question-heading"><span>{activeQuestion.kicker}</span><h1>{activeQuestion.prompt}</h1><p>There is no correct choice. Notice your first emotional response.</p></div>
          <div className="option-grid" role="radiogroup" aria-label={activeQuestion.prompt}>
            {activeQuestion.options.map((option, index) => {
              const selected = selectedOption === option.scoreKey;
              return <button aria-checked={selected} className={`option-card ${selected ? "selected" : ""}`} key={`${activeQuestion.id}-${index}`} onClick={() => chooseAnswer(option.scoreKey, option.label)} role="radio"><span className={`option-image atlas-image atlas-${index}`} style={{ backgroundImage: `url(${activeQuestion.atlasPath})` }} /><span className="option-meta"><span className="option-letter">{String.fromCharCode(65 + index)}</span><span><strong>{option.label}</strong><small>{option.microcopy}</small></span><span className="selection-mark" aria-hidden="true">✓</span></span></button>;
            })}
          </div>
          <div className="quiz-actions"><button className="text-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Back</button><button className="primary-button" disabled={!selectedOption} onClick={continueQuiz}>{questionIndex === questions.length - 1 ? "See my result" : "Continue"} →</button></div>
        </section>
      </main>
    );
  }

  if (stage === "email" && selectedTest) {
    const preview = calculateResult(answers, selectedTest.results);
    return (
      <main className="gate-shell">
        <section className="email-gate">
          <div className="result-teaser"><span className="result-seal">Profile found</span><div className="blurred-result"><span>{selectedTest.title}</span><h2>{preview.title}</h2><p>{preview.summary}</p></div></div>
          <form className="email-form" onSubmit={unlockResult}><span className="pill">Your result is ready</span><h1>Unlock your full reflection.</h1><p>Enter your email to reveal the complete profile on this screen.</p><label htmlFor="email">Email address</label><input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /><label className="consent-row"><input checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" /><span>Send me occasional reflection prompts and new tests. Unsubscribe anytime.</span></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button full-button" disabled={submitting} type="submit">{submitting ? "Opening your profile…" : "Unlock my result →"}</button><small className="privacy-note">We use your email to unlock this result. Marketing emails are optional.</small></form>
        </section>
      </main>
    );
  }

  return (
    <main className="result-shell">
      <nav className="nav-bar"><button className="brand brand-button" onClick={returnHome}><span className="brand-mark">IA</span><span>Inner Atlas</span></button><button className="text-button" onClick={() => window.print()}>Save profile</button></nav>
      {result && selectedTest ? <article className="result-card"><span className="result-test-name">{selectedTest.title}</span><div className={`result-orbit result-${result.key}`}><span>{result.key.slice(0, 1).toUpperCase()}</span></div><span className="result-eyebrow">{result.eyebrow}</span><h1>{result.title}</h1><p className="result-summary">{result.summary}</p><div className="insight-grid"><section><span>Natural strength</span><p>{result.strength}</p></section><section><span>Watch for</span><p>{result.watchout}</p></section><section><span>Try this next</span><p>{result.nextStep}</p></section></div></article> : null}
      <section className="premium-card"><div><span className="premium-label">Coming next · Deep report</span><h2>Turn this insight into a practical personal map.</h2><p>Expanded patterns, relationship dynamics, stress signals, and a 7-day action guide.</p></div><button className="premium-button" onClick={() => { setShowUpgrade(true); track("upgrade_clicked", questions.length + 3); }}>Preview full report <span>↗</span></button></section>
      <button className="retake-button" onClick={returnHome}>Explore another test</button>
      {showUpgrade ? <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}><div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>×</button><span className="result-seal">Premium preview</span><h2 id="upgrade-title">Your deeper report is almost here.</h2><p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p><div className="premium-list"><span>✓ Personalized deep-dive</span><span>✓ Relationships and stress patterns</span><span>✓ 7-day practical reset</span></div><button className="primary-button full-button" disabled>Checkout coming soon</button></div></div> : null}
    </main>
  );
}
