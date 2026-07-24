"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateResult,
  defaultQuestions,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";
import { getDeepResultContent } from "@/lib/deep-results";
import { validateEmailAddress } from "@/lib/email-validation";
import {
  getDimensionProgress,
  recommendNextTest,
  TEST_DIMENSIONS,
  type InnerProfileSummary,
} from "@/lib/inner-map";import {
  RELATIONSHIP_TYPES,
  type RelationshipNode,
  type RelationshipType,
} from "@/lib/relationship-network";

type Stage = "home" | "detail" | "quiz" | "email" | "result";
type InsightReaction = "accurate" | "not_quite" | "more";

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

// Kept intact for a future relaunch; the current public flow focuses on individual tests.
const RELATIONSHIP_NETWORK_ENABLED = false;

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

function InnerMap({ completedTestIds, compact = false }: { completedTestIds: string[]; compact?: boolean }) {
  const dimensions = getDimensionProgress(completedTestIds);
  const unlocked = dimensions.filter((dimension) => dimension.unlocked).length;
  return (
    <section className={`inner-map ${compact ? "inner-map-compact" : ""}`} aria-label="Your six-part Inner Map">
      <header><span>Your evolving profile</span><h2>Your Inner Map</h2><p>Each visual exploration adds evidence to one part of the person you are becoming.</p></header>
      <div className="inner-map-board">
        <div className="inner-map-core"><strong>{unlocked}<small>/ 6</small></strong><span>dimensions discovered</span></div>
        {dimensions.map((dimension, index) => (
          <article className={`inner-map-node inner-map-node-${index + 1} ${dimension.unlocked ? "is-unlocked" : ""}`} key={dimension.id}>
            <i>{dimension.unlocked ? "✓" : String(index + 1).padStart(2, "0")}</i>
            <div><strong>{dimension.label}</strong><span>{dimension.unlocked ? `${dimension.completedCount}/${dimension.testCount} reflections` : "Not explored yet"}</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}
function RelationshipNetwork({
  relationships,
  loading,
  onCreate,
  onExplore,
}: {
  relationships: RelationshipNode[];
  loading: boolean;
  onCreate: (nickname: string, relationshipType: RelationshipType) => Promise<boolean>;
  onExplore: (relationship: RelationshipNode) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [nickname, setNickname] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("partner");
  const [saving, setSaving] = useState(false);

  async function addRelationship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);
    const created = await onCreate(nickname.trim(), relationshipType);
    setSaving(false);
    if (created) {
      setNickname("");
      setAdding(false);
    }
  }

  return (
    <section className="relationship-network" aria-labelledby="relationship-network-title">
      <header className="relationship-network-heading">
        <div><span>Your private relationship map</span><h2 id="relationship-network-title">See how your connections feel from the inside.</h2><p>Use a nickname only. This map reflects your experience in a relationship—it does not judge or diagnose the other person.</p></div>
        <button className="relationship-add-button" onClick={() => setAdding((current) => !current)} type="button">{adding ? "Close" : "Add someone"} <span>＋</span></button>
      </header>

      {adding ? <form className="relationship-form" onSubmit={addRelationship}>
        <label htmlFor="relationship-nickname">What should we call this connection?</label>
        <input autoComplete="off" id="relationship-nickname" maxLength={48} onChange={(event) => setNickname(event.target.value)} placeholder="e.g. Mom, Sam, my manager" required value={nickname} />
        <fieldset><legend>Relationship type</legend><div>{RELATIONSHIP_TYPES.map((type) => <button className={relationshipType === type.id ? "active" : ""} key={type.id} onClick={() => setRelationshipType(type.id)} type="button">{type.label}</button>)}</div></fieldset>
        <button className="primary-button" disabled={saving} type="submit">{saving ? "Adding…" : "Add to my map →"}</button>
      </form> : null}

      <div className="relationship-network-board">
        <div className="relationship-network-core"><span>YOU</span><strong>{relationships.length}</strong><small>{relationships.length === 1 ? "connection" : "connections"}</small></div>
        {relationships.length ? relationships.slice(0, 6).map((relationship, index) => <article className={`relationship-network-node relationship-network-node-${index + 1}`} key={relationship.id}>
          <span>{RELATIONSHIP_TYPES.find((type) => type.id === relationship.relationshipType)?.label ?? "Connection"}</span>
          <h3>{relationship.nickname}</h3>
          <p>{relationship.reflectionCount ? `${relationship.exploredDimensionIds.length}/6 dimensions explored · ${relationship.reflectionCount} reflection${relationship.reflectionCount === 1 ? "" : "s"}` : "Ready for a first reflection"}</p>
          <button disabled={loading} onClick={() => onExplore(relationship)} type="button">{relationship.reflectionCount ? "Continue exploring →" : "Explore this connection →"}</button>
        </article>) : <div className="relationship-network-empty"><strong>Your map starts with one honest connection.</strong><p>Add someone important using a nickname—no contacts, no real name required.</p></div>}
      </div>
      <p className="relationship-network-note">You can add, explore, and later remove individual connections. Nothing here is shared with the person you name.</p>
    </section>
  );
}
export function QuizApp({ initialTests, initialTestId }: { initialTests: QuizTest[]; initialTestId?: string }) {
  const [tests, setTests] = useState(initialTests);
  const [selectedTest, setSelectedTest] = useState<QuizTest | null>(() => initialTestId ? initialTests.find((test) => test.id === initialTestId) ?? null : null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stage, setStage] = useState<Stage>(initialTestId ? "detail" : "home");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraitKey>>({});
  const [answerChoices, setAnswerChoices] = useState<Record<string, number>>({});
  const [insightReactions, setInsightReactions] = useState<Record<string, InsightReaction>>({});
  const [profile, setProfile] = useState<InnerProfileSummary>({ completedTestIds: [] });  const [relationships, setRelationships] = useState<RelationshipNode[]>([]);
  const [relationshipContext, setRelationshipContext] = useState<RelationshipNode | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");
  const [email, setEmail] = useState("");
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
  const insightRef = useRef<HTMLElement | null>(null);
  const [attribution] = useState(() =>
    typeof window === "undefined" ? { source: "direct", campaign: "" } : getAttribution(),
  );

  const loadQuestions = useCallback(async (testId: string) => {
    const cached = questionsCache.current.get(testId);
    if (cached?.length) return cached;
    const pending = questionRequests.current.get(testId);
    if (pending) return pending;
    const request = (async () => {
      const fallbackQuestions = defaultQuestions
        .filter((question) => question.testId === testId && question.active)
        .sort((a, b) => a.position - b.position);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(`/api/questions?test=${encodeURIComponent(testId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { error?: string; questions?: QuizQuestion[] };
        if (!response.ok || !data.questions?.length) {
          throw new Error(data.error ?? "This test is not available yet.");
        }
        questionsCache.current.set(testId, data.questions);
        return data.questions;
      } catch (requestError) {
        if (!fallbackQuestions.length) throw requestError;
        questionsCache.current.set(testId, fallbackQuestions);
        return fallbackQuestions;
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    questionRequests.current.set(testId, request);
    try {
      return await request;
    } finally {
      questionRequests.current.delete(testId);
    }
  }, []);

  const loadRelationships = useCallback(async () => {
    try {
      const response = await fetch("/api/relationships", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; relationships?: RelationshipNode[] };
      if (!response.ok) throw new Error(data.error ?? "Unable to load your relationship map.");
      setRelationships(data.relationships ?? []);
    } catch {
      setRelationships([]);
    }
  }, []);

  async function createRelationship(nickname: string, relationshipType: RelationshipType) {
    setRelationshipLoading(true);
    setRelationshipError("");
    try {
      const response = await fetch("/api/relationships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname, relationshipType }),
      });
      const data = (await response.json()) as { error?: string; relationship?: RelationshipNode };
      if (!response.ok || !data.relationship) throw new Error(data.error ?? "Unable to add this connection.");
      setRelationships((current) => [data.relationship!, ...current]);
      track("relationship_added", 0, undefined, relationshipType);
      return true;
    } catch (createError) {
      setRelationshipError(createError instanceof Error ? createError.message : "Unable to add this connection.");
      return false;
    } finally {
      setRelationshipLoading(false);
    }
  }

  useEffect(() => {
    if (!RELATIONSHIP_NETWORK_ENABLED) return;
    const refresh = window.setTimeout(() => {
      void loadRelationships();
    }, 0);
    return () => window.clearTimeout(refresh);
  }, [loadRelationships]);
  useEffect(() => {
    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: InnerProfileSummary | null) => {
        if (!data?.completedTestIds) return;
        setProfile(data);
        if (data.email) setEmail(data.email);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    void fetch("/api/tests", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.tests?.length) { setTests(data.tests); if (initialTestId) setSelectedTest(data.tests.find((test: QuizTest) => test.id === initialTestId) ?? null); }
      })
      .catch(() => undefined);
  }, [initialTestId]);

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
  const selectedOption = activeQuestion && selectedOptionIndex !== undefined ? activeQuestion.options[selectedOptionIndex] : undefined;
  const selectedReaction = activeQuestion ? insightReactions[activeQuestion.id] : undefined;
  const completedTestIds = profile.completedTestIds;
  const mapDimensions = getDimensionProgress(completedTestIds);
  const unlockedDimensions = mapDimensions.filter((dimension) => dimension.unlocked).length;
  const recommendedTest = recommendNextTest(tests, completedTestIds, selectedTest?.id);

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
    if (stage !== "quiz" || selectedOptionIndex === undefined) return;
    const timer = window.setTimeout(() => insightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    return () => window.clearTimeout(timer);
  }, [questionIndex, selectedOptionIndex, stage]);

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

  function detailHref(test: QuizTest) {
    const query = typeof window === "undefined" ? "" : window.location.search;
    return `/tests/${encodeURIComponent(test.id)}${query}`;
  }

  function prepareDetail(test: QuizTest) {
    preloadAtlas(test.coverAtlasPath);
    void loadQuestions(test.id).catch(() => undefined);
  }

  function openDetail(test: QuizTest) {
    prepareDetail(test);
    window.location.assign(detailHref(test));
  }
  async function startTest(test: QuizTest, relationship?: RelationshipNode) {
    setLoadingTest(test.id);
    setError("");
    try {
      const builtInQuestions = defaultQuestions
        .filter((question) => question.testId === test.id && question.active)
        .sort((a, b) => a.position - b.position);
      const loadedQuestions = questionsCache.current.get(test.id) ?? builtInQuestions;
      const readyQuestions = loadedQuestions.length ? loadedQuestions : await loadQuestions(test.id);
      if (!questionsCache.current.has(test.id)) {
        void loadQuestions(test.id).catch(() => undefined);
      }
      preloadAtlas(readyQuestions[0].atlasPath);
      const nextSession = crypto.randomUUID();
      setSessionId(nextSession);
      setSelectedTest(test);
      setQuestions(readyQuestions);
      setAnswers({});
      setAnswerChoices({});
      setInsightReactions({});
      setQuestionIndex(0);
      setResult(null);
      setRelationshipContext(relationship ?? null);
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
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "question_viewed", step: 1, questionId: readyQuestions[0].id }) });
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
    setInsightReactions((current) => {
      const next = { ...current };
      delete next[activeQuestion.id];
      return next;
    });
    track("answer_selected", questionIndex + 1, activeQuestion.id, optionLabel);
  }

  function reactToInsight(reaction: InsightReaction) {
    if (!activeQuestion || !selectedOption) return;
    setInsightReactions((current) => ({ ...current, [activeQuestion.id]: reaction }));
    const eventName = reaction === "accurate" ? "insight_accurate" : reaction === "not_quite" ? "insight_not_quite" : "insight_more";
    track(eventName, questionIndex + 1, activeQuestion.id, selectedOption.label);
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
    const emailValidation = validateEmailAddress(profile.email ?? email);
    if (!emailValidation.valid) {
      setError(emailValidation.message);
      return;
    }
    const emailToSave = emailValidation.normalized;
    setError("");
    const nextResult = calculateResult(answers, selectedTest.results);    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          testId: selectedTest.id,
          email: emailToSave,
          marketingConsent: false,
          answers,
          resultType: nextResult.key,
          source: attribution.source,
          campaign: attribution.campaign,
          relationshipId: relationshipContext?.id,
        }),
      });
      const data = (await response.json()) as { error?: string; profile?: InnerProfileSummary };
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.email) setEmail(data.profile.email);
      }
      if (relationshipContext) void loadRelationships();
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
    setInsightReactions({});
    setSessionId("");
    setEmail("");
    setError("");
    setZoomedOption(null);
    setRelationshipContext(null);
    setRelationshipError("");
    window.history.replaceState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (stage === "detail") {
    if (!selectedTest) return <main className="detail-loading"><span className="brand-mark">DP</span><p>Finding this visual test…</p></main>;
    const detailQuestion = defaultQuestions.find((question) => question.testId === selectedTest.id && question.position === 1);
    const detailPrompt = detailQuestion?.prompt ?? "Which image pulls you in before you can explain why?";
    return (
      <main className="test-detail-shell">
        <nav className="nav-bar" aria-label="Main navigation"><Link className="brand" href="/"><span className="brand-mark">DP</span><span>DeepPersona AI</span></Link><Link className="nav-note nav-link" href="/#tests">All visual tests ↓</Link></nav>
        <section className="detail-stage" style={{ "--test-accent": selectedTest.accent } as React.CSSProperties}>
          <div className="detail-gallery" aria-label="Four visual choices preview">
            {[0, 1, 2, 3].map((index) => <AtlasImage index={index} key={index} loading="eager" path={selectedTest.coverAtlasPath} priority={index === 0} sizes="(max-width: 640px) 50vw, 340px" />)}
            <span className="detail-gallery-tag">Choose the one you feel first</span>
          </div>
          <div className="detail-story">
            <span className="detail-category">{selectedTest.kicker}</span>
            <p className="detail-count">4 visual choices · about 2 minutes</p>
            <h1>{detailPrompt}</h1>
            <p className="detail-intro">There is no right answer. The image you reach for first can reveal the pattern you use before words catch up.</p>
            <div className="detail-reveal"><span>YOUR REFLECTION WILL EXPLORE</span><div><p>What your first instinct is trying to protect.</p><p>How this pattern shapes closeness, stress, or boundaries.</p><p>The strength hidden inside the response you repeat.</p></div></div>
            <button className="primary-button detail-cta" disabled={loadingTest === selectedTest.id} onClick={() => void startTest(selectedTest)}>{loadingTest === selectedTest.id ? "Opening…" : "See what your first choice reveals"} <span aria-hidden="true">→</span></button>
            <div className="detail-assurance"><span>Free visual test</span><i /> <span>Private by design</span>{selectedTest.reportPriceCents > 0 ? <><i /> <span>Full report available for ${(selectedTest.reportPriceCents / 100).toFixed(2)}</span></> : null}</div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </div>
        </section>
        <footer className="site-footer"><div><strong>DeepPersona AI © 2026</strong></div><nav aria-label="Legal links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds & delivery</Link><Link href="/contact">Contact</Link></nav></footer>
      </main>
    );
  }
  if (stage === "home") {
    return (
      <main className="landing-shell">
        <nav className="nav-bar" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="DeepPersona AI home"><span className="brand-mark">DP</span><span>DeepPersona AI</span></a>
          <a className="nav-note nav-link" href="#tests">Explore 8 visual tests ↓</a>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="pill">Visual psychology tests · 2 minutes</span>
            <h1>One image can say what words miss.</h1>
            <p className="hero-lede">Choose what pulls you in. Get a concise reflection on how you connect, reset, set boundaries, and move through relationships.</p>
            {featuredTest ? <button className="primary-button hero-cta" disabled={loadingTest === featuredTest.id} onClick={() => openDetail(featuredTest)}>{loadingTest === featuredTest.id ? "Opening…" : "Explore the most popular test"} <span aria-hidden="true">↗</span></button> : null}            <div className="trust-row" aria-label="Test details"><span>No right answers</span><i /><span>Private by design</span><i /><span>4 visual choices</span></div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </div>

          <button className="hero-mosaic" aria-label={featuredTest ? `Start ${featuredTest.title}` : "A preview of four visual choices"} disabled={!featuredTest || loadingTest === featuredTest.id} onClick={() => featuredTest && openDetail(featuredTest)} type="button">
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

        {completedTestIds.length ? <>
          <section className="returning-profile">
            <div className="returning-profile-copy"><span>Welcome back</span><h2>Your map remembers where you left off.</h2><p>{unlockedDimensions} of 6 dimensions discovered. One short reflection is enough to keep building.</p>{recommendedTest ? <button className="primary-button" onClick={() => openDetail(recommendedTest)} type="button">Continue with {recommendedTest.title} →</button> : null}</div>
            <InnerMap compact completedTestIds={completedTestIds} />
          </section>
          {RELATIONSHIP_NETWORK_ENABLED ? <>
            <RelationshipNetwork
              loading={relationshipLoading}
              onCreate={createRelationship}
              onExplore={(relationship) => featuredTest && void startTest(featuredTest, relationship)}
              relationships={relationships}
            />
            {relationshipError ? <p className="relationship-error" role="alert">{relationshipError}</p> : null}
          </> : null}
        </> : null}        <section className="test-library" id="tests">
          <div className="library-heading"><span>Choose your question</span><h2>Eight ways to understand yourself a little better.</h2><p>Short, visual, and designed for reflection—not diagnosis.</p></div>
          <div className="test-card-grid">
            {tests.map((test, index) => (
              <button aria-label={`View details for ${test.title}`} className={`test-card ${test.featured ? "featured" : ""}`} disabled={loadingTest === test.id} key={test.id} onClick={() => openDetail(test)} onFocus={() => prepareDetail(test)} onPointerEnter={() => prepareDetail(test)} style={{ "--test-accent": test.accent } as React.CSSProperties} type="button">
                <div className="test-card-image">
                  <AtlasImage index={0} path={test.coverAtlasPath} sizes="(max-width: 640px) 236px, 380px" />
                  <span className="test-number">{String(index + 1).padStart(2, "0")}</span>
                  {test.featured ? <span className="popular-badge">Most popular</span> : null}
                </div>
                <div className="test-card-copy"><span>{test.kicker}</span><h3>{test.title}</h3><p>{test.description}</p><div><small>{test.questionCount || 4} questions{test.reportPriceCents > 0 ? <><br /><em className="test-report-price">Full report ${(test.reportPriceCents / 100).toFixed(2)}</em></> : null}</small><strong className="test-card-start">{loadingTest === test.id ? "Opening…" : "Explore →"}</strong></div></div>
              </button>
            ))}
          </div>
        </section>

        <section className="how-it-works"><span>01 · Notice</span><p>Let your eyes land before your reasoning catches up.</p><span>02 · Choose</span><p>Pick the image that creates the strongest first response.</p><span>03 · Reveal</span><p>Get your type, strength, watchout, and a practical next step.</p></section>
        <footer className="site-footer site-footer-expanded"><div><strong>DeepPersona AI © 2026</strong><span>For self-reflection, not clinical diagnosis.</span></div><nav aria-label="Legal and support links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds & delivery</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/contact">Contact</Link></nav></footer>
      </main>
    );
  }

  if (stage === "quiz" && activeQuestion && selectedTest) {
    return (
      <main className="quiz-shell">
        <header className="quiz-header">
          <button className="brand brand-button" onClick={returnHome}><span className="brand-mark">DP</span><span>DeepPersona AI</span></button>
          <div className="progress-copy"><span>{relationshipContext ? `With ${relationshipContext.nickname} · ${selectedTest.title}` : selectedTest.title} · {questionIndex + 1} of {questions.length}</span><span>{Math.round(progress)}%</span></div>
          <div className="progress-track"><span style={{ width: `${progress}%`, background: selectedTest.accent }} /></div>
        </header>
        <section className="question-section">
          <div className="question-heading"><span>{relationshipContext ? `Thinking of ${relationshipContext.nickname}` : activeQuestion.kicker}</span><h1>{activeQuestion.prompt}</h1><p>{relationshipContext ? `Keep ${relationshipContext.nickname} in mind. Notice the first response this relationship brings up.` : "There is no correct choice. Notice your first emotional response."}</p></div>
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
          {selectedOption ? (
            <aside className="instant-insight" ref={(node) => { insightRef.current = node; }}>
              <span>Instant reflection</span>
              <h2>You chose “{selectedOption.label}”</h2>
              <p>{selectedOption.meaning}</p>
              {selectedReaction === "more" ? <div className="instant-insight-more"><strong>The deeper projection</strong><p>{selectedOption.projection}</p></div> : null}
              <div className="insight-reactions" aria-label="How accurate did this reflection feel?">
                <span>Does this feel like you?</span>
                <div>
                  <button className={selectedReaction === "accurate" ? "active" : ""} onClick={() => reactToInsight("accurate")} type="button">That feels accurate</button>
                  <button className={selectedReaction === "not_quite" ? "active" : ""} onClick={() => reactToInsight("not_quite")} type="button">Not quite</button>
                  <button className={selectedReaction === "more" ? "active" : ""} onClick={() => reactToInsight("more")} type="button">Tell me more</button>
                </div>
              </div>
              {selectedReaction && selectedReaction !== "more" ? <small>Thank you. Your response helps the next reflection fit you better.</small> : null}
            </aside>
          ) : null}
          <div className="quiz-actions"><button className="text-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Back</button><button className="primary-button" disabled={selectedOptionIndex === undefined} onClick={continueQuiz}>{questionIndex === questions.length - 1 ? "Save my Inner Map" : "Next reflection"} →</button></div>
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
            <span className="pill">{relationshipContext ? `A reflection with ${relationshipContext.nickname} is ready` : "Your first Inner Map discovery is ready"}</span>
            <h1>Save what you have uncovered.</h1>
            <p>{relationshipContext ? `Save this reflection to your private map of how this relationship feels from the inside.` : "You have already seen the meaning behind each choice. Save this dimension to your private DeepPersona profile and keep building your map over time."}</p>
            {profile.email ? <div className="saved-profile-email"><span>Saving this reflection to</span><strong>{profile.email}</strong></div> : <><label htmlFor="email">Email address</label><input aria-invalid={Boolean(error)} autoComplete="email" id="email" onBlur={(event) => { const validation = validateEmailAddress(event.target.value); if (!validation.valid) setError(validation.message); }} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="name@gmail.com" required type="email" value={email} /><small className="email-hint">Use an email you can access. Test, placeholder, and malformed addresses are not accepted.</small></>}            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button full-button" disabled={submitting} type="submit">{submitting ? "Saving your discovery…" : profile.email ? "Add this to my map →" : "Save my map and reveal my profile →"}</button>
            <small className="privacy-note">No password is needed on this device. By continuing, you acknowledge our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.</small>
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
      <nav className="nav-bar"><button className="brand brand-button" onClick={returnHome}><span className="brand-mark">DP</span><span>DeepPersona AI</span></button><button className="text-button" onClick={() => window.print()}>Save profile</button></nav>
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
          <p className="result-disclaimer">This is a self-reflection tool based on four visual choices, not a clinical assessment or diagnosis.</p>          {relationshipContext ? <section className="relationship-saved"><span>Relationship map updated</span><h2>This reflection now belongs to your connection with {relationshipContext.nickname}.</h2><p>It records your experience in this relationship, not a conclusion about the other person. Return to your map to keep adding context over time.</p></section> : null}

          <section className="map-unlock-copy"><span>New dimension added</span><h2>{TEST_DIMENSIONS[selectedTest.id] ? `${mapDimensions.find((dimension) => dimension.id === TEST_DIMENSIONS[selectedTest.id])?.label} is now part of your map.` : "Your Inner Map has started."}</h2><p>This is not a fixed label. Every future reflection adds context and can make the pattern more precise.</p></section>
          <InnerMap completedTestIds={completedTestIds} />
          {recommendedTest ? <section className="next-exploration" style={{ "--test-accent": recommendedTest.accent } as React.CSSProperties}><div><span>Recommended next</span><h2>{recommendedTest.title}</h2><p>{recommendedTest.description}</p></div><button className="primary-button" onClick={() => openDetail(recommendedTest)} type="button">Explore this dimension →</button></section> : null}
        </article>
      ) : null}
      <section className="premium-card"><div><span className="premium-label">Coming next · Cross-test report</span><h2>Connect your patterns across all eight tests.</h2><p>A combined projection map showing repeated choices, contradictions between profiles, and the situations that change your response.</p></div><button className="premium-button" onClick={() => { setShowUpgrade(true); track("upgrade_clicked", questions.length + 3); }}>Preview combined report <span>↗</span></button></section>
      <button className="retake-button" onClick={returnHome}>Return to my Inner Map</button>
      {showUpgrade ? <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}><div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>×</button><span className="result-seal">Premium preview</span><h2 id="upgrade-title">Your deeper report is almost here.</h2><p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p><div className="premium-list"><span>✓ Every choice explained in context</span><span>✓ Repeated relationship and stress signals</span><span>✓ Contradictions that reveal when your pattern changes</span></div><button className="primary-button full-button" disabled>Checkout coming soon</button><p className="checkout-legal">Future purchases will be subject to our <Link href="/terms">Terms</Link>, <Link href="/privacy">Privacy Policy</Link>, and <Link href="/refunds">Refund & Delivery Policy</Link>.</p></div></div> : null}
    </main>
  );
}
