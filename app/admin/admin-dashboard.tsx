"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TRAIT_KEYS, type AffiliateProduct, type QuizQuestion, type QuizTest, type TraitKey } from "@/lib/quiz";

type AdminSection = "overview" | "tests" | "questions" | "traffic" | "emails" | "payments" | "affiliates";

type Stats = {
  answerEvents: { option_label: string | null; question_id: string; session_id: string }[];
  funnel: { event_name: string; users: number }[];
  sources: { source: string; users: number }[];
  emails: {
    answers_json: string | null;
    campaign: string | null;
    completed_at: string;
    email: string;
    marketing_consent: number;
    result_type: string;
    session_id: string;
    source: string | null;
    test_id: string | null;
    test_title: string | null;
  }[];
  onlineNow: number;
  popularQuestions: { answers: number; prompt: string; question_id: string; users: number }[];
  popularTests: { test_id: string; title: string; users: number }[];
  sevenDays: { day: string; leads: number; sessions: number }[];
  today: { leads: number; sessions: number };
  totals: { consented: number; leads: number; sessions: number };
};

const navigation: { id: AdminSection; icon: string; label: string }[] = [
  { id: "overview", icon: "概", label: "数据概览" },
  { id: "tests", icon: "测", label: "测试管理" },
  { id: "questions", icon: "题", label: "题目管理" },
  { id: "traffic", icon: "流", label: "流量分析" },
  { id: "emails", icon: "邮", label: "邮箱用户" },
  { id: "payments", icon: "付", label: "支付设置" },
  { id: "affiliates", icon: "链", label: "联盟产品" },
];

const funnelOrder = [
  ["quiz_started", "开始测试"],
  ["answer_selected", "完成答题"],
  ["email_gate_viewed", "到达邮箱页"],
  ["result_viewed", "查看结果"],
] as const;

const resultNames: Record<string, string> = {
  explorer: "探索者",
  connector: "连接者",
  architect: "架构者",
  creator: "创造者",
};

const segmentRecommendations: Record<string, string> = {
  explorer: "自我探索、旅行体验、职业转型、成长课程",
  connector: "亲密关系、沟通训练、情绪陪伴、社群型产品",
  architect: "效率规划、边界管理、压力调节、结构化课程",
  creator: "表达写作、创意练习、个人品牌、艺术体验",
};

type EmailLead = Stats["emails"][number];

type LeadAnswerDetail = {
  option: QuizQuestion["options"][number] | undefined;
  optionIndex: number;
  optionLabel: string;
  question: QuizQuestion | undefined;
  questionId: string;
  scoreKey: TraitKey;
};

function parseAnswers(value: string | null): Record<string, TraitKey> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, TraitKey>;
  } catch {
    return {};
  }
}

function getLeadAnswerDetails(
  lead: EmailLead,
  questions: QuizQuestion[],
  answerEvents: Stats["answerEvents"],
): LeadAnswerDetail[] {
  const latestLabels = new Map<string, string>();
  answerEvents.forEach((event) => {
    if (event.session_id === lead.session_id && event.option_label && !latestLabels.has(event.question_id)) {
      latestLabels.set(event.question_id, event.option_label);
    }
  });

  return Object.entries(parseAnswers(lead.answers_json))
    .map(([questionId, scoreKey]) => {
      const question = questions.find((item) => item.id === questionId);
      const eventLabel = latestLabels.get(questionId);
      let optionIndex = question?.options.findIndex((option) => option.label === eventLabel) ?? -1;
      if (optionIndex < 0) optionIndex = question?.options.findIndex((option) => option.scoreKey === scoreKey) ?? -1;
      const option = optionIndex >= 0 ? question?.options[optionIndex] : undefined;
      return {
        option,
        optionIndex,
        optionLabel: eventLabel ?? option?.label ?? "历史选项",
        question,
        questionId,
        scoreKey,
      };
    })
    .sort((a, b) => (a.question?.position ?? 999) - (b.question?.position ?? 999));
}

