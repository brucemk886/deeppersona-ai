"use client";
import { BrandMark } from "@/app/_components/brand";

import type { AnswerRecord } from "@/lib/admin-answer-records";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import TrafficReport, { type TrafficData } from "./traffic-panel";
import ReportEmailPanel from './report-email-panel';
import { BlogManager, type AdminBlogPost } from "./blog-panel";
import { type BlogPost } from "@/lib/blog";
import { type AffiliateProduct, type QuizQuestion, type QuizTest } from "@/lib/quiz";
import {
  ADMIN_STATS_RANGE_LABELS,
  ADMIN_STATS_RANGES,
  isHourlyAdminStatsRange,
  type AdminStatsRange,
} from "@/lib/admin-stats-range";

type AdminSection = "overview" | "tests" | "questions" | "blog" | "traffic" | "emails" | "email-records" | "payments" | "affiliates";

type Stats = {
  traffic: TrafficData;
  orders: { days: { day: string; orders: number }[]; today: number; yesterday: number; lastSeven: number; previousSeven: number };
  answerEvents: { option_label: string | null; question_id: string; session_id: string }[];
  funnel: { event_name: string; users: number }[];
  sources: { source: string; users: number }[];
  emails: {
    is_test: number;
    deleted_at: string | null;
    answers: AnswerRecord[];
    campaign: string | null;
    completed_at: string;
    email: string;
    marketing_consent: number;
    session_id: string;
    source: string | null;
    test_id: string | null;
    test_title: string | null;
  }[];
  onlineNow: number;
  period?: { consented: number; leads: number; sessions: number };
  popularQuestions: { answers: number; prompt: string; question_id: string; users: number }[];
  popularTests: { test_id: string; title: string; users: number }[];
  range?: AdminStatsRange;
  series?: { day: string; leads: number; sessions: number }[];
  seriesGranularity?: "day" | "hour";
  sevenDays: { day: string; leads: number; sessions: number }[];
  today: { leads: number; sessions: number };
  totals: { consented: number; leads: number; sessions: number };
};

const navigation: { id: AdminSection; icon: string; label: string }[] = [
  { id: "overview", icon: "概", label: "数据概览" },
  { id: "payments", icon: "单", label: "订单" },
  { id: "tests", icon: "测", label: "测试管理" },
  { id: "questions", icon: "题", label: "题目管理" },
  { id: "blog", icon: "博", label: "博客管理" },
  { id: "traffic", icon: "流", label: "流量分析" },
  { id: "emails", icon: "邮", label: "邮箱用户" },
  { id: "email-records", icon: "信", label: "邮件记录" },
  { id: "affiliates", icon: "链", label: "联盟产品" },
];

const funnelOrder = [
  ["quiz_started", "开始测试"],
  ["email_gate_viewed", "完成答题（到达邮箱页）"],
  ["email_submitted", "提交邮箱"],
  ["result_viewed", "查看结果"],
] as const;

type EmailLead = Stats["emails"][number];

const blankOptions = [
  { label: "选项 A", microcopy: "", meaning: "", projection: "", styleKey: "anxious" },
  { label: "选项 B", microcopy: "", meaning: "", projection: "", styleKey: "avoidant" },
  { label: "选项 C", microcopy: "", meaning: "", projection: "", styleKey: "secure" },
  { label: "选项 D", microcopy: "", meaning: "", projection: "", styleKey: "fearful" },
];

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function formatSeriesLabel(value: string, range: AdminStatsRange, index: number) {
  if (isHourlyAdminStatsRange(range)) {
    const hour = Number(value.slice(11, 13));
    return Number.isFinite(hour) && hour % 3 === 0 ? `${String(hour).padStart(2, "0")}` : "";
  }
  if (range === "30d" && index % 5 !== 0 && index !== 29) return "";
  return formatDay(value.slice(0, 10));
}

function chartCopy(range: AdminStatsRange) {
  if (isHourlyAdminStatsRange(range)) {
    return {
      subtitle: "按小时统计访问会话与邮箱提交",
      title: range === "today" ? "今日时段访问" : "昨日时段访问",
    };
  }
  return {
    subtitle: "每天的访问会话与邮箱转化",
    title: range === "30d" ? "近 30 日流量" : "近 7 日流量",
  };
}

async function fetchAdminJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (!response.ok) throw new Error(`${url} 读取失败`);
  return response.json() as Promise<T>;
}

