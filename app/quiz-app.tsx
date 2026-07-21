"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateResult,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";
import { getDeepResultContent } from "@/lib/deep-results";

type Stage = "home" | "quiz" | "email" | "result";

type AtlasImageProps = {
  path: string;
  index: number;
  className?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  sizes?: string;
};

const optimizedAtlases: Record<string, { full: string; compact: string }> = {
  "/quiz/doors.png": { full: "/quiz/doors.webp", compact: "/quiz/doors-768.webp" },
  "/quiz/landscapes.png": { full: "/quiz/landscapes.webp", compact: "/quiz/landscapes-768.webp" },
  "/quiz/rooms.png": { full: "/quiz/rooms.webp", compact: "/quiz/rooms-768.webp" },
  "/quiz/symbols.png": { full: "/quiz/symbols.webp", compact: "/quiz/symbols-768.webp" },
};

function AtlasImage({
  path,
  index,
  className = "",
  loading = "lazy",
  priority = false,
  sizes = "(max-width: 640px) 360px, 600px",
}: AtlasImageProps) {
  const [loadedPath, setLoadedPath] = useState("");
  const optimized = optimizedAtlases[path];
  const loaded = loadedPath === path;
  const markLoaded = useCallback(() => setLoadedPath(path), [path]);
  const registerImage = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) markLoaded();
  }, [markLoaded]);

  return (
    <span className={`atlas-image atlas-${index} ${loaded ? "is-loaded" : "is-loading"} ${className}`.trim()} aria-hidden="true">
      <picture>
        {optimized ? <source sizes={sizes} srcSet={`${optimized.compact} 768w, ${optimized.full} 1254w`} type="image/webp" /> : null}
        <img
          alt=""
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height="1254"
          loading={loading}
          onLoad={markLoaded}
          ref={registerImage}
          sizes={sizes}
          src={path}
          width="1254"
        />
      </picture>
    </span>
  );
}