function getMarketingTags(lead: EmailLead) {
  const counts = new Map<string, number>();
  Object.values(parseAnswers(lead.answers_json)).forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
  const choiceTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${resultNames[key] ?? key}倾向 ×${count}`);
  return [`主类型 · ${resultNames[lead.result_type] ?? lead.result_type}`, ...choiceTags];
}

const blankOptions = [
  { label: "选项 A", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "explorer" as TraitKey },
  { label: "选项 B", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "connector" as TraitKey },
  { label: "选项 C", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "architect" as TraitKey },
  { label: "选项 D", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "creator" as TraitKey },
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

async function fetchAdminJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
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
  const [selectedTestId, setSelectedTestId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [statsResult, questionsResult, testsResult, productsResult] = await Promise.allSettled([
        fetchAdminJson<Stats>("/api/admin/stats"),
        fetchAdminJson<{ questions: QuizQuestion[] }>("/api/questions?all=1"),
        fetchAdminJson<{ tests: QuizTest[] }>("/api/tests?all=1"),
        fetchAdminJson<{ products: AffiliateProduct[] }>("/api/affiliate-products?all=1"),
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
        setSelectedTestId((current) => current || nextTests[0]?.id || "");
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
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadData(), 0);
    const timer = window.setInterval(() => void loadData(true), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadData]);

  const funnel = useMemo(() => {
    const values = new Map(stats?.funnel.map((item) => [item.event_name, item.users]) ?? []);
    return funnelOrder.map(([key, label]) => ({ key, label, users: values.get(key) ?? 0 }));
  }, [stats]);
  const funnelMax = Math.max(1, funnel[0]?.users ?? 0);
  const sevenDayTotal = stats?.sevenDays.reduce((sum, item) => sum + item.sessions, 0) ?? 0;
  const chartMax = Math.max(1, ...(stats?.sevenDays.map((item) => item.sessions) ?? [0]));
  const conversion = stats?.totals.sessions
    ? ((stats.totals.leads / stats.totals.sessions) * 100).toFixed(1)
    : "0.0";
  const filteredEmails = useMemo(() => {
    const needle = emailSearch.trim().toLowerCase();
    return (stats?.emails ?? []).filter(
      (lead) =>
        (!needle || [lead.email, lead.test_title, resultNames[lead.result_type]].some((value) => value?.toLowerCase().includes(needle))) &&
        (!consentOnly || Boolean(lead.marketing_consent)) &&
        (segmentFilter === "all" || lead.result_type === segmentFilter),
    );
  }, [consentOnly, emailSearch, segmentFilter, stats]);

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
    next: { label?: string; meaning?: string; microcopy?: string; projection?: string; scoreKey?: TraitKey },
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
      atlasPath: "/quiz/landscapes.png",
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
      showNotice(question.active ? "题目已保存并上线" : "题目草稿已保存");
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
    if (!window.confirm(`确定删除“${question.prompt}”吗？此操作不可撤销。`)) return;
    const response = await fetch(`/api/questions?id=${encodeURIComponent(question.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      showNotice("删除失败");
      return;
    }
    setQuestions((current) => current.filter((item) => item.id !== question.id));
    showNotice("题目已删除");
  }

  function exportEmails() {
    const escape = (value: unknown) => {
      const safe = String(value ?? "").replace(/^([=+\-@])/, "'$1").replaceAll('"', '""');
      return `"${safe}"`;
    };
    const rows = [
      ["邮箱", "测试名称", "结果类型", "营销分群", "推荐产品方向", "逐题选择", "流量来源", "活动参数", "营销授权", "提交时间"],
      ...filteredEmails.map((lead) => {
        const choices = getLeadAnswerDetails(lead, questions, stats?.answerEvents ?? [])
          .map((answer, index) => `Q${index + 1} ${answer.optionLabel}（${resultNames[answer.scoreKey] ?? answer.scoreKey}）`)
          .join("；");
        return [
          lead.email,
          lead.test_title ?? lead.test_id ?? "未知测试",
          resultNames[lead.result_type] ?? lead.result_type,
          getMarketingTags(lead).join("；"),
          segmentRecommendations[lead.result_type] ?? "根据测试内容人工判断",
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
  return (
    <main className="admin-shell admin-cn">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/">
          <span className="brand-mark">DP</span>
          <span><strong>DeepPersona AI</strong><small>运营管理后台</small></span>
        </Link>
        <nav className="admin-side-nav" aria-label="后台导航">
          <span className="admin-nav-label">工作台</span>
          {navigation.slice(0, 5).map((item) => (
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
          {navigation.slice(5).map((item) => (
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
            <span className="live-indicator"><i /> 数据每 30 秒更新</span>
            <button className="admin-ghost-button" onClick={() => void loadData()}>刷新数据</button>
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
              sevenDayTotal={sevenDayTotal}
              stats={stats}
            />
          ) : null}

          {activeSection === "questions" ? (
            <QuestionManager
              addQuestion={addQuestion}
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
              products={affiliateProducts}
              saveTest={saveTest}
              savingId={savingId}
              tests={tests}
              updateTest={updateTest}
            />
          ) : null}

          {activeSection === "traffic" ? (
            <TrafficPanel
              chartMax={chartMax}
              funnel={funnel}
              funnelMax={funnelMax}
              stats={stats}
            />
          ) : null}

          {activeSection === "emails" ? (
            <EmailPanel
              consentOnly={consentOnly}
              emailSearch={emailSearch}
              emails={filteredEmails}
              exportEmails={exportEmails}
              answerEvents={stats?.answerEvents ?? []}
              questions={questions}
              segmentFilter={segmentFilter}
              setConsentOnly={setConsentOnly}
              setEmailSearch={setEmailSearch}
              setSegmentFilter={setSegmentFilter}
            />
          ) : null}

          {activeSection === "payments" ? <PaymentPanel /> : null}
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
  sevenDayTotal,
  stats,
}: {
  chartMax: number;
  conversion: string;
  funnel: { key: string; label: string; users: number }[];
  funnelMax: number;
  loading: boolean;
  sevenDayTotal: number;
  stats: Stats | null;
}) {
  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">实时经营数据</span><h1>欢迎回来，今天的测试表现如下</h1></div>
        <span className="admin-date">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date())}</span>
      </div>
      <section className="metric-grid five">
        <MetricCard accent="green" label="当前在线" value={loading ? "—" : stats?.onlineNow ?? 0} note="最近 5 分钟活跃用户" live />
        <MetricCard label="今日访问" value={loading ? "—" : stats?.today.sessions ?? 0} note={`今日新增邮箱 ${stats?.today.leads ?? 0}`} />
        <MetricCard label="近 7 日流量" value={loading ? "—" : sevenDayTotal} note="独立测试会话" />
        <MetricCard label="累计邮箱" value={loading ? "—" : stats?.totals.leads ?? 0} note={`营销授权 ${stats?.totals.consented ?? 0}`} />
        <MetricCard accent="wine" label="邮箱转化率" value={`${conversion}%`} note="访问 → 邮箱提交" />
      </section>

      <section className="dashboard-two-column wide-left">
        <div className="admin-card chart-card">
          <CardHeader title="最近 7 日流量" subtitle="访问会话与邮箱转化趋势" />
          <SevenDayChart data={stats?.sevenDays ?? []} max={chartMax} />
        </div>
        <div className="admin-card">
          <CardHeader title="转化漏斗" subtitle="各关键节点的独立用户" />
          <Funnel funnel={funnel} max={funnelMax} />
        </div>
      </section>

      <section className="dashboard-two-column equal">
        <div className="admin-card">
          <CardHeader title="最热门题目" subtitle="按照用户选择次数排序" />
          <PopularQuestions items={stats?.popularQuestions ?? []} />
        </div>
        <div className="admin-card">
          <CardHeader title="主要流量来源" subtitle="用于 TikTok 矩阵账号归因" />
          <SourceList sources={stats?.sources ?? []} />
        </div>
      </section>
      <section className="admin-card traffic-full">
        <CardHeader title="热门测试排行" subtitle="按照开始测试的独立用户数排序" />
        <PopularTests items={stats?.popularTests ?? []} />
      </section>
    </>
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

function SevenDayChart({ data, max }: { data: Stats["sevenDays"]; max: number }) {
  return (
    <div className="seven-day-chart">
      <div className="chart-lines"><i /><i /><i /><i /></div>
      {data.map((item) => (
        <div className="day-column" key={item.day}>
          <div className="day-value">{item.sessions}</div>
          <div className="bar-wrap">
            <span className="session-bar" style={{ height: `${Math.max(4, (item.sessions / max) * 100)}%` }} />
            <span className="lead-bar" style={{ height: `${Math.max(0, (item.leads / max) * 100)}%` }} />
          </div>
          <small>{formatDay(item.day)}</small>
        </div>
      ))}
      <div className="chart-legend"><span><i className="legend-session" />访问</span><span><i className="legend-lead" />邮箱</span></div>
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
  products,
  saveTest,
  savingId,
  tests,
  updateTest,
}: {
  products: AffiliateProduct[];
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
              <label>英文标题<input value={test.title} onChange={(event) => updateTest(test.id, { title: event.target.value })} /></label>
              <label>英文分类标签<input value={test.kicker} onChange={(event) => updateTest(test.id, { kicker: event.target.value })} /></label>
              <label>英文简介<textarea rows={3} value={test.description} onChange={(event) => updateTest(test.id, { description: event.target.value })} /></label>
              <div className="field-row two"><label>封面拼图地址<input list="atlas-paths" value={test.coverAtlasPath} onChange={(event) => updateTest(test.id, { coverAtlasPath: event.target.value })} /></label><label>排序<input min="1" type="number" value={test.position} onChange={(event) => updateTest(test.id, { position: Number(event.target.value) })} /></label></div>
              <label>完整解析价格（USD，填 0 为免费且前台不展示价格）<input min="0" step="0.01" type="number" value={(test.reportPriceCents / 100).toFixed(2)} onChange={(event) => updateTest(test.id, { reportPriceCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)) })} /></label>
              <details className="affiliate-config"><summary>按结果选择联盟产品（可选）</summary><p>先在「联盟产品」建立产品库，再为每种结果选择一个产品。产品内容改动后，所有已关联结果会自动同步；不选择则前台不展示。</p><div className="affiliate-result-grid">{TRAIT_KEYS.map((key) => { const selectedId = test.results[key].affiliateProductId ?? ""; const exists = !selectedId || products.some((product) => product.id === selectedId); return <fieldset key={key}><legend>{test.results[key].title}（{resultNames[key]}）</legend><label>关联产品<select value={selectedId} onChange={(event) => updateTest(test.id, { results: { ...test.results, [key]: { ...test.results[key], affiliateProductId: event.target.value || undefined } } })}><option value="">不展示联盟推荐</option>{!exists ? <option value={selectedId}>已删除产品（请重新选择）</option> : null}{products.map((product) => <option key={product.id} value={product.id}>{product.active ? "" : "已下架 · "}{product.name || "未命名产品"}</option>)}</select></label></fieldset>; })}</div></details>
              <label className="featured-checkbox"><input checked={test.featured} onChange={(event) => updateTest(test.id, { featured: event.target.checked })} type="checkbox" />设为首页主推测试</label>
              <button className="admin-primary-button" disabled={savingId === test.id} onClick={() => void saveTest(test)}>{savingId === test.id ? "保存中…" : "保存测试"}</button>
            </div>
          </article>
        ))}
      </div>
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
  questions: QuizQuestion[];
  removeQuestion: (question: QuizQuestion) => Promise<void>;
  saveQuestion: (question: QuizQuestion) => Promise<void>;
  selectedTestId: string;
  setSelectedTestId: (value: string) => void;
  savingId: string;
  tests: QuizTest[];
  updateOption: (id: string, index: number, next: { label?: string; meaning?: string; microcopy?: string; projection?: string; scoreKey?: TraitKey }) => void;
  updateQuestion: (id: string, next: Partial<QuizQuestion>) => void;
}) {
  return (
    <>
      <div className="admin-page-heading question-heading-admin">
        <div><span className="admin-kicker">测评内容</span><h1>题目管理</h1><p>管理所选测试内部的每一道图片题、A/B/C/D 选项、选择含义和投射解读。保存后用户端立即生效。</p></div>
        <button className="admin-primary-button" onClick={addQuestion}>＋ 新增题目</button>
      </div>
      <div className="test-filter-bar">
        <label>当前测试<select value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}>{tests.map((test) => <option key={test.id} value={test.id}>{test.title}（{test.questionCount ?? 0} 题）</option>)}</select></label>
        <span>下方只显示当前测试的题目；所有面向用户的文案请填写英文。</span>
      </div>
      <div className="question-summary-strip">
        <span><strong>{questions.length}</strong>全部题目</span>
        <span><strong>{questions.filter((item) => item.active).length}</strong>已上线</span>
        <span><strong>{questions.filter((item) => !item.active).length}</strong>草稿</span>
        <small>图片使用一张 2×2 拼图，A/B/C/D 对应四个象限。</small>
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
                <div className="question-atlas-preview">
                  {[0, 1, 2, 3].map((index) => <span className={`atlas-image atlas-${index}`} key={index} style={{ backgroundImage: `url(${question.atlasPath})` }} />)}
                </div>
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
                      <label>补充说明<input value={option.microcopy} onChange={(event) => updateOption(question.id, optionIndex, { microcopy: event.target.value })} /></label>
                      <label>选择含义<textarea rows={3} value={option.meaning} onChange={(event) => updateOption(question.id, optionIndex, { meaning: event.target.value })} /></label>
                      <label>投射解读<textarea rows={4} value={option.projection} onChange={(event) => updateOption(question.id, optionIndex, { projection: event.target.value })} /></label>
                      <label>计分类型<select value={option.scoreKey} onChange={(event) => updateOption(question.id, optionIndex, { scoreKey: event.target.value as TraitKey })}><option value="explorer">探索者</option><option value="connector">连接者</option><option value="architect">架构者</option><option value="creator">创造者</option></select></label>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            <footer><button className="danger-text-button" onClick={() => void removeQuestion(question)}>删除题目</button><div><button className="admin-ghost-button" onClick={() => updateQuestion(question.id, { active: !question.active })}>{question.active ? "转为草稿" : "设为上线"}</button><button className="admin-primary-button" disabled={savingId === question.id} onClick={() => void saveQuestion(question)}>{savingId === question.id ? "保存中…" : "保存题目"}</button></div></footer>
          </article>
        ))}
      </div>
    </>
  );
}

