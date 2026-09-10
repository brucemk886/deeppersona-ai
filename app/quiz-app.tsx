"use client";

import Link from "next/link";
import { HomeLanding } from "@/app/_components/home-landing";
import { AttachmentResult } from "@/app/_components/attachment-result";
import { SceneCard, sceneKeyFromPath } from "@/app/_components/scene-card";
import { SiteFooter, SiteNav } from "@/app/_components/site-chrome";
import { ATTACHMENT_TEST_ID, PUBLIC_QUESTION_IDS, RETIRED_QUESTION_PROMPTS } from "@/lib/quiz-content";
import { currentAttribution } from "@/lib/traffic";
import { requestJson } from '@/lib/browser-request';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type QuizQuestion,
  type AffiliateProduct,
  type QuizTest,
  type ResultProfile,
} from "@/lib/quiz";
import type { ReportResponse } from "@/lib/payment-types";
import { validateEmailAddress } from "@/lib/email-validation";
import { trackGoogleAnalyticsEvent, trackQuizGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { getInsightCardsForTest } from "@/lib/insights-index";
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

function isPublicQuestion(question: QuizQuestion): boolean {
  return PUBLIC_QUESTION_IDS.has(question.id) && !RETIRED_QUESTION_PROMPTS.includes(question.prompt);
}

type Stage = "home" | "detail" | "quiz" | "email" | "result";

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
const RETURNING_MAP_ENABLED = false;
const RESULT_MAP_ENABLED = false;
const CROSS_TEST_REPORT_ENABLED = false;

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

function getAttribution() { return currentAttribution(); }

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
export function QuizApp({ initialTests, initialTestId, initialQuestions: defaultQuestions, initialReportId }: { initialTests: QuizTest[]; initialTestId?: string; initialQuestions: QuizQuestion[]; initialReportId?: string }) {
  const [tests, setTests] = useState(initialTests);
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);
  const [selectedTest, setSelectedTest] = useState<QuizTest | null>(() => initialTestId ? initialTests.find((test) => test.id === initialTestId) ?? null : null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stage, setStage] = useState<Stage>(initialReportId ? "result" : initialTestId ? "detail" : "home");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerChoices, setAnswerChoices] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<InnerProfileSummary>({ completedTestIds: [] });  const [relationships, setRelationships] = useState<RelationshipNode[]>([]);
  const [relationshipContext, setRelationshipContext] = useState<RelationshipNode | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [loadingTest, setLoadingTest] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultProfile | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(Boolean(initialReportId));
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const questionsCache = useRef(new Map<string, QuizQuestion[]>());
  const answerTransitionTimer = useRef<number | null>(null);
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
      const fallbackQuestions = defaultQuestions
        .filter((question) => question.testId === testId && question.active && isPublicQuestion(question))
        .sort((a, b) => a.position - b.position);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(`/api/questions?test=${encodeURIComponent(testId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { error?: string; questions?: QuizQuestion[] };
        const publicQuestions = (data.questions ?? []).filter(isPublicQuestion);
        if (!response.ok || !publicQuestions.length) {
          throw new Error(data.error ?? "This test is not available yet.");
        }
        questionsCache.current.set(testId, publicQuestions);
        return publicQuestions;
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
  }, [defaultQuestions]);

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
    if (stage !== 'result') return;
    void fetch("/api/affiliate-products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { products?: AffiliateProduct[] } | null) => setAffiliateProducts(data?.products ?? []))
      .catch(() => undefined);
  }, [stage]);
  useEffect(() => {
    // The server already supplied the current catalogue and prices on public landing pages.
    if (initialTests.length && !initialReportId) return;
    void fetch("/api/tests", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.tests?.length) { setTests(data.tests); if (initialTestId) setSelectedTest(data.tests.find((test: QuizTest) => test.id === initialTestId) ?? null); }
      })
      .catch(() => undefined);
  }, [initialTestId, initialReportId, initialTests.length]);

  const track = useCallback(
    (eventName: string, step = 0, questionId?: string, optionLabel?: string, overrideTestId?: string) => {
      if (!sessionId) return;
      trackQuizGoogleAnalyticsEvent(eventName, {
        test_id: overrideTestId ?? selectedTest?.id,
        step,
        traffic_source: attribution.source,
        campaign: attribution.campaign || undefined,
      });
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

  useEffect(() => () => {
    if (answerTransitionTimer.current) window.clearTimeout(answerTransitionTimer.current);
  }, []);
  useEffect(() => {
    if (!sessionId || stage === "home") return;
    const timer = window.setInterval(() => { if (!document.hidden) track("heartbeat"); }, 60_000);
    return () => window.clearInterval(timer);
  }, [sessionId, stage, track]);

  const refreshReport = useCallback(async (sync = false) => {
    if (!initialReportId) return false;
    const data = await requestJson<ReportResponse>(`/api/reports/${encodeURIComponent(initialReportId)}${sync ? "?sync=1" : ""}`, { cache: "no-store" });
    setReportData(data);
    setSelectedTest(data.test);
    setResult(data.result);
    setQuestions(data.questions ?? []);
    setAnswerChoices(data.answerChoices ?? {});
    setReportLoading(false);
    return data.unlocked;
  }, [initialReportId]);

  useEffect(() => {
    if (!initialReportId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const returning = new URLSearchParams(window.location.search).get("payment") === "success";
    const load = async () => {
      try {
        const unlocked = await refreshReport(returning);
        if (!stopped) setError('');
        if (!stopped && returning && !unlocked && ++attempts < 8) timer = setTimeout(() => void load(), 2500);
      } catch (loadError) {
        if (!stopped) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
          setReportLoading(false);
        }
      }
    };
    void load();
    return () => { stopped = true; clearTimeout(timer); };
  }, [initialReportId, refreshReport]);

  async function beginCheckout() {
    if (!reportData) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await requestJson<{ url?: string }>("/api/checkout", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId: reportData.id, expectedAmountCents: reportData.amountCents, expectedRefundPolicy: reportData.refundPolicy }) }, 25000);
      if (!data.url) throw new Error("Unable to open checkout.");
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error && (checkoutError.name === "TimeoutError" || checkoutError.name === "AbortError")
        ? "Checkout took too long to respond. Please try again. Your report is saved."
        : checkoutError instanceof Error ? checkoutError.message : "Unable to open checkout.");
      setSubmitting(false);
      void refreshReport().catch(() => undefined);
    }
  }

  const featuredTest = tests.find((test) => test.id === ATTACHMENT_TEST_ID)
    ?? tests.find((test) => test.featured)
    ?? tests[0];
  const activeQuestion = questions[questionIndex];
  const progress = stage === "email" ? 100 : questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0;
  const selectedOptionIndex = activeQuestion ? answerChoices[activeQuestion.id] : undefined;
  const completedTestIds = profile.completedTestIds;
  const mapDimensions = getDimensionProgress(completedTestIds);
  const recommendedTest = recommendNextTest(tests, completedTestIds, selectedTest?.id);

  useEffect(() => {
    if (!featuredTest || stage !== "home") return;
    const timer = window.setTimeout(() => {
      void loadQuestions(featuredTest.id)
        .then((loadedQuestions) => {
          const first = loadedQuestions[0];
          if (first && !sceneKeyFromPath(first.atlasPath)) preloadAtlas(first.atlasPath);
        })
        .catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [featuredTest, loadQuestions, stage]);

  useEffect(() => {
    if (stage !== "quiz") return;
    const nextQuestion = questions[questionIndex + 1];
    if (nextQuestion && !sceneKeyFromPath(nextQuestion.atlasPath)) preloadAtlas(nextQuestion.atlasPath);
  }, [questionIndex, questions, stage]);

  function detailHref(test: QuizTest, content?: string) {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    const source = currentAttribution();
    if (!params.has('utm_source') && source.source !== 'direct') params.set('utm_source', source.source);
    if (content && !params.get('utm_content')) params.set('utm_content', content.replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 120));
    const query = params.size ? '?' + params.toString() : '';
    return `/tests/${encodeURIComponent(test.id)}${query}`;
  }

  function prepareDetail(test: QuizTest) {
    if (!sceneKeyFromPath(test.coverAtlasPath)) preloadAtlas(test.coverAtlasPath);
    void loadQuestions(test.id).catch(() => undefined);
  }

  function openDetail(test: QuizTest, content?: string) {
    prepareDetail(test);
    window.location.assign(detailHref(test, content));
  }

  async function startTest(test: QuizTest, relationship?: RelationshipNode) {
    setLoadingTest(test.id);
    setError("");
    try {
      const readyQuestions = await loadQuestions(test.id);
      if (!readyQuestions.length) throw new Error("This quiz is being prepared. The older question set has been removed.");
      const firstScene = sceneKeyFromPath(readyQuestions[0].atlasPath);
      if (!firstScene) preloadAtlas(readyQuestions[0].atlasPath);
      const nextSession = crypto.randomUUID();
      setSessionId(nextSession);
      setSelectedTest(test);
      setQuestions(readyQuestions);
      setAnswerChoices({});
      setQuestionIndex(0);
      setResult(null);
      setRelationshipContext(relationship ?? null);
      setStage("quiz");
      const freshAttribution = currentAttribution();
      window.history.replaceState({}, "", `/?test=${encodeURIComponent(test.id)}`);
      const payload = {
        sessionId: nextSession,
        ...freshAttribution,
        testId: test.id,
      };
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "session_started" }) });
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "quiz_started", step: 1 }) });
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, eventName: "question_viewed", step: 1, questionId: readyQuestions[0].id }) });
      trackQuizGoogleAnalyticsEvent("quiz_started", { test_id: test.id, step: 1, traffic_source: attribution.source, campaign: attribution.campaign || undefined });
      trackQuizGoogleAnalyticsEvent("question_viewed", { test_id: test.id, step: 1, traffic_source: attribution.source, campaign: attribution.campaign || undefined });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to open this test.");
    } finally {
      setLoadingTest("");
    }
  }

  function chooseAnswer(optionLabel: string, optionIndex: number) {
    if (!activeQuestion || isAdvancing) return;
    setAnswerChoices((current) => ({ ...current, [activeQuestion.id]: optionIndex }));
    setIsAdvancing(true);
    track("answer_selected", questionIndex + 1, activeQuestion.id, optionLabel);
    answerTransitionTimer.current = window.setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        track("question_viewed", nextIndex + 1, questions[nextIndex]?.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStage("email");
        track("email_gate_viewed", questions.length + 1);
      }
      setIsAdvancing(false);
      answerTransitionTimer.current = null;
    }, 450);
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
    setSubmitting(true);
    try {
      const data = await requestJson<{ profile?: InnerProfileSummary; reportId?: string }>("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          testId: selectedTest.id,
          email: emailToSave,
          marketingConsent: false,
          answerChoices,
          source: attribution.source,
          campaign: attribution.campaign,
          relationshipId: relationshipContext?.id,
        }),
      });
      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.email) setEmail(data.profile.email);
      }
      if (relationshipContext) void loadRelationships();
      if (!data.reportId) throw new Error("Unable to save your report. Please try again.");
      window.location.assign(`/reports/${data.reportId}`);
      trackGoogleAnalyticsEvent("generate_lead", {
        method: "email_unlock",
        test_id: selectedTest.id,
        traffic_source: attribution.source,
        campaign: attribution.campaign || undefined,
      });
      track("result_viewed", questions.length + 2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function returnHome() {
    if (initialReportId) { window.location.assign("/"); return; }
    setStage("home");
    setSelectedTest(null);
    setQuestions([]);
    setAnswerChoices({});
    setSessionId("");
    setEmail("");
    setError("");
    setRelationshipContext(null);
    setRelationshipError("");
    window.history.replaceState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (initialReportId && !reportData) return <main className="detail-loading"><span className="brand-mark">DP</span><p role={error ? "alert" : "status"}>{error || (reportLoading ? "Loading your saved report…" : "Report unavailable.")}</p>{error && <button className="primary-button" disabled={reportLoading} onClick={async () => { setReportLoading(true); setError(''); try { await refreshReport(new URLSearchParams(window.location.search).get('payment') === 'success'); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your report. Please try again.'); } finally { setReportLoading(false); } }}>Try again</button>}<Link href="/">Back to tests</Link></main>;

    if (initialReportId && reportData && !reportData.unlocked) return (
    <main className="result-shell">
      <SiteNav active="quiz" />
      <article className="result-card result-card-expanded">
        <span className="result-test-name">{reportData.test.title}</span><span className="result-eyebrow">Your free summary</span>
        <h1>{reportData.result.title}</h1><p className="result-summary">{reportData.result.summary}</p>
        <AttachmentResult result={reportData.result} />
        <section className="report-paywall">
          <h2>Explore the meaning behind every choice</h2>
          <p>Your full reading includes each image you chose, its written interpretation, and a reflection prompt.</p><p className="service-context">For entertainment and self-reflection. Uses written interpretations for each selected image, not a validated psychological assessment or professional advice. <Link href="/disclaimer">How to use these results</Link></p>
          {reportData.sandbox ? <p className="sandbox-notice">Test checkout — no real money will be charged.</p> : null}
          {reportData.status === "refunded" ? <p>This purchase has been refunded. Full report access has ended.</p> : <>
            <p className="report-price">{reportData.amountCents === 0 ? "Free report" : `USD ${(reportData.amountCents / 100).toFixed(2)} · Optional full report`}</p>
            <p>For this test result only. No subscription or recurring charges. View your full report here after payment confirmation.</p>
            {reportData.amountCents > 0 && <p className="purchase-refund-notice">{reportData.refundPolicy === '14-day-2026-09-08' ? <>This order retains our original 14-day refund request policy. <Link href="/refunds/legacy-2026-09">Read your policy</Link></> : <>After successful delivery, no refunds for a change of mind or subjective dissatisfaction. Delivery failures, duplicate charges, material misdescription and legal rights are excepted. <Link href="/refunds">Read the refund policy</Link></>}</p>}
            <button className="primary-button full-button" disabled={submitting || (!reportData.checkoutReady && reportData.amountCents > 0)} onClick={() => void beginCheckout()}>{submitting ? "Opening checkout…" : reportData.amountCents === 0 ? "Open my full reading" : "Unlock my full reading →"}</button>
            {!reportData.checkoutReady && reportData.amountCents > 0 ? <p>Checkout is being set up. Your result is saved; please come back later.</p> : null}
          </>}
          {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "cancelled" ? <p>Checkout was cancelled. Your result is still saved.</p> : null}
          {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "success" ? <p role="status">Checking your payment. If your report has not opened yet, use the button below to check again.</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="text-button" onClick={() => { setError(""); void refreshReport(true).catch((err: Error) => setError(err.message)); }}>Check payment status</button>
          <p><Link href="/recover">Find my paid reports / Resend report email</Link></p><p className="checkout-legal">By purchasing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/refunds">Refund & Delivery Policy</Link>. See our <Link href="/privacy">Privacy Policy</Link>.</p>
          <p>After payment confirmation, we email a private report link to the address you provided with your test. You can use it on another browser. PDF downloads are not included. For help, contact <a href="mailto:bruce@deeppersonaai.com">bruce@deeppersonaai.com</a>.</p>
        </section>
      </article>
    </main>
  );

  if (stage === "detail") {
    if (!selectedTest) {
      return (
        <main className="test-detail-shell">
          <SiteNav active="quiz" />
          <section className="detail-stage">
            <div className="detail-story">
              <span className="detail-category">Quiz update</span>
              <h1>This older test is no longer offered.</h1>
              <p className="detail-intro">The previous question set has been removed. Take the free attachment quiz instead.</p>
              <Link className="primary-button detail-cta" href="/#quiz">Start the free quiz <span aria-hidden="true">→</span></Link>
            </div>
          </section>
          <SiteFooter />
        </main>
      );
    }
    const detailQuestion = defaultQuestions.find((question) => question.testId === selectedTest.id && question.position === 1 && isPublicQuestion(question));
    const detailPrompt = detailQuestion?.prompt ?? "Choose the scene that matches your first move.";
    const questionCount = defaultQuestions.filter((question) => question.testId === selectedTest.id && isPublicQuestion(question)).length;
    const previewScene = detailQuestion ? sceneKeyFromPath(detailQuestion.atlasPath) : "phone";
    const quizReady = questionCount > 0;
    return (
      <main className="test-detail-shell">
        <SiteNav active="quiz" />
        <section className="detail-stage" style={{ "--test-accent": selectedTest.accent } as React.CSSProperties}>
          <div className="detail-gallery" aria-label="Four visual choices preview">
            {previewScene
              ? [0, 1, 2, 3].map((index) => <SceneCard index={index} key={index} scene={previewScene} />)
              : [0, 1, 2, 3].map((index) => <AtlasImage index={index} key={index} loading="eager" path={selectedTest.coverAtlasPath} priority={index === 0} sizes="(max-width: 640px) 50vw, 340px" />)}
            <span className="detail-gallery-tag">Choose the one you feel first</span>
          </div>
          <div className="detail-story">
            <span className="detail-category">{selectedTest.kicker}</span>
            <p className="detail-count">{quizReady ? `${questionCount} image choices · about 3 minutes` : "This older item bank has been removed"}</p>
            <h1>{quizReady ? detailPrompt : "This quiz is being prepared."}</h1>
            <p className="detail-intro">{quizReady ? "There is no right answer. Pick the scene that matches your first move when closeness feels uncertain." : "The previous question set is no longer offered. Start the free attachment quiz when you are ready."}</p>
            <p className="service-context">For entertainment and self-reflection, not diagnosis or treatment. <Link href="/disclaimer">Read the limitations</Link></p>
            {quizReady ? <div className="detail-reveal"><span>YOUR FREE RESULT INCLUDES</span><div><p>A style label: anxious, avoidant, secure, or fearful-avoidant.</p><p>Short reads plus reaching and distance bars.</p><p>An optional written report if you want every scene unpacked.</p></div></div> : null}
            <button className="primary-button detail-cta" disabled={!quizReady || loadingTest === selectedTest.id} onClick={() => void startTest(selectedTest)}>{!quizReady ? "Quiz items coming next" : loadingTest === selectedTest.id ? "Opening…" : "Start the free quiz"} <span aria-hidden="true">→</span></button>
            <div className="detail-assurance"><span>Free visual test</span><i /> <span>Private by design</span>{selectedTest.reportPriceCents > 0 ? <><i /> <span>Optional report: USD {(selectedTest.reportPriceCents / 100).toFixed(2)}</span></> : null}</div>
            {selectedTest.reportPriceCents > 0 ? <p className="detail-purchase-note">The type is free. A longer reading is a one-time optional payment. No subscription.</p> : null}
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }
  if (stage === "home") {
    return (
      <HomeLanding
        error={error}
        featuredTest={featuredTest}
        loading={Boolean(loadingTest)}
        onStart={(test) => void startTest(test)}
      />
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
                <article className={`option-card ${selected ? "selected" : ""} ${isAdvancing && selected ? "is-confirming" : ""}`} key={`${activeQuestion.id}-${index}`}>
                  <button aria-label={`Choose ${letter}: ${option.label}`} className="option-image-trigger" disabled={isAdvancing} onClick={() => chooseAnswer(option.label, index)} type="button">
                    {sceneKeyFromPath(activeQuestion.atlasPath)
                      ? <SceneCard className="option-image" index={index} scene={sceneKeyFromPath(activeQuestion.atlasPath) ?? "phone"} />
                      : <AtlasImage className="option-image" index={index} loading="eager" path={activeQuestion.atlasPath} priority={index === 0} />}
                  </button>
                  <button aria-checked={selected} className="option-select" disabled={isAdvancing} onClick={() => chooseAnswer(option.label, index)} role="radio" type="button">
                    <span className="option-meta"><span className="option-letter">{letter}</span><span><strong>{option.label}</strong><small>{option.microcopy}</small></span><span className="selection-mark" aria-hidden="true">✓</span></span>
                  </button>
                </article>
              );
            })}
          </div>
          <div className="quiz-actions"><button className="text-button" disabled={questionIndex === 0 || isAdvancing} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Back</button></div>
        </section>

      </main>
    );
  }

  if (stage === "email" && selectedTest) {
    const preview = {title: selectedTest.title, summary: "Your choices are saved together in a personal reading."};
    return (
      <main className="gate-shell">
        <section className="email-gate">
          <div className="result-teaser"><span className="result-seal">Choices complete</span><div className="blurred-result"><span>{selectedTest.title}</span><h2>{preview.title}</h2><p>{preview.summary}</p></div></div>
          <form className="email-form" onSubmit={unlockResult}>
            <span className="pill">Your visual choices are complete</span>
            <h1>See your attachment style.</h1>
            <p>You have completed the image choices. Enter your email to save your result and see your free style, short reads, and bars. A longer written report is optional.</p>
            {profile.email ? <div className="saved-profile-email"><span>Saving this reflection to</span><strong>{profile.email}</strong></div> : <><label htmlFor="email">Email address</label><input aria-invalid={Boolean(error)} autoComplete="email" id="email" onBlur={(event) => { const validation = validateEmailAddress(event.target.value); if (!validation.valid) setError(validation.message); }} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="name@gmail.com" required type="email" value={email} /><small className="email-hint">Use an email you can access. Test, placeholder, and malformed addresses are not accepted.</small></>}            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button full-button" disabled={submitting} type="submit">{submitting ? "Saving your result…" : "See my result →"}</button>
            <small className="privacy-note">No password is needed on this device. By continuing, you acknowledge our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.</small>
          </form>
        </section>
      </main>
    );
  }

  const deepResult = reportData?.deepResult ?? null;
  const relatedInsights = selectedTest ? getInsightCardsForTest(selectedTest.id).slice(0, 2) : [];
  const answeredChoices = questions.flatMap((question, index) => {
    const selectedIndex = answerChoices[question.id];
    const option = selectedIndex === undefined ? undefined : question.options[selectedIndex];
    return option ? [{ option, question, questionNumber: index + 1, selectedIndex }] : [];
  });

  return (
    <main className="result-shell">
      <nav className="nav-bar"><button className="brand brand-button" onClick={returnHome}><span className="brand-mark">DP</span><span>DeepPersona AI</span></button><button className="text-button" onClick={() => window.print()}>Save report</button></nav>
      {result && selectedTest && deepResult ? (
        <article className="result-card result-card-expanded">
          <span className="result-test-name">{selectedTest.title}</span>
          <span className="result-basis">Based on {answeredChoices.length} visual choices</span>
          <span className="result-eyebrow">{result.eyebrow}</span>
          <h1>{result.title}</h1>
          <p className="result-summary">{result.summary}</p>
          <AttachmentResult result={result} />

          <section className="choice-review" aria-labelledby="choice-review-title">
            <header>
              <span>Your choices, decoded</span>
              <h2 id="choice-review-title">What each image may be reflecting back to you</h2>
              <p>This is the part that shaped your result: the interpretation associated with each image you selected.</p>
            </header>
            <div className="choice-review-list">
              {answeredChoices.map(({ option, question, questionNumber, selectedIndex }) => (
                <article className="choice-review-card" key={question.id}>
                  {sceneKeyFromPath(question.atlasPath)
                    ? <SceneCard className="choice-review-image" index={selectedIndex} scene={sceneKeyFromPath(question.atlasPath) ?? "phone"} />
                    : <AtlasImage className="choice-review-image" index={selectedIndex} loading="eager" path={question.atlasPath} sizes="180px" />}
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

          {deepResult.depth ? <div className="deep-insight-grid">
            <section><span>Core motivation</span><h3>What sits underneath the pattern</h3><p>{deepResult.depth.coreDrive}</p></section>
            <section><span>In relationships</span><h3>What other people may experience</h3><p>{deepResult.depth.inRelationships}</p></section>
            <section><span>Under pressure</span><h3>When the strength becomes protection</h3><p>{deepResult.depth.underPressure}</p></section>
          </div> : null}

          <section className="reflection-card"><span>A question worth keeping</span><p>“{deepResult.lens.reflectionPrompt}”</p></section>
          {initialReportId ? <p><Link href="/recover">Find my paid reports / Resend report email</Link></p> : null}<p className="result-disclaimer">This is a self-reflection tool based on your image choices, not a clinical assessment or diagnosis.</p>          {relationshipContext ? <section className="relationship-saved"><span>Relationship map updated</span><h2>This reflection now belongs to your connection with {relationshipContext.nickname}.</h2><p>It records your experience in this relationship, not a conclusion about the other person. Return to your map to keep adding context over time.</p></section> : null}

          {RESULT_MAP_ENABLED ? <>
            <section className="map-unlock-copy"><span>New dimension added</span><h2>{TEST_DIMENSIONS[selectedTest.id] ? `${mapDimensions.find((dimension) => dimension.id === TEST_DIMENSIONS[selectedTest.id])?.label} is now part of your map.` : "Your Inner Map has started."}</h2><p>This is not a fixed label. Every future reflection adds context and can make the pattern more precise.</p></section>
            <InnerMap completedTestIds={completedTestIds} />
          </> : null}
          {result.affiliateProductId && affiliateProducts.find((product) => product.id === result.affiliateProductId && product.active) ? (() => { const product = affiliateProducts.find((item) => item.id === result.affiliateProductId && item.active)!; return <section className="affiliate-recommendation" aria-labelledby="affiliate-recommendation-title"><div className="affiliate-recommendation-copy"><span>Selected for your result</span><h2 id="affiliate-recommendation-title">A next step that may support you</h2><h3>{product.name}</h3><p>{product.description}</p><small>Affiliate disclosure: we may earn a commission if you choose to purchase through this link, at no extra cost to you.</small></div><a className="affiliate-recommendation-link" href={product.url} onClick={() => track("affiliate_link_clicked", questions.length + 4)} rel="sponsored nofollow noopener" target="_blank">{product.buttonLabel} <span aria-hidden="true">↗</span></a></section>; })() : null}
          {relatedInsights.length ? <section className="result-related-reading" aria-labelledby="result-related-reading-title"><div><span>Continue the reflection</span><h2 id="result-related-reading-title">Read what may sit behind this pattern</h2></div><div className="result-related-reading-links">{relatedInsights.map((article) => <Link href={`/insights/${article.slug}?utm_source=result&utm_medium=internal&utm_campaign=${selectedTest.id}`} key={article.slug}><strong>{article.title}</strong><span>{article.excerpt}</span><em>Read the insight →</em></Link>)}</div></section> : null}
          {recommendedTest ? <section className="next-exploration" style={{ "--test-accent": recommendedTest.accent } as React.CSSProperties}><div><span>Recommended next</span><h2>{recommendedTest.title}</h2><p>{recommendedTest.description}</p></div><button className="primary-button" onClick={() => openDetail(recommendedTest)} type="button">Explore this dimension →</button></section> : null}
        </article>
      ) : null}
      {CROSS_TEST_REPORT_ENABLED ? <section className="premium-card"><div><span className="premium-label">Coming next · Cross-test report</span><h2>Connect your patterns across all eight tests.</h2><p>A combined projection map showing repeated choices, contradictions between profiles, and the situations that change your response.</p></div><button className="premium-button" onClick={() => { setShowUpgrade(true); track("upgrade_clicked", questions.length + 3); }}>Preview combined report <span>↗</span></button></section> : null}
      <button className="retake-button" onClick={returnHome}>Back to the attachment quiz</button>
      {CROSS_TEST_REPORT_ENABLED && showUpgrade ? <div className="modal-backdrop" role="presentation" onClick={() => setShowUpgrade(false)}><div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowUpgrade(false)}>×</button><span className="result-seal">Premium preview</span><h2 id="upgrade-title">Your deeper report is almost here.</h2><p>The checkout hook is ready for Creem or Stripe. Payments stay disabled until a provider is connected.</p><div className="premium-list"><span>✓ Every choice explained in context</span><span>✓ Repeated relationship and stress signals</span><span>✓ Contradictions that reveal when your pattern changes</span></div><button className="primary-button full-button" disabled>Checkout coming soon</button><p className="checkout-legal">Future purchases will be subject to our <Link href="/terms">Terms</Link>, <Link href="/privacy">Privacy Policy</Link>, and <Link href="/refunds">Refund & Delivery Policy</Link>.</p></div></div> : null}
    </main>
  );
}