function preloadAtlas(path: string) {
  if (typeof window === "undefined") return;
  const optimized = optimizedAtlases[path];
  const image = new Image();
  image.decoding = "async";
  if (optimized) {
    image.srcset = `${optimized.compact} 768w, ${optimized.full} 1254w`;
    image.sizes = "(max-width: 640px) 360px, 600px";
    image.src = optimized.full;
  } else {
    image.src = path;
  }
  void image.decode().catch(() => undefined);
}

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
  const [answerChoices, setAnswerChoices] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTest, setLoadingTest] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultProfile | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [zoomedOption, setZoomedOption] = useState<{
    index: number;
    label: string;
    microcopy: string;
    scoreKey: TraitKey;
  } | null>(null);
  const [sessionId, setSessionId] = useState("");
  const questionsCache = useRef(new Map<string, QuizQuestion[]>());
  const questionRequests = useRef(new Map<string, Promise<QuizQuestion[]>>());
  const [attribution] = useState(() =>
    typeof window === "undefined" ? { source: "direct", campaign: "" } : getAttribution(),
  );

  const loadQuestions = useCallback(async (testId: string) => {
    const cached = questionsCache.current.get(testId);
    if (cached?.length) return cached;
    const pending = questionRequests.current.get(testId);
    if (pending) return pending;
    const request = (async () => {
      const response = await fetch(`/api/questions?test=${encodeURIComponent(testId)}`, { cache: "no-store" });
      const data = (await response.json()) as { error?: string; questions?: QuizQuestion[] };
      if (!response.ok || !data.questions?.length) {
        throw new Error(data.error ?? "This test is not available yet.");
      }
      questionsCache.current.set(testId, data.questions);
      return data.questions;
    })();
    questionRequests.current.set(testId, request);
    try {
      return await request;
    } finally {
      questionRequests.current.delete(testId);
    }
  }, []);

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
  const selectedOptionIndex = activeQuestion ? answerChoices[activeQuestion.id] : undefined;

  useEffect(() => {
    if (!featuredTest || stage !== "home") return;
    const timer = window.setTimeout(() => {
      void loadQuestions(featuredTest.id)
        .then((loadedQuestions) => {
          if (loadedQuestions[0]) preloadAtlas(loadedQuestions[0].atlasPath);
        })
        .catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [featuredTest, loadQuestions, stage]);

  useEffect(() => {
    if (stage !== "quiz") return;
    const nextQuestion = questions[questionIndex + 1];
    if (nextQuestion) preloadAtlas(nextQuestion.atlasPath);
  }, [questionIndex, questions, stage]);

  useEffect(() => {
    if (!zoomedOption) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomedOption(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [zoomedOption]);

  const previewImages = useMemo(() => {
    const atlas = featuredTest?.coverAtlasPath ?? "/quiz/doors.png";
    return [0, 1, 2, 3].map((index) => ({ atlas, index }));
  }, [featuredTest]);

  async function startTest(test: QuizTest) {
    setLoadingTest(test.id);
    setError("");
    try {
      const loadedQuestions = await loadQuestions(test.id);
      preloadAtlas(loadedQuestions[0].atlasPath);
      const nextSession = crypto.randomUUID();
      setSessionId(nextSession);
      setSelectedTest(test);
      setQuestions(loadedQuestions);
      setAnswers({});
      setAnswerChoices({});
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
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "question_viewed", step: 1, questionId: loadedQuestions[0].id }) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to open this test.");
    } finally {
      setLoadingTest("");
    }
  }

  function chooseAnswer(scoreKey: TraitKey, optionLabel: string, optionIndex: number) {
    if (!activeQuestion) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: scoreKey }));
    setAnswerChoices((current) => ({ ...current, [activeQuestion.id]: optionIndex }));
    track("answer_selected", questionIndex + 1, activeQuestion.id, optionLabel);
  }

  function continueQuiz() {
    if (selectedOptionIndex === undefined) return;
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
    setAnswerChoices({});
    setSessionId("");
    setEmail("");
    setMarketingConsent(false);
    setError("");
    setZoomedOption(null);
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
          </div>
        </section>

        <section className="test-library" id="tests">
          <div className="library-heading"><span>Choose your question</span><h2>Eight ways to understand yourself a little better.</h2><p>Short, visual, and designed for reflection—not diagnosis.</p></div>
          <div className="test-card-grid">
            {tests.map((test, index) => (
              <article className={`test-card ${test.featured ? "featured" : ""}`} key={test.id} style={{ "--test-accent": test.accent } as React.CSSProperties}>
                <div className="test-card-image">
                  <AtlasImage index={0} path={test.coverAtlasPath} sizes="(max-width: 640px) 236px, 380px" />
                  <span className="test-number">{String(index + 1).padStart(2, "0")}</span>
                  {test.featured ? <span className="popular-badge">Most popular</span> : null}
                </div>
                <div className="test-card-copy"><span>{test.kicker}</span><h3>{test.title}</h3><p>{test.description}</p><div><small>{test.questionCount || 4} questions · About 2 min</small><button aria-label={`Start ${test.title}`} disabled={loadingTest === test.id} onFocus={() => void loadQuestions(test.id).catch(() => undefined)} onPointerEnter={() => void loadQuestions(test.id).catch(() => undefined)} onTouchStart={() => void loadQuestions(test.id).catch(() => undefined)} onClick={() => void startTest(test)}>{loadingTest === test.id ? "…" : "Start →"}</button></div></div>
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
              const selected = selectedOptionIndex === index;
              const letter = String.fromCharCode(65 + index);
              return (
                <article className={`option-card ${selected ? "selected" : ""}`} key={`${activeQuestion.id}-${index}`}>
                  <button
                    aria-label={`Enlarge choice ${letter}: ${option.label}`}
                    className="option-image-trigger"
                    onClick={() => {
                      setZoomedOption({ index, label: option.label, microcopy: option.microcopy, scoreKey: option.scoreKey });
                      track("image_zoomed", questionIndex + 1, activeQuestion.id, option.label);
                    }}
                    type="button"
                  >
                    <AtlasImage className="option-image" index={index} loading="eager" path={activeQuestion.atlasPath} priority={index === 0} />
                    <span className="image-zoom-badge" aria-hidden="true">＋</span>
                  </button>
                  <button aria-checked={selected} className="option-select" onClick={() => chooseAnswer(option.scoreKey, option.label, index)} role="radio" type="button">
                    <span className="option-meta"><span className="option-letter">{letter}</span><span><strong>{option.label}</strong><small>{option.microcopy}</small></span><span className="selection-mark" aria-hidden="true">✓</span></span>
                  </button>
                </article>
              );
            })}
          </div>
          <div className="quiz-actions"><button className="text-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Back</button><button className="primary-button" disabled={selectedOptionIndex === undefined} onClick={continueQuiz}>{questionIndex === questions.length - 1 ? "See my result" : "Continue"} →</button></div>
        </section>
        {zoomedOption ? (
          <div className="image-lightbox-backdrop" role="presentation" onClick={() => setZoomedOption(null)}>
            <section aria-describedby="image-lightbox-description" aria-labelledby="image-lightbox-title" aria-modal="true" className="image-lightbox" onClick={(event) => event.stopPropagation()} role="dialog">
              <button aria-label="Close enlarged image" className="image-lightbox-close" onClick={() => setZoomedOption(null)} type="button">×</button>
              <div className="image-lightbox-visual">
                <AtlasImage className="image-lightbox-image" index={zoomedOption.index} loading="eager" path={activeQuestion.atlasPath} priority sizes="(max-width: 640px) 720px, 1100px" />
              </div>
              <div className="image-lightbox-copy">
                <div><span>Choice {String.fromCharCode(65 + zoomedOption.index)}</span><h2 id="image-lightbox-title">{zoomedOption.label}</h2><p id="image-lightbox-description">{zoomedOption.microcopy}</p></div>
                <button className="primary-button" onClick={() => { chooseAnswer(zoomedOption.scoreKey, zoomedOption.label, zoomedOption.index); setZoomedOption(null); }} type="button">Choose this image →</button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    );
  }

  if (stage === "email" && selectedTest) {
    const preview = calculateResult(answers, selectedTest.results);
    return (
      <main className="gate-shell">
        <section className="email-gate">
          <div className="result-teaser"><span className="result-seal">Profile found</span><div className="blurred-result"><span>{selectedTest.title}</span><h2>{preview.title}</h2><p>{preview.summary}</p></div></div>
          <form className="email-form" onSubmit={unlockResult}>
            <span className="pill">Your complete profile is ready</span>
            <h1>Unlock the full pattern behind your choices.</h1>
            <p>See every image you chose, what each choice represents, and the psychological projection behind the full pattern.</p>
            <label htmlFor="email">Email address</label>
            <input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
            <label className="consent-row">
              <input checked={marketingConsent} name="marketingConsent" onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" />
              <span><strong>Send me the Inner Atlas weekly reflection</strong><small>One practical prompt plus new visual tests by email. Optional, and you can unsubscribe anytime.</small></span>
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button full-button" disabled={submitting} type="submit">{submitting ? "Building your profile…" : "Reveal my full profile →"}</button>
            <small className="privacy-note">Your result unlock is not conditional on marketing consent.</small>
          </form>
        </section>
      </main>
    );
  }

  const deepResult = result && selectedTest ? getDeepResultContent(selectedTest.id, result) : null;
  const answeredChoices = questions.flatMap((question, index) => {
    const selectedIndex = answerChoices[question.id];
    const option = selectedIndex === undefined ? undefined : question.options[selectedIndex];
    return option ? [{ option, question, questionNumber: index + 1, selectedIndex }] : [];
  });

  return (
    <main className="result-shell">
      <nav className="nav-bar"><button className="brand brand-button" onClick={returnHome}><span className="brand-mark">IA</span><span>Inner Atlas</span></button><button className="text-button" onClick={() => window.print()}>Save profile</button></nav>
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
              <p>This is the part that shaped your result: not a generic type label, but the specific pattern behind each image you selected.</p>
            </header>
            <div className="choice-review-list">
              {answeredChoices.map(({ option, question, questionNumber, selectedIndex }) => (
                <article className="choice-review-card" key={question.id}>
                  <AtlasImage className="choice-review-image" index={selectedIndex} loading="eager" path={question.atlasPath} sizes="180px" />
                  <div className="choice-review-copy">
                    <div className="choice-review-meta"><span>Question {questionNumber}</span><strong>You chose {String.fromCharCode(65 + selectedIndex)}</strong></div>
                    <p className="choice-review-question">{question.prompt}</p>
                    <h3>{option.label}</h3>
                    <div><strong>What this choice represents</strong><p>{option.meaning}</p></div>
                    <div><strong>Your projection</strong><p>{option.projection}</p></div>
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
            <section><span>Core motivation</span><h3>What sits underneath the pattern</h3><p>{deepResult.depth.coreDrive}</p></section>
            <section><span>In relationships</span><h3>What other people may experience</h3><p>{deepResult.depth.inRelationships}</p></section>
            <section><span>Under pressure</span><h3>When the strength becomes protection</h3><p>{deepResult.depth.underPressure}</p></section>
          </div>

          <section className="reflection-card"><span>A question worth keeping</span><p>“{deepResult.lens.reflectionPrompt}”</p></section>
          <p className="result-disclaimer">This is a self-reflection tool based on four visual choices, not a clinical assessment or diagnosis.</p>
        </article>
      ) : null}
      <section className="premium-card"><div><span className="premium-label">Coming next · Cross-test report</span><h2>Connect your patterns across all eight tests.</h2><p>A combined projection map showing repeated choices, contradictions between profiles, and the situations that change your response.</p></div><button className="premium-button" onClick={() => { setShowUpgrade(true); track("upgrade_clicked", questions.length + 3); }}>Preview combined report <span>↗</span></button></section>
      <button className="retake-button" onClick={returnHome}>Explore another test</button>
      {showUpgrade ? <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}><div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>×</button><span className="result-seal">Premium preview</span><h2 id="upgrade-title">Your deeper report is almost here.</h2><p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p><div className="premium-list"><span>✓ Every choice explained in context</span><span>✓ Repeated relationship and stress signals</span><span>✓ Contradictions that reveal when your pattern changes</span></div><button className="primary-button full-button" disabled>Checkout coming soon</button></div></div> : null}
    </main>
  );
}
