"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailView, HomeView } from "@/app/quiz/_components/home-detail";
import { EmailGateView } from "@/app/quiz/_components/email-gate";
import { QuizView } from "@/app/quiz/_components/quiz-view";
import { ResultView } from "@/app/quiz/_components/result-view";
import {
  createRelationshipRequest,
  fetchCatalog,
  fetchProfile,
  fetchQuestions,
  fetchRelationships,
  submitReflection,
  trackEvent,
} from "@/app/quiz/_lib/api";
import { preloadAtlas } from "@/app/quiz/_lib/atlases";
import { getAttribution } from "@/app/quiz/_lib/attribution";
import { FEATURES } from "@/app/quiz/_lib/features";
import { validateEmailAddress } from "@/lib/email-validation";
import {
  getDimensionProgress,
  recommendNextTest,
  type InnerProfileSummary,
} from "@/lib/inner-map";
import {
  calculateResult,
  defaultQuestions,
  type AffiliateProduct,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";
import type { RelationshipNode, RelationshipType } from "@/lib/relationship-network";

type Stage = "home" | "detail" | "quiz" | "email" | "result";

export function QuizApp({ initialTests, initialTestId }: { initialTests: QuizTest[]; initialTestId?: string }) {
  const [tests, setTests] = useState(initialTests);
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);
  const [selectedTest, setSelectedTest] = useState<QuizTest | null>(
    () => (initialTestId ? initialTests.find((test) => test.id === initialTestId) ?? null : null),
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stage, setStage] = useState<Stage>(initialTestId ? "detail" : "home");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraitKey>>({});
  const [answerChoices, setAnswerChoices] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<InnerProfileSummary>({ completedTestIds: [] });
  const [relationships, setRelationships] = useState<RelationshipNode[]>([]);
  const [relationshipContext, setRelationshipContext] = useState<RelationshipNode | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [loadingTest, setLoadingTest] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultProfile | null>(null);
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
        .filter((question) => question.testId === testId && question.active)
        .sort((a, b) => a.position - b.position);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const loaded = await fetchQuestions(testId, controller.signal);
        questionsCache.current.set(testId, loaded);
        return loaded;
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
      setRelationships(await fetchRelationships());
    } catch {
      setRelationships([]);
    }
  }, []);

  async function createRelationship(nickname: string, relationshipType: RelationshipType) {
    setRelationshipLoading(true);
    setRelationshipError("");
    try {
      const relationship = await createRelationshipRequest(nickname, relationshipType);
      setRelationships((current) => [relationship, ...current]);
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
    if (!FEATURES.relationshipNetwork) return;
    const refresh = window.setTimeout(() => {
      void loadRelationships();
    }, 0);
    return () => window.clearTimeout(refresh);
  }, [loadRelationships]);

  useEffect(() => {
    void fetchProfile()
      .then((data) => {
        if (!data?.completedTestIds) return;
        setProfile(data);
        if (data.email) setEmail(data.email);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetchCatalog()
      .then(({ tests: nextTests, products }) => {
        if (nextTests.length) {
          setTests(nextTests);
          if (initialTestId) setSelectedTest(nextTests.find((test) => test.id === initialTestId) ?? null);
        }
        setAffiliateProducts(products);
      })
      .catch(() => undefined);
  }, [initialTestId]);

  const track = useCallback(
    (eventName: string, step = 0, questionId?: string, optionLabel?: string, overrideTestId?: string) => {
      if (!sessionId) return;
      void trackEvent({
        sessionId,
        eventName,
        step,
        source: attribution.source,
        campaign: attribution.campaign,
        questionId,
        optionLabel,
        testId: overrideTestId ?? selectedTest?.id,
      });
    },
    [attribution, selectedTest, sessionId],
  );

  useEffect(
    () => () => {
      if (answerTransitionTimer.current) window.clearTimeout(answerTransitionTimer.current);
    },
    [],
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
      void trackEvent({ ...payload, eventName: "session_started" });
      void trackEvent({ ...payload, eventName: "quiz_started", step: 1 });
      void trackEvent({ ...payload, eventName: "question_viewed", step: 1, questionId: readyQuestions[0].id });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to open this test.");
    } finally {
      setLoadingTest("");
    }
  }

  function chooseAnswer(scoreKey: TraitKey, optionLabel: string, optionIndex: number) {
    if (!activeQuestion || isAdvancing) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: scoreKey }));
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
    const nextResult = calculateResult(answers, selectedTest.results);
    setSubmitting(true);
    try {
      const data = await submitReflection({
        sessionId,
        testId: selectedTest.id,
        email: emailToSave,
        marketingConsent: false,
        answers,
        resultType: nextResult.key,
        source: attribution.source,
        campaign: attribution.campaign,
        relationshipId: relationshipContext?.id,
      });
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
    setSessionId("");
    setEmail("");
    setError("");
    setRelationshipContext(null);
    setRelationshipError("");
    window.history.replaceState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (stage === "detail") {
    if (!selectedTest) {
      return (
        <main className="detail-loading">
          <span className="brand-mark">DP</span>
          <p>Finding this visual test…</p>
        </main>
      );
    }
    const detailQuestion = defaultQuestions.find((question) => question.testId === selectedTest.id && question.position === 1);
    return (
      <DetailView
        detailPrompt={detailQuestion?.prompt ?? "Which image pulls you in before you can explain why?"}
        error={error}
        loadingTest={loadingTest}
        onStart={() => void startTest(selectedTest)}
        selectedTest={selectedTest}
      />
    );
  }

  if (stage === "home") {
    return (
      <HomeView
        completedTestIds={completedTestIds}
        error={error}
        featuredTest={featuredTest}
        loadingTest={loadingTest}
        onCreateRelationship={createRelationship}
        onOpenDetail={openDetail}
        onPrepareDetail={prepareDetail}
        onStartWithRelationship={(relationship) => featuredTest && void startTest(featuredTest, relationship)}
        previewImages={previewImages}
        recommendedTest={recommendedTest}
        relationshipError={relationshipError}
        relationshipLoading={relationshipLoading}
        relationships={relationships}
        tests={tests}
        unlockedDimensions={unlockedDimensions}
      />
    );
  }

  if (stage === "quiz" && activeQuestion && selectedTest) {
    return (
      <QuizView
        activeQuestion={activeQuestion}
        isAdvancing={isAdvancing}
        onBack={() => setQuestionIndex((index) => Math.max(0, index - 1))}
        onChoose={chooseAnswer}
        onReturnHome={returnHome}
        progress={progress}
        questionIndex={questionIndex}
        questionsLength={questions.length}
        relationshipContext={relationshipContext}
        selectedOptionIndex={selectedOptionIndex}
        selectedTest={selectedTest}
      />
    );
  }

  if (stage === "email" && selectedTest) {
    return (
      <EmailGateView
        answers={answers}
        email={email}
        error={error}
        onEmailChange={setEmail}
        onSubmit={unlockResult}
        profileEmail={profile.email}
        selectedTest={selectedTest}
        setError={setError}
        submitting={submitting}
      />
    );
  }

  return (
    <ResultView
      affiliateProducts={affiliateProducts}
      answerChoices={answerChoices}
      completedTestIds={completedTestIds}
      onOpenDetail={openDetail}
      onReturnHome={returnHome}
      onTrack={track}
      questions={questions}
      recommendedTest={recommendedTest}
      relationshipContext={relationshipContext}
      result={result}
      selectedTest={selectedTest}
      setShowUpgrade={setShowUpgrade}
      showUpgrade={showUpgrade}
    />
  );
}