function TrafficPanel({ chartMax, funnel, funnelMax, stats }: { chartMax: number; funnel: { key: string; label: string; users: number }[]; funnelMax: number; stats: Stats | null }) {
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-kicker">获客与转化</span><h1>流量分析</h1><p>查看 TikTok 矩阵、UTM 活动和站内关键路径表现。</p></div></div>
      <section className="metric-grid four"><MetricCard accent="green" label="当前在线" value={stats?.onlineNow ?? 0} note="近 5 分钟活跃" live /><MetricCard label="今日流量" value={stats?.today.sessions ?? 0} note={`邮箱 ${stats?.today.leads ?? 0}`} /><MetricCard label="累计会话" value={stats?.totals.sessions ?? 0} note="全部来源" /><MetricCard accent="wine" label="累计邮箱" value={stats?.totals.leads ?? 0} note="完成邮箱解锁" /></section>
      <section className="admin-card chart-card traffic-full"><CardHeader title="最近 7 日流量趋势" subtitle="每天的访问与邮箱提交" /><SevenDayChart data={stats?.sevenDays ?? []} max={chartMax} /></section>
      <section className="dashboard-two-column equal"><div className="admin-card"><CardHeader title="流量来源" subtitle="来源参数与直接访问" /><SourceList sources={stats?.sources ?? []} /></div><div className="admin-card"><CardHeader title="完整转化漏斗" subtitle="发现具体流失节点" /><Funnel funnel={funnel} max={funnelMax} /></div></section>
      <section className="dashboard-two-column equal"><div className="admin-card"><CardHeader title="热门测试排行" subtitle="开始测试的独立用户" /><PopularTests items={stats?.popularTests ?? []} /></div><div className="admin-card"><CardHeader title="热门题目排行" subtitle="用户选择最多的题目" /><PopularQuestions items={stats?.popularQuestions ?? []} /></div></section>
    </>
  );
}