export function AdminDashboard({
  adminEmail,
  hasAllowlist,
  signOutPath,
}: {
  adminEmail: string;
  hasAllowlist: boolean;
  signOutPath: string;
}) {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [tests, setTests] = useState<QuizTest[]>([]);
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [leadBusy, setLeadBusy] = useState("");
  async function changeLead(lead: EmailLead) {
    setLeadBusy(lead.session_id);
    try {
      await fetchAdminJson("/api/admin/email-users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: lead.session_id, deleted: !lead.deleted_at }) });
      setStats(current => current ? { ...current, emails: current.emails.map(item => item.session_id === lead.session_id ? { ...item, deleted_at: lead.deleted_at ? null : new Date().toISOString() } : item) } : current);
      await loadData(true);
      showNotice(lead.deleted_at ? "记录已恢复" : "已移至已删除，可随时恢复");
    } catch { showNotice("操作失败，请重试"); } finally { setLeadBusy(""); }
  }
  const [statsRange, setStatsRange] = useState<AdminStatsRange>("7d");
  const isFirstLoad = useRef(true);

  const loadData = useCallback(async (quiet = false) => {
    // Background refreshes and saves must never replace unsaved editor drafts.
    if (quiet) {
      try { setStats(await fetchAdminJson<Stats>(`/api/admin/stats?range=${encodeURIComponent(statsRange)}`)); }
      catch { /* Keep the last successful statistics during temporary outages. */ }
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const [statsResult, questionsResult, testsResult, productsResult, blogResult] = await Promise.allSettled([
        fetchAdminJson<Stats>(`/api/admin/stats?range=${encodeURIComponent(statsRange)}`),
        fetchAdminJson<{ questions: QuizQuestion[] }>("/api/questions?all=1"),
        fetchAdminJson<{ tests: QuizTest[] }>("/api/tests?all=1"),
        fetchAdminJson<{ products: AffiliateProduct[] }>("/api/affiliate-products?all=1"),
        fetchAdminJson<{ posts: BlogPost[] }>("/api/blog?all=1"),
      ]);
      let loadedModules = 0;
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
        loadedModules += 1;
      }
      if (questionsResult.status === "fulfilled") {
        setQuestions(questionsResult.value.questions ?? []);
        loadedModules += 1;
      }
      if (productsResult.status === "fulfilled") {
        setAffiliateProducts(productsResult.value.products ?? []);
        loadedModules += 1;
      }
      if (testsResult.status === "fulfilled") {
        const nextTests = testsResult.value.tests ?? [];
        setTests(nextTests);
        setSelectedTestId((current) => nextTests.some((item) => item.id === current) ? current : nextTests[0]?.id || "");
        loadedModules += 1;
      }
      if (blogResult.status === "fulfilled") {
        setBlogPosts((current) => {
          const unsaved = current.filter((post) => post.key.startsWith("new-post-") && !blogResult.value.posts.some((item) => item.slug === post.slug));
          return [
            ...unsaved,
            ...(blogResult.value.posts ?? []).map((post) => ({ ...post, key: post.slug })),
          ];
        });
        loadedModules += 1;
      }
      if (!loadedModules) throw new Error("后台数据读取失败");
      if (!quiet && statsResult.status === "rejected") {
        setNotice("题库已正常加载，统计数据正在恢复");
        window.setTimeout(() => setNotice(""), 3200);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "后台数据读取失败");
    } finally {
      setLoading(false);
    }
  }, [statsRange]);

  useEffect(() => {
    const quiet = !isFirstLoad.current;
    isFirstLoad.current = false;
    const initial = window.setTimeout(() => void loadData(quiet), 0);
    const timer = window.setInterval(() => { if (!document.hidden) void loadData(true); }, 60 * 60 * 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadData]);

  const funnel = useMemo(() => {
    const values = stats?.traffic.operations;
    return ([['started','开始测试'],['finished','完成答题'],['submitted','提交邮箱'],['checkout','收银台已创建'],['paid','付款成功']] as const).map(([key,label]) => ({key,label,users:values?.[key] ?? 0}));
  }, [stats]);

  const funnelMax = Math.max(1, funnel[0]?.users ?? 0);
  const series = stats?.series ?? stats?.sevenDays ?? [];
  const period = stats?.period ?? { consented: 0, leads: 0, sessions: 0 };
  const chartMax = Math.max(1, ...series.map((item) => item.sessions), 0);
  const conversion = period.sessions ? ((period.leads / period.sessions) * 100).toFixed(1) : "0.0";
  const rangeLabel = ADMIN_STATS_RANGE_LABELS[statsRange];
  const filteredEmails = useMemo(() => {
    const needle = emailSearch.trim().toLowerCase();
    return (stats?.emails ?? []).filter(
      (lead) =>
        (!needle || [lead.email, lead.test_title, lead.test_id, lead.session_id].some((value) => value?.toLowerCase().includes(needle))) &&
        Boolean(lead.deleted_at) === showDeleted &&
        (!consentOnly || Boolean(lead.marketing_consent)),
    );
  }, [consentOnly, emailSearch, stats, showDeleted]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function changeSection(section: AdminSection) {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateQuestion(id: string, next: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...next } : question)),
    );
  }

  function updateOption(
    questionId: string,
    index: number,
    next: { label?: string },
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ...next } : option,
              ),
            }
          : question,
      ),
    );
  }

  function addQuestion() {
    if (!selectedTestId) {
      showNotice("请先选择一个测试");
      return;
    }
    const id = `question-${Date.now()}`;
    const position = Math.max(0, ...questions.filter((question) => question.testId === selectedTestId).map((question) => question.position)) + 1;
    const question: QuizQuestion = {
      id,
      testId: selectedTestId,
      kicker: "凭第一感觉选择",
      prompt: "在这里填写新题目",
      atlasPath: tests.find((test) => test.id === selectedTestId)?.presentationMode === "text" ? "" : "/quiz/landscapes.png",
      position,
      active: false,
      options: blankOptions.map((option) => ({ ...option })),
    };
    setQuestions((current) => [...current, question]);
    setActiveSection("questions");
    showNotice("已创建草稿，请填写后保存");
    window.setTimeout(() => document.getElementById(`editor-${id}`)?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function saveQuestion(question: QuizQuestion) {
    setSavingId(question.id);
    try {
      const response = await fetch("/api/questions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(question),
      });
      if (!response.ok) throw new Error("保存失败");
      showNotice(question.active ? "题目已保存，刷新前台即可查看（所属测试须已上线）" : "题目草稿已保存，前台不展示");
      await loadData(true);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId("");
    }
  }

  function updateTest(id: string, next: Partial<QuizTest>) {
    setTests((current) => current.map((test) => (test.id === id ? { ...test, ...next } : test)));
  }

  async function saveTest(test: QuizTest) {
    setSavingId(test.id);
    try {
      const response = await fetch("/api/tests", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(test),
      });
      if (!response.ok) throw new Error("保存失败");
      showNotice(test.active ? "测试已保存并上线" : "测试草稿已保存");
      await loadData(true);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId("");
    }
  }

  async function removeQuestion(question: QuizQuestion) {
    if (deletingId || savingId) return;
    if (!window.confirm(`确定删除题目“${question.prompt}”吗？删除后无法恢复，已生成的报告不受影响。`)) return;
    setDeletingId(question.id);
    try {
      await fetchAdminJson(`/api/questions?id=${encodeURIComponent(question.id)}`, { method: "DELETE" });
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      // Refresh server counts without overwriting other unsaved editor fields.
      const catalog = await fetchAdminJson<{ tests: QuizTest[] }>("/api/tests?all=1").catch(() => null);
      if (catalog) setTests(current => current.map(item => ({ ...item, questionCount: catalog.tests.find(test => test.id === item.id)?.questionCount ?? 0 })));
      showNotice("题目已删除");
    } catch { showNotice("删除题目失败，请重试"); }
    finally { setDeletingId(""); }
  }

  async function removeTest(test: QuizTest) {
    if (deletingId || savingId) return;
    const count = questions.filter(question => question.testId === test.id).length;
    if (!window.confirm(`确定删除测试“${test.title}”及其下的 ${count} 道题目吗？删除后无法恢复，已生成的报告和订单记录会保留。`)) return;
    setDeletingId(test.id);
    try {
      await fetchAdminJson(`/api/tests?id=${encodeURIComponent(test.id)}`, { method: "DELETE" });
      setTests(current => current.filter(item => item.id !== test.id));
      setQuestions(current => current.filter(item => item.testId !== test.id));
      setSelectedTestId(current => current === test.id ? tests.find(item => item.id !== test.id)?.id ?? "" : current);
      showNotice("测试及所属题目已删除，历史报告和订单已保留");
    } catch { showNotice("删除测试失败，请重试"); }
    finally { setDeletingId(""); }
  }

  function exportEmails() {
    const escape = (value: unknown) => {
      const safe = String(value ?? "").replace(/^([=+\-@])/, "'$1").replaceAll('"', '""');
      return `"${safe}"`;
    };
    const rows = [
      ["记录编号", "邮箱", "测试名称", "逐题选择", "流量来源", "活动参数", "营销授权", "提交时间"],
      ...filteredEmails.filter((lead) => !lead.deleted_at && !lead.is_test).map((lead) => {
        const choices = lead.answers
          .map((answer, index) => `Q${index + 1} ${answer.prompt}：${answer.optionLabel}`)
          .join("；");
        return [
          lead.session_id,
          lead.email,
          lead.test_title ?? lead.test_id ?? "未知测试",
          choices,
          lead.source ?? "direct",
          lead.campaign ?? "—",
          lead.marketing_consent ? "已授权" : "仅查看结果",
          lead.completed_at,
        ];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deep-persona-ai-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateAffiliateProduct(id: string, next: Partial<AffiliateProduct>) {
    setAffiliateProducts((current) => current.map((product) => product.id === id ? { ...product, ...next } : product));
  }

  function addAffiliateProduct() {
    const id = `affiliate-${Date.now()}`;
    setAffiliateProducts((current) => [...current, { id, name: "", description: "", url: "", buttonLabel: "View recommendation", active: false, position: Math.max(0, ...current.map((product) => product.position)) + 1 }]);
  }

  async function saveAffiliateProduct(product: AffiliateProduct) {
    setSavingId(product.id);
    try {
      const response = await fetch("/api/affiliate-products", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(product) });
      if (!response.ok) throw new Error("保存联盟产品失败");
      showNotice(product.active ? "联盟产品已保存并上架" : "联盟产品草稿已保存");
      await loadData(true);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存联盟产品失败");
    } finally { setSavingId(""); }
  }

  async function removeAffiliateProduct(product: AffiliateProduct) {
    if (!window.confirm(`确定删除“${product.name || "未命名产品"}”吗？已关联的结果将不再展示此推荐。`)) return;
    const response = await fetch(`/api/affiliate-products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" });
    if (!response.ok) { showNotice("删除联盟产品失败"); return; }
    setAffiliateProducts((current) => current.filter((item) => item.id !== product.id));
    showNotice("联盟产品已删除");
  }

  function todayStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateBlogPost(key: string, next: Partial<BlogPost>) {
    setBlogPosts((current) => current.map((post) => (post.key === key ? { ...post, ...next } : post)));
  }

  function addBlogPost() {
    const key = `new-post-${Date.now()}`;
    const today = todayStamp();
    setBlogPosts((current) => [
      {
        key,
        slug: key,
        title: "",
        excerpt: "",
        body: "Write the article first.\n\n<!-- CTA -->\n\nThen add any closing note.",
        publishedAt: today,
        updatedAt: today,
        readMinutes: 5,
        primaryTestId: selectedTestId || tests[0]?.id || "attachment-style",
        active: false,
        wordCount: 0,
      },
      ...current,
    ]);
    setActiveSection("blog");
    showNotice("已创建草稿，请填写后保存");
    window.setTimeout(() => document.getElementById(`blog-${key}`)?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function saveBlogPost(post: AdminBlogPost) {
    setSavingId(post.key);
    try {
      const response = await fetch("/api/blog", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...post, previousSlug: post.key }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; post?: BlogPost };
      if (!response.ok) throw new Error(payload.error || "保存失败");
      const saved = payload.post ?? post;
      setBlogPosts((current) => current.map((item) => (item.key === post.key ? { ...saved, key: saved.slug } : item)));
      showNotice(saved.active ? "文章已保存并上线" : "文章草稿已保存，前台不展示");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId("");
    }
  }

  async function removeBlogPost(post: AdminBlogPost) {
    if (deletingId || savingId) return;
    if (!window.confirm(`确定删除文章“${post.title || post.slug}”吗？删除后无法恢复，前台对应网址会失效。`)) return;
    setDeletingId(post.key);
    try {
      await fetchAdminJson(`/api/blog?slug=${encodeURIComponent(post.key)}`, { method: "DELETE" });
      setBlogPosts((current) => current.filter((item) => item.key !== post.key));
      showNotice("文章已删除");
    } catch {
      showNotice("删除文章失败，请重试");
    } finally {
      setDeletingId("");
    }
  }
  return (
    <main className="admin-shell admin-cn">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/">
          <BrandMark inverse />
          <span><strong>DeepPersona AI</strong><small>运营管理后台</small></span>
        </Link>
        <nav className="admin-side-nav" aria-label="后台导航">
          <span className="admin-nav-label">工作台</span>
          {navigation.slice(0, 6).map((item) => (
            <button
              className={activeSection === item.id ? "active" : ""}
              key={item.id}
              onClick={() => changeSection(item.id)}
            >
              <span className="side-icon">{item.icon}</span>{item.label}
              {item.id === "emails" && stats?.totals.leads ? <b>{stats.totals.leads}</b> : null}
            </button>
          ))}
          <span className="admin-nav-label second">系统</span>
          {navigation.slice(6).map((item) => (
            <button
              className={activeSection === item.id ? "active" : ""}
              key={item.id}
              onClick={() => changeSection(item.id)}
            >
              <span className="side-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="admin-account">
          <span className="account-avatar">{adminEmail.slice(0, 1).toUpperCase()}</span>
          <span><strong>管理员</strong><small>{adminEmail}</small></span>
          <a href={signOutPath} title="退出登录">↗</a>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <small>DeepPersona AI / {navigation.find((item) => item.id === activeSection)?.label}</small>
            <strong>{navigation.find((item) => item.id === activeSection)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-indicator"><i /> 每 1 小时更新{stats?.traffic.updatedAt ? ` · ${new Date(stats.traffic.updatedAt).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai" })}` : ""}</span>
            <button className="admin-ghost-button" disabled={loading} onClick={() => void loadData()}>{loading ? "刷新中…" : "刷新数据"}</button>
            <Link className="admin-primary-button" href="/" target="_blank">查看网站 ↗</Link>
          </div>
        </header>

        <div className="admin-content">
          {!hasAllowlist ? (
            <div className="admin-security-banner">
              <strong>上线前安全提醒</strong>
              <span>当前站点为私有访问。公开投放前请设置 ADMIN_EMAILS 管理员白名单。</span>
            </div>
          ) : null}

          {notice ? <div className="admin-toast" role="status">{notice}</div> : null}

          {activeSection === "overview" ? (
            <Overview
              chartMax={chartMax}
              conversion={conversion}
              funnel={funnel}
              funnelMax={funnelMax}
              loading={loading}
              period={period}
              range={statsRange}
              rangeLabel={rangeLabel}
              series={series}
              setRange={setStatsRange}
              stats={stats}
            />
          ) : null}

          {activeSection === "questions" ? (
            <QuestionManager
              addQuestion={addQuestion}
              deletingId={deletingId}
              questions={questions.filter((question) => question.testId === selectedTestId)}
              removeQuestion={removeQuestion}
              saveQuestion={saveQuestion}
              selectedTestId={selectedTestId}
              setSelectedTestId={setSelectedTestId}
              savingId={savingId}
              tests={tests}
              updateOption={updateOption}
              updateQuestion={updateQuestion}
            />
          ) : null}

          {activeSection === "tests" ? (
            <TestManager
              deletingId={deletingId}
              products={affiliateProducts}
              removeTest={removeTest}
              saveTest={saveTest}
              savingId={savingId}
              tests={tests}
              updateTest={updateTest}
            />
          ) : null}

          {activeSection === "traffic" ? (
            <TrafficReport data={stats?.traffic} onRangeChange={setStatsRange} range={statsRange} rangeLabel={rangeLabel} />
          ) : null}

          {activeSection === "emails" ? (
            <EmailPanel
              showDeleted={showDeleted} setShowDeleted={setShowDeleted} changeLead={changeLead} leadBusy={leadBusy}
              consentOnly={consentOnly}
              emailSearch={emailSearch}
              emails={filteredEmails}
              exportEmails={exportEmails}
              setConsentOnly={setConsentOnly}
              setEmailSearch={setEmailSearch}
            />
          ) : null}

          {activeSection === "payments" ? <PaymentPanel /> : null}
          {activeSection === "email-records" ? <ReportEmailPanel /> : null}
          {activeSection === "blog" ? (
            <BlogManager
              addPost={addBlogPost}
              deletingId={deletingId}
              posts={blogPosts}
              removePost={removeBlogPost}
              savePost={saveBlogPost}
              savingId={savingId}
              tests={tests}
              updatePost={updateBlogPost}
            />
          ) : null}
          {activeSection === "affiliates" ? (
            <AffiliateProductsPanel addProduct={addAffiliateProduct} products={affiliateProducts} removeProduct={removeAffiliateProduct} saveProduct={saveAffiliateProduct} savingId={savingId} updateProduct={updateAffiliateProduct} />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Overview({
  chartMax,
  conversion,
  funnel,
  funnelMax,
  loading,
  period,
  range,
  rangeLabel,
  series,
  setRange,
  stats,
}: {
  chartMax: number;
  conversion: string;
  funnel: { key: string; label: string; users: number }[];
  funnelMax: number;
  loading: boolean;
  period: { consented: number; leads: number; sessions: number };
  range: AdminStatsRange;
  rangeLabel: string;
  series: Stats["sevenDays"];
  setRange: (value: AdminStatsRange) => void;
  stats: Stats | null;
}) {
  const chart = chartCopy(range);
  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">实时经营数据</span><h1>欢迎回来，所选时段的测试表现如下</h1></div>
        <div className="admin-heading-tools">
          <StatsRangeSwitcher value={range} onChange={setRange} />
          <span className="admin-date">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date())}</span>
        </div>
      </div>
      <OrderOverview orders={stats?.orders} />
      <section className="metric-grid five">
        <MetricCard accent="green" label="上次更新时活跃" value={loading ? "—" : stats?.onlineNow ?? 0} note="更新前 5 分钟的测试会话" live />
        <MetricCard label="区间访问" value={loading ? "—" : period.sessions} note={`${rangeLabel}独立测试会话`} />
        <MetricCard label="区间邮箱" value={loading ? "—" : period.leads} note={`${rangeLabel}完成邮箱解锁`} />
        <MetricCard label="营销授权" value={loading ? "—" : period.consented} note={`${rangeLabel}同意接收营销`} />
        <MetricCard accent="wine" label="邮箱转化率" value={`${conversion}%`} note={`${rangeLabel}访问 → 邮箱提交`} />
      </section>
      <p className="stats-alltime-hint">全站累计 {stats?.totals.sessions ?? 0} 次访问 · {stats?.totals.leads ?? 0} 个邮箱 · 今日 {stats?.today.sessions ?? 0} 次访问</p>

      <section className="dashboard-two-column wide-left">
        <div className="admin-card chart-card">
          <CardHeader title={chart.title} subtitle={chart.subtitle} />
          <SevenDayChart data={series} max={chartMax} range={range} />
        </div>
        <div className="admin-card">
          <CardHeader title="转化漏斗" subtitle={`${rangeLabel}各关键节点的独立用户`} />
          <Funnel funnel={funnel} max={funnelMax} />
        </div>
      </section>

      <section className="dashboard-two-column equal">
        <div className="admin-card">
          <CardHeader title="最热门题目" subtitle={`${rangeLabel}按照用户选择次数排序`} />
          <PopularQuestions items={stats?.popularQuestions ?? []} />
        </div>
        <div className="admin-card">
          <CardHeader title="主要流量来源" subtitle={`${rangeLabel}用于 TikTok 矩阵账号归因`} />
          <SourceList sources={stats?.sources ?? []} />
        </div>
      </section>
      <section className="admin-card traffic-full">
        <CardHeader title="热门测试排行" subtitle={`${rangeLabel}按照开始测试的会话数排序`} />
        <PopularTests items={stats?.popularTests ?? []} />
      </section>
    </>
  );
}

function OrderOverview({ orders }: { orders: Stats['orders'] | undefined }) {
  const max = Math.max(1, ...(orders?.days.map(day => day.orders) ?? []));
  const change = orders ? orders.lastSeven - orders.previousSeven : 0;
  return <section className="admin-card order-overview">
    <CardHeader title="每日成交订单" subtitle="北京时间（UTC+8）· 按付款成功时间统计；不含沙盒、内部预览及未付款订单，后续退款不抹除成交记录。" />
    <div className="metric-grid four">
      <MetricCard accent="green" label="今日成交" value={orders?.today ?? '—'} note="今日截至当前" />
      <MetricCard label="昨日成交" value={orders?.yesterday ?? '—'} note="昨日全天" />
      <MetricCard label="近 7 日成交" value={orders?.lastSeven ?? '—'} note="含今日" />
      <MetricCard label="较前 7 日变化" value={orders ? `${change > 0 ? '+' : ''}${change} 单` : '—'} note={`前 7 日 ${orders?.previousSeven ?? '—'} 单；当前周期含未结束的今日`} />
    </div>
    <div className="order-trend" role="img" aria-label={orders ? `最近14天成交订单：${orders.days.map(day => `${day.day} ${day.orders}单`).join('，')}` : '订单趋势加载中'}>
      {orders?.days.map(day => <div className="order-trend-day" key={day.day} title={`${day.day}：${day.orders} 单`}>
        <strong>{day.orders}</strong><div className="order-trend-track"><span style={{ height: `${day.orders / max * 100}%` }} /></div><small>{day.day.slice(5).replace('-', '/')}</small>
      </div>)}
    </div>
  </section>;
}

function StatsRangeSwitcher({
  onChange,
  value,
}: {
  onChange: (value: AdminStatsRange) => void;
  value: AdminStatsRange;
}) {
  return (
    <div aria-label="统计时间范围" className="stats-range-switcher" role="tablist">
      {ADMIN_STATS_RANGES.map((item) => (
        <button
          aria-selected={value === item}
          className={value === item ? "active" : undefined}
          key={item}
          onClick={() => onChange(item)}
          role="tab"
          type="button"
        >
          {ADMIN_STATS_RANGE_LABELS[item]}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  accent = "default",
  label,
  live,
  note,
  value,
}: {
  accent?: "default" | "green" | "wine";
  label: string;
  live?: boolean;
  note: string;
  value: number | string;
}) {
  return (
    <article className={`metric-card ${accent}`}>
      <div><span>{label}</span>{live ? <i className="metric-live" /> : null}</div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function CardHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return <header className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div><span>•••</span></header>;
}

function SevenDayChart({
  data,
  max,
  range,
}: {
  data: Stats["sevenDays"];
  max: number;
  range: AdminStatsRange;
}) {
  const dense = data.length > 7;
  return (
    <div className="chart-scroll">
      <div
        className={`seven-day-chart${dense ? " dense" : ""}`}
        style={{ "--chart-cols": String(Math.max(data.length, 1)) } as CSSProperties}
      >
        <div className="chart-lines"><i /><i /><i /><i /></div>
        {data.map((item, index) => (
          <div className="day-column" key={item.day}>
            <div className="day-value">{dense ? "" : item.sessions}</div>
            <div className="bar-wrap">
              <span className="session-bar" style={{ height: `${Math.max(4, (item.sessions / max) * 100)}%` }} />
              <span className="lead-bar" style={{ height: `${Math.max(0, (item.leads / max) * 100)}%` }} />
            </div>
            <small>{formatSeriesLabel(item.day, range, index)}</small>
          </div>
        ))}
        <div className="chart-legend"><span><i className="legend-session" />访问</span><span><i className="legend-lead" />邮箱</span></div>
      </div>
    </div>
  );
}

function Funnel({ funnel, max }: { funnel: { key: string; label: string; users: number }[]; max: number }) {
  return (
    <div className="funnel-list-cn">
      {funnel.map((item, index) => {
        const previous = index === 0 ? item.users : funnel[index - 1]?.users ?? 0;
        const rate = previous ? Math.round((item.users / previous) * 100) : 0;
        return (
          <div className="funnel-item-cn" key={item.key}>
            <div><span>{index + 1}</span><strong>{item.label}</strong><b>{item.users}</b></div>
            <div className="funnel-track-cn"><i style={{ width: `${(item.users / max) * 100}%` }} /></div>
            <small>{index === 0 ? "基准流量" : `上一步留存 ${rate}%`}</small>
          </div>
        );
      })}
    </div>
  );
}

function PopularQuestions({ items }: { items: Stats["popularQuestions"] }) {
  if (!items.length) return <EmptyState title="暂无热门题目数据" text="新版题目埋点上线后，会自动按选择次数排序。" />;
  const max = Math.max(1, ...items.map((item) => item.answers));
  return (
    <div className="popular-list">
      {items.map((item, index) => (
        <div className="popular-row" key={item.question_id}>
          <span className="rank">{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{item.prompt}</strong><span><i style={{ width: `${(item.answers / max) * 100}%` }} /></span></div>
          <b>{item.answers} 次</b>
        </div>
      ))}
    </div>
  );
}

function PopularTests({ items }: { items: Stats["popularTests"] }) {
  if (!items.length) return <EmptyState title="暂无热门测试数据" text="首批测试上线后，会自动按开始人数排序。" />;
  const max = Math.max(1, ...items.map((item) => item.users));
  return (
    <div className="popular-list">
      {items.map((item, index) => (
        <div className="popular-row" key={item.test_id}>
          <span className="rank">{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{item.title}</strong><span><i style={{ width: `${(item.users / max) * 100}%` }} /></span></div>
          <b>{item.users} 人</b>
        </div>
      ))}
    </div>
  );
}

function SourceList({ sources }: { sources: Stats["sources"] }) {
  if (!sources.length) return <EmptyState title="暂无来源数据" text="带 UTM 或 ttclid 的访问会自动归因。" />;
  const max = Math.max(1, ...sources.map((source) => source.users));
  return (
    <div className="source-list-cn">
      {sources.map((source) => (
        <div key={source.source}>
          <span><i className={source.source.includes("tiktok") ? "tiktok-dot" : ""} />{source.source}</span>
          <div><i style={{ width: `${(source.users / max) * 100}%` }} /></div>
          <b>{source.users}</b>
        </div>
      ))}
    </div>
  );
}

function TestManager({
  deletingId,
  products,
  removeTest,
  saveTest,
  savingId,
  tests,
  updateTest,
}: {
  deletingId: string;
  products: AffiliateProduct[];
  removeTest: (test: QuizTest) => Promise<void>;
  saveTest: (test: QuizTest) => Promise<void>;
  savingId: string;
  tests: QuizTest[];
  updateTest: (id: string, next: Partial<QuizTest>) => void;
}) {
  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">内容产品</span><h1>测试管理</h1><p>一个“测试”对应前台的一张测试卡和完整测试入口；这里管理标题、简介、封面、排序、推荐和上下线，不编辑测试内部题目。</p></div>
      </div>
      <div className="question-summary-strip">
        <span><strong>{tests.length}</strong>全部测试</span>
        <span><strong>{tests.filter((item) => item.active).length}</strong>已上线</span>
        <span><strong>{tests.reduce((sum, item) => sum + (item.questionCount ?? 0), 0)}</strong>上线题目</span>
        <small>前台保持英文；这里使用中文操作提示。</small>
      </div>
      <div className="test-manager-grid">
        {tests.map((test, index) => (
          <article className="test-editor-card" key={test.id}>
            <div className="test-editor-cover">
              <span className="atlas-image atlas-0" style={{ backgroundImage: `url(${test.coverAtlasPath})` }} />
              <b>{String(index + 1).padStart(2, "0")}</b>
            </div>
            <div className="test-editor-fields">
              <div className="test-editor-status"><small>ID: {test.id}</small><label className="status-switch"><input checked={test.active} onChange={(event) => updateTest(test.id, { active: event.target.checked })} type="checkbox" /><i /><span>{test.active ? "已上线" : "草稿"}</span></label></div>
              <label>标题<input value={test.title} onChange={(event) => updateTest(test.id, { title: event.target.value })} /></label>
              <label>分类标签<input value={test.kicker} onChange={(event) => updateTest(test.id, { kicker: event.target.value })} /></label>
              <label>简介<textarea rows={3} value={test.description} onChange={(event) => updateTest(test.id, { description: event.target.value })} /></label>
              <label>前台展示方式<select value={test.presentationMode === "text" ? "text" : "image"} onChange={(event) => updateTest(test.id, { presentationMode: event.target.value === "text" ? "text" : "image" })}><option value="image">图片选项（四格卡片）</option><option value="text">纯文本选项（无图片）</option></select></label>
              <div className="field-row two"><label>封面拼图地址<input list="atlas-paths" value={test.coverAtlasPath} onChange={(event) => updateTest(test.id, { coverAtlasPath: event.target.value })} /></label><label>排序<input min="1" type="number" value={test.position} onChange={(event) => updateTest(test.id, { position: Number(event.target.value) })} /></label></div>
              <label>完整解析价格（USD，填 0 为免费且前台不展示价格）<input min="0" step="0.01" type="number" value={(test.reportPriceCents / 100).toFixed(2)} onChange={(event) => updateTest(test.id, { reportPriceCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)) })} /></label>
              <label className="featured-checkbox"><input checked={test.featured} onChange={(event) => updateTest(test.id, { featured: event.target.checked })} type="checkbox" />设为首页主推测试</label>
              <div className="catalog-editor-actions">
                <button className="admin-ghost-button admin-delete-button" disabled={Boolean(deletingId || savingId)} onClick={() => void removeTest(test)} type="button">{deletingId === test.id ? "删除中…" : "删除测试"}</button>
                <button className="admin-primary-button" disabled={Boolean(deletingId) || savingId === test.id} onClick={() => void saveTest(test)}>{savingId === test.id ? "保存中…" : "保存测试"}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!tests.length ? <EmptyState title="暂无测试" text="测试已全部删除。历史报告和订单仍可在对应页面查看。" /> : null}
    </>
  );
}


function AffiliateProductsPanel({ addProduct, products, removeProduct, saveProduct, savingId, updateProduct }: { addProduct: () => void; products: AffiliateProduct[]; removeProduct: (product: AffiliateProduct) => Promise<void>; saveProduct: (product: AffiliateProduct) => Promise<void>; savingId: string; updateProduct: (id: string, next: Partial<AffiliateProduct>) => void; }) {
  return <>
    <div className="admin-page-heading question-heading-admin"><div><span className="admin-kicker">商业化配置</span><h1>联盟产品</h1><p>建立可复用的联盟产品库；再到「测试管理」按结果下拉关联。下架产品会从前台隐藏，但保留后台配置。</p></div><button className="admin-primary-button" onClick={addProduct}>＋ 新增联盟产品</button></div>
    <div className="test-manager-grid affiliate-products-grid">{products.map((product) => <article className="test-editor-card affiliate-product-editor" key={product.id}><div className="test-editor-fields"><div className="test-editor-status"><small>ID: {product.id}</small><label className="status-switch"><input checked={product.active} onChange={(event) => updateProduct(product.id, { active: event.target.checked })} type="checkbox" /><i /><span>{product.active ? "已上架" : "已下架"}</span></label></div><label>产品名称（英文）<input placeholder="e.g. Guided communication journal" value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} /></label><label>推荐说明（英文）<textarea rows={4} placeholder="Why this product fits the reader" value={product.description} onChange={(event) => updateProduct(product.id, { description: event.target.value })} /></label><label>联盟跳转链接<input type="url" placeholder="https://..." value={product.url} onChange={(event) => updateProduct(product.id, { url: event.target.value })} /></label><div className="field-row two"><label>按钮文案（英文）<input value={product.buttonLabel} onChange={(event) => updateProduct(product.id, { buttonLabel: event.target.value })} /></label><label>排序<input min="0" type="number" value={product.position} onChange={(event) => updateProduct(product.id, { position: Number(event.target.value) })} /></label></div><div className="affiliate-product-actions"><button className="admin-primary-button" disabled={savingId === product.id} onClick={() => void saveProduct(product)}>{savingId === product.id ? "保存中…" : "保存产品"}</button><button className="admin-ghost-button danger-button" onClick={() => void removeProduct(product)}>删除</button></div></div></article>)}</div>
    {!products.length ? <div className="admin-empty-state"><strong>还没有联盟产品</strong><p>先新增一个产品，之后即可在测试结果中选择它。</p></div> : null}
  </>;
}

function QuestionManager({
  addQuestion,
  deletingId,
  questions,
  removeQuestion,
  saveQuestion,
  selectedTestId,
  setSelectedTestId,
  savingId,
  tests,
  updateOption,
  updateQuestion,
}: {
  addQuestion: () => void;
  deletingId: string;
  questions: QuizQuestion[];
  removeQuestion: (question: QuizQuestion) => Promise<void>;
  saveQuestion: (question: QuizQuestion) => Promise<void>;
  selectedTestId: string;
  setSelectedTestId: (value: string) => void;
  savingId: string;
  tests: QuizTest[];
  updateOption: (id: string, index: number, next: { label?: string }) => void;
  updateQuestion: (id: string, next: Partial<QuizQuestion>) => void;
}) {
  return (
    <>
      <div className="admin-page-heading question-heading-admin">
        <div><span className="admin-kicker">测评内容</span><h1>题目管理</h1><p>管理题目和选项原文。图片测验仍用四格拼图；文本测验只展示选项文字。选择含义、补充说明和投射解读已去掉，新报告在用户提交后由 AI 直接生成。保存后刷新前台即可查看；草稿不展示，排序决定出题顺序。修改只影响之后生成的报告。</p></div>
        <button className="admin-primary-button" onClick={addQuestion}>＋ 新增题目</button>
      </div>
      <div className="test-filter-bar">
        <label>当前测试<select value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}>{tests.map((test) => <option key={test.id} value={test.id}>{test.title}（{test.questionCount ?? 0} 题）</option>)}</select></label>
        <span>下方只显示当前测试的题目；用户文案按该测试语言原样展示。</span>
      </div>
      <div className="question-summary-strip">
        <span><strong>{questions.length}</strong>全部题目</span>
        <span><strong>{questions.filter((item) => item.active).length}</strong>已上线</span>
        <span><strong>{questions.filter((item) => !item.active).length}</strong>草稿</span>
        <small>{tests.find((test) => test.id === selectedTestId)?.presentationMode === "text" ? "当前测试为纯文本模式，前台不展示图片占位。" : "图片测验使用一张 2×2 拼图，A/B/C/D 对应四个象限。"}</small>
      </div>
      <div className="question-editor-list">
        {questions.map((question, questionIndex) => (
          <article className="question-editor-cn" id={`editor-${question.id}`} key={question.id}>
            <header>
              <div className="question-index">{String(questionIndex + 1).padStart(2, "0")}</div>
              <div><strong>{question.prompt || "未命名题目"}</strong><small>ID: {question.id}</small></div>
              <label className="status-switch">
                <input checked={question.active} onChange={(event) => updateQuestion(question.id, { active: event.target.checked })} type="checkbox" />
                <i /><span>{question.active ? "已上线" : "草稿"}</span>
              </label>
            </header>
            <div className="question-editor-body">
              <aside>
                {question.atlasPath && tests.find((test) => test.id === selectedTestId)?.presentationMode !== "text" ? (
                  <div className="question-atlas-preview">
                    {[0, 1, 2, 3].map((index) => <span className={`atlas-image atlas-${index}`} key={index} style={{ backgroundImage: `url(${question.atlasPath})` }} />)}
                  </div>
                ) : <p className="question-text-mode-note">文本模式：无图片预览</p>}
                <label>排序<input min="1" type="number" value={question.position} onChange={(event) => updateQuestion(question.id, { position: Number(event.target.value) })} /></label>
              </aside>
              <div className="question-form-fields">
                <div className="field-row two"><label>题目前导语<input value={question.kicker} onChange={(event) => updateQuestion(question.id, { kicker: event.target.value })} /></label><label>图片拼图地址<input list="atlas-paths" value={question.atlasPath} onChange={(event) => updateQuestion(question.id, { atlasPath: event.target.value })} /></label></div>
                <label>题目正文<textarea rows={2} value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} /></label>
                <datalist id="atlas-paths"><option value="/quiz/landscapes.png" /><option value="/quiz/doors.png" /><option value="/quiz/symbols.png" /><option value="/quiz/rooms.png" /></datalist>
                <div className="option-editor-grid-cn">
                  {question.options.map((option, optionIndex) => (
                    <section key={optionIndex}>
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      <label>选项标题<input value={option.label} onChange={(event) => updateOption(question.id, optionIndex, { label: event.target.value })} /></label>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            <footer><button className="admin-ghost-button admin-delete-button" disabled={Boolean(deletingId || savingId)} onClick={() => void removeQuestion(question)} type="button">{deletingId === question.id ? "删除中…" : "删除题目"}</button><div><button className="admin-ghost-button" disabled={Boolean(deletingId)} onClick={() => updateQuestion(question.id, { active: !question.active })}>{question.active ? "转为草稿" : "设为上线"}</button><button className="admin-primary-button" disabled={Boolean(deletingId) || savingId === question.id} onClick={() => void saveQuestion(question)}>{savingId === question.id ? "保存中…" : "保存题目"}</button></div></footer>
          </article>
        ))}
      </div>
    </>
  );
}

function EmailPanel({
  showDeleted, setShowDeleted, changeLead, leadBusy,
  consentOnly,
  emailSearch,
  emails,
  exportEmails,
  setConsentOnly,
  setEmailSearch,
}: {
  showDeleted: boolean;
  setShowDeleted: (value: boolean) => void;
  changeLead: (lead: EmailLead) => Promise<void>;
  leadBusy: string;
  consentOnly: boolean;
  emailSearch: string;
  emails: Stats["emails"];
  exportEmails: () => void;
  setConsentOnly: (value: boolean) => void;
  setEmailSearch: (value: string) => void;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const selectedLead = emails.find((lead) => lead.session_id === selectedSessionId);
  const selectedAnswers = selectedLead ? selectedLead.answers : [];

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-kicker">用户资产</span><h1>邮箱用户</h1><p>按每次测试记录邮箱和原始答案；同一邮箱可有多次测试记录。</p></div><button className="admin-primary-button" disabled={showDeleted} onClick={exportEmails}>导出测试记录 CSV</button></div>
      <div className="email-guidance"><strong>邮箱授权</strong><span>营销授权独立记录，不根据测试答案自动分类。发送营销邮件时仅使用已授权的邮箱。</span></div>
      <p>删除仅隐藏这条邮箱记录，可在“已删除”中恢复；答案、订单和已购报告保留。已删除记录不计入邮箱统计或导出。</p>
      <div className="email-toolbar">
        <label className="segment-filter">记录状态<select value={showDeleted ? "deleted" : "active"} onChange={event => setShowDeleted(event.target.value === "deleted")}><option value="active">正常记录</option><option value="deleted">已删除</option></select></label>
        <label className="email-search">⌕<input placeholder="搜索邮箱、测试或记录编号" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} /></label>
        <label className="consent-filter"><input checked={consentOnly} onChange={(event) => setConsentOnly(event.target.checked)} type="checkbox" />仅显示已授权营销</label>
        <span>共 {emails.length} 条记录</span>
      </div>
      <section className="admin-card email-table-card">
        <div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>邮箱地址</th><th>测试名称</th><th>答案记录</th><th>流量来源</th><th>营销授权</th><th>提交时间</th><th>操作</th></tr></thead><tbody>{emails.map((lead) => <tr key={lead.session_id}><td><strong>{lead.email}</strong></td><td>{lead.test_title ?? lead.test_id ?? "未知测试"}</td><td>{lead.answers.length} 道题</td><td>{lead.source ?? "direct"}</td><td>{lead.marketing_consent ? <span className="consent-yes">● 已授权</span> : <span className="consent-no">仅查看结果</span>}</td><td>{formatDate(lead.completed_at)}</td><td><button className="lead-detail-button" onClick={() => setSelectedSessionId(lead.session_id)}>查看详情 →</button> <button className="lead-detail-button" disabled={Boolean(leadBusy)} onClick={() => void changeLead(lead)}>{leadBusy === lead.session_id ? "处理中…" : lead.deleted_at ? "恢复" : "删除"}</button></td></tr>)}</tbody></table></div>
        {!emails.length ? <EmptyState title="暂无邮箱记录" text="用户完成测试并提交邮箱后会显示在这里。" /> : null}
      </section>
      {selectedLead ? (
        <div className="lead-detail-backdrop" onClick={() => setSelectedSessionId("")} role="presentation">
          <aside aria-labelledby="lead-detail-title" aria-modal="true" className="lead-detail-drawer" onClick={(event) => event.stopPropagation()} role="dialog">
            <header className="lead-detail-header">
              <div><span>用户测试记录</span><h2 id="lead-detail-title">{selectedLead.email}</h2><p>{selectedLead.test_title ?? selectedLead.test_id ?? "未知测试"} · {formatDate(selectedLead.completed_at)}</p></div>
              <button aria-label="关闭答题详情" onClick={() => setSelectedSessionId("")}>×</button>
            </header>
            <section className="lead-profile-grid">
              <div><span>营销授权</span><strong className={selectedLead.marketing_consent ? "consent-yes" : "consent-no"}>{selectedLead.marketing_consent ? "已授权" : "未授权"}</strong></div>
              <div><span>流量来源</span><strong>{selectedLead.source ?? "direct"}</strong></div>
              <div><span>活动参数</span><strong>{selectedLead.campaign ?? "—"}</strong></div>
            </section>
            <section className="lead-answer-section">
              <p>记录编号：{selectedLead.session_id}</p><header><span>逐题选择</span><strong>{selectedAnswers.length} 条已保存答案</strong></header>
              <div className="lead-answer-list">
                {selectedAnswers.map((answer, index) => (
                  <article className="lead-answer-card" key={answer.questionId}>
                    <AnswerThumbnail answer={answer} />
                    <div>
                      <span>第 {index + 1} 题 · 用户选择 {answer.optionIndex !== null ? String.fromCharCode(65 + answer.optionIndex) : "—"}</span>
                      <h3>{answer.prompt}</h3>
                      <strong>{answer.optionLabel}</strong>
                    </div>
                  </article>
                ))}
              </div>
              {!selectedAnswers.length ? <EmptyState title="暂无逐题答案" text="该记录可能来自旧版本；后续新提交会完整显示每一道选择。" /> : null}
            </section>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function AnswerThumbnail({ answer }: { answer: AnswerRecord }) {
  if (!answer.atlasPath || answer.optionIndex === null) return <div className="lead-answer-thumb empty">?</div>;
  const horizontal = answer.optionIndex % 2 === 0 ? "0%" : "100%";
  const vertical = answer.optionIndex < 2 ? "0%" : "100%";
  return (
    <div
      aria-label={`选择 ${String.fromCharCode(65 + answer.optionIndex)} 的图片`}
      className="lead-answer-thumb"
      role="img"
      style={{ backgroundImage: `url(${answer.atlasPath})`, backgroundPosition: `${horizontal} ${vertical}` }}
    />
  );
}

function PaymentPanel() {
  const [data, setData] = useState<{ sandbox: boolean; ready: boolean; orders: { id: string; email: string; test_title: string; amount_cents: number; currency: string; status: string; livemode: number; created_at: string; email_status?: string; email_error?: string; email_link_access_at?: number }[] } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const result = await fetchAdminJson<NonNullable<typeof data>>("/api/admin/payments"); setData(result); setError(""); }
    catch { setError("无法读取支付配置或订单，请稍后重试。"); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  const labels: Record<string, string> = { pending: "待付款", paid: "已付款", failed: "付款失败", expired: "已过期", refunded: "已退款" };
  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">订单管理</span><h1>订单</h1><p>每份报告一次性付费，金额来自测试管理中的单价；设为 0 的测试免费。</p></div><button className="admin-primary-button" onClick={() => void load()}>刷新订单</button></div>
    {error ? <p role="alert">{error}</p> : null}

    <section className="admin-card"><h2>最近 100 笔订单</h2><div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>邮箱</th><th>测试</th><th>金额</th><th>环境</th><th>状态</th><th>报告邮件</th><th>创建时间</th></tr></thead><tbody>{data?.orders.map((order) => <tr key={order.id}><td>{order.email}</td><td>{order.test_title}</td><td>${(order.amount_cents / 100).toFixed(2)} {order.currency.toUpperCase()}</td><td>{order.livemode ? "正式" : "沙盒"}</td><td>{order.id.startsWith("preview_") ? "内部预览（未收款）" : labels[order.status] ?? order.status}</td><td>{({pending:"待发送",retry:"重试中",accepted:"发送服务已接受",failed:"发送失败",sandbox_skipped:"沙盒不外发"} as Record<string,string>)[order.email_status || ""] || "—"}{order.email_error ? <small>{order.email_error}</small> : null}{order.email_link_access_at ? <small>邮件链接有访问记录（可能包含邮件安全扫描）</small> : null}<small>补发请到「邮件记录」操作</small></td><td>{formatDate(order.created_at)}</td></tr>)}</tbody></table></div>{data && !data.orders.length ? <EmptyState title="暂无订单" text="用户打开 Stripe 收银台后会在这里生成订单。" /> : null}</section>
    <section className="admin-card"><h2>Stripe Checkout</h2><p>{data ? `${data.sandbox ? "沙盒测试（不扣真钱）" : "正式收款"} · ${data.ready ? "密钥与 Webhook 已配置" : "尚未完成密钥或 Webhook 配置"}` : "正在读取配置…"}</p><p>密钥通过 Cloudflare Worker Secrets 配置。回调地址：<code>https://deeppersonaai.com/api/stripe/webhook</code></p><p>修改测试单价影响新订单，已创建订单保留原价格。退款请在 Stripe 后台操作，全额退款通知会撤销报告访问权限。</p></section>
  </>;
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return <div className="admin-empty"><span>◇</span><strong>{title}</strong><p>{text}</p></div>;
}