function EmailPanel({
  answerEvents,
  consentOnly,
  emailSearch,
  emails,
  exportEmails,
  questions,
  segmentFilter,
  setConsentOnly,
  setEmailSearch,
  setSegmentFilter,
}: {
  answerEvents: Stats["answerEvents"];
  consentOnly: boolean;
  emailSearch: string;
  emails: Stats["emails"];
  exportEmails: () => void;
  questions: QuizQuestion[];
  segmentFilter: string;
  setConsentOnly: (value: boolean) => void;
  setEmailSearch: (value: string) => void;
  setSegmentFilter: (value: string) => void;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const selectedLead = emails.find((lead) => lead.session_id === selectedSessionId);
  const selectedAnswers = selectedLead ? getLeadAnswerDetails(selectedLead, questions, answerEvents) : [];

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-kicker">用户资产</span><h1>邮箱用户</h1><p>查看每位用户的逐题选择、心理投射和营销分群，便于定向推荐后续产品。</p></div><button className="admin-primary-button" onClick={exportEmails}>导出分群 CSV</button></div>
      <div className="email-guidance"><strong>定向营销提示</strong><span>结果类型和答题倾向可以用来划分内容兴趣；实际发送邮件时，请仅使用“已授权营销”的用户。</span></div>
      <div className="email-toolbar">
        <label className="email-search">⌕<input placeholder="搜索邮箱、测试或类型" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} /></label>
        <label className="segment-filter">营销分群<select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}><option value="all">全部类型</option>{Object.entries(resultNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="consent-filter"><input checked={consentOnly} onChange={(event) => setConsentOnly(event.target.checked)} type="checkbox" />仅显示已授权营销</label>
        <span>共 {emails.length} 条记录</span>
      </div>
      <section className="admin-card email-table-card">
        <div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>邮箱地址</th><th>测试名称</th><th>结果类型</th><th>营销分群</th><th>流量来源</th><th>营销授权</th><th>提交时间</th><th>答题详情</th></tr></thead><tbody>{emails.map((lead) => <tr key={lead.session_id}><td><strong>{lead.email}</strong></td><td>{lead.test_title ?? lead.test_id ?? "未知测试"}</td><td><span className={`result-tag ${lead.result_type}`}>{resultNames[lead.result_type] ?? lead.result_type}</span></td><td><span className="segment-summary">{getMarketingTags(lead).slice(1).join(" · ") || "待分析"}</span></td><td>{lead.source ?? "direct"}</td><td>{lead.marketing_consent ? <span className="consent-yes">● 已授权</span> : <span className="consent-no">仅查看结果</span>}</td><td>{formatDate(lead.completed_at)}</td><td><button className="lead-detail-button" onClick={() => setSelectedSessionId(lead.session_id)}>查看详情 →</button></td></tr>)}</tbody></table></div>
        {!emails.length ? <EmptyState title="暂无邮箱记录" text="用户完成测试并提交邮箱后会显示在这里。" /> : null}
      </section>
      {selectedLead ? (
        <div className="lead-detail-backdrop" onClick={() => setSelectedSessionId("")} role="presentation">
          <aside aria-labelledby="lead-detail-title" aria-modal="true" className="lead-detail-drawer" onClick={(event) => event.stopPropagation()} role="dialog">
            <header className="lead-detail-header">
              <div><span>用户答题档案</span><h2 id="lead-detail-title">{selectedLead.email}</h2><p>{selectedLead.test_title ?? selectedLead.test_id ?? "未知测试"} · {formatDate(selectedLead.completed_at)}</p></div>
              <button aria-label="关闭答题详情" onClick={() => setSelectedSessionId("")}>×</button>
            </header>
            <section className="lead-profile-grid">
              <div><span>最终类型</span><strong>{resultNames[selectedLead.result_type] ?? selectedLead.result_type}</strong></div>
              <div><span>营销授权</span><strong className={selectedLead.marketing_consent ? "consent-yes" : "consent-no"}>{selectedLead.marketing_consent ? "已授权" : "未授权"}</strong></div>
              <div><span>流量来源</span><strong>{selectedLead.source ?? "direct"}</strong></div>
              <div><span>活动参数</span><strong>{selectedLead.campaign ?? "—"}</strong></div>
            </section>
            <section className="lead-marketing-card">
              <span>营销分群标签</span>
              <div>{getMarketingTags(selectedLead).map((tag) => <b key={tag}>{tag}</b>)}</div>
              <p><strong>适合推荐：</strong>{segmentRecommendations[selectedLead.result_type] ?? "根据测试内容人工判断"}</p>
            </section>
            <section className="lead-answer-section">
              <header><span>逐题选择</span><strong>{selectedAnswers.length} 条已保存答案</strong></header>
              <div className="lead-answer-list">
                {selectedAnswers.map((answer, index) => (
                  <article className="lead-answer-card" key={answer.questionId}>
                    <AnswerThumbnail answer={answer} />
                    <div>
                      <span>第 {index + 1} 题 · 用户选择 {answer.optionIndex >= 0 ? String.fromCharCode(65 + answer.optionIndex) : "—"}</span>
                      <h3>{answer.question?.prompt ?? `历史题目 ${answer.questionId}`}</h3>
                      <strong>{answer.optionLabel}</strong>
                      <p><b>代表含义：</b>{answer.option?.meaning ?? "历史选项内容已变更，保留了原始选择标签。"}</p>
                      <p><b>心理投射：</b>{answer.option?.projection ?? `已保存倾向：${resultNames[answer.scoreKey] ?? answer.scoreKey}`}</p>
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

function AnswerThumbnail({ answer }: { answer: LeadAnswerDetail }) {
  if (!answer.question || answer.optionIndex < 0) return <div className="lead-answer-thumb empty">?</div>;
  const horizontal = answer.optionIndex % 2 === 0 ? "0%" : "100%";
  const vertical = answer.optionIndex < 2 ? "0%" : "100%";
  return (
    <div
      aria-label={`选择 ${String.fromCharCode(65 + answer.optionIndex)} 的图片`}
      className="lead-answer-thumb"
      role="img"
      style={{ backgroundImage: `url(${answer.question.atlasPath})`, backgroundPosition: `${horizontal} ${vertical}` }}
    />
  );
}

function PaymentPanel() {
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-kicker">商业化配置</span><h1>支付设置</h1><p>支付入口已经预留，连接服务商后即可启用付费报告。</p></div></div>
      <section className="payment-provider-grid"><article><span className="provider-mark creem">C</span><div><strong>Creem</strong><small>适合数字产品和全球税务处理</small></div><span className="status-tag">待连接</span><button disabled>连接 Creem</button></article><article><span className="provider-mark stripe">S</span><div><strong>Stripe</strong><small>成熟的支付与订阅基础设施</small></div><span className="status-tag">待连接</span><button disabled>连接 Stripe</button></article></section>
      <section className="admin-card payment-checklist"><CardHeader title="上线付费报告前" subtitle="当前用户端已经保留升级入口" /><div><span>1</span><p><strong>选择支付服务商</strong><small>在 Creem 与 Stripe 中确定一个主要结账渠道。</small></p><b>待完成</b></div><div><span>2</span><p><strong>配置商品与价格</strong><small>创建完整报告商品，并获得 Price ID 或 Product ID。</small></p><b>待完成</b></div><div><span>3</span><p><strong>接入 Webhook</strong><small>付款成功后解锁报告，并记录订单状态。</small></p><b>待完成</b></div></section>
    </>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return <div className="admin-empty"><span>◇</span><strong>{title}</strong><p>{text}</p></div>;
}
