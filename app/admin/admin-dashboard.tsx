"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { QuizQuestion, TraitKey } from "@/lib/quiz";

type AdminSection = "overview" | "questions" | "traffic" | "emails" | "payments";

type Stats = {
  funnel: { event_name: string; users: number }[];
  sources: { source: string; users: number }[];
  emails: {
    completed_at: string;
    email: string;
    marketing_consent: number;
    result_type: string;
    source: string | null;
  }[];
  onlineNow: number;
  popularQuestions: { answers: number; prompt: string; question_id: string; users: number }[];
  sevenDays: { day: string; leads: number; sessions: number }[];
  today: { leads: number; sessions: number };
  totals: { consented: number; leads: number; sessions: number };
};

const navigation: { id: AdminSection; icon: string; label: string }[] = [
  { id: "overview", icon: "概", label: "数据概览" },
  { id: "questions", icon: "题", label: "题目管理" },
  { id: "traffic", icon: "流", label: "流量分析" },
  { id: "emails", icon: "邮", label: "邮箱用户" },
  { id: "payments", icon: "付", label: "支付设置" },
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

const blankOptions = [
  { label: "选项 A", microcopy: "补充说明", scoreKey: "explorer" as TraitKey },
  { label: "选项 B", microcopy: "补充说明", scoreKey: "connector" as TraitKey },
  { label: "选项 C", microcopy: "补充说明", scoreKey: "architect" as TraitKey },
  { label: "选项 D", microcopy: "补充说明", scoreKey: "creator" as TraitKey },
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
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [consentOnly, setConsentOnly] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [statsResponse, questionsResponse] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/questions?all=1", { cache: "no-store" }),
      ]);
      if (!statsResponse.ok || !questionsResponse.ok) throw new Error("后台数据读取失败");
      const [statsData, questionData] = await Promise.all([
        statsResponse.json() as Promise<Stats>,
        questionsResponse.json() as Promise<{ questions: QuizQuestion[] }>,
      ]);
      setStats(statsData);
      setQuestions(questionData.questions ?? []);
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
        (!needle || lead.email.toLowerCase().includes(needle)) &&
        (!consentOnly || Boolean(lead.marketing_consent)),
    );
  }, [consentOnly, emailSearch, stats]);

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
    next: { label?: string; microcopy?: string; scoreKey?: TraitKey },
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
    const id = `question-${Date.now()}`;
    const position = Math.max(0, ...questions.map((question) => question.position)) + 1;
    const question: QuizQuestion = {
      id,
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
      ["邮箱", "人格类型", "流量来源", "营销授权", "提交时间"],
      ...filteredEmails.map((lead) => [
        lead.email,
        resultNames[lead.result_type] ?? lead.result_type,
        lead.source ?? "direct",
        lead.marketing_consent ? "已授权" : "仅查看结果",
        lead.completed_at,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inner-atlas-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-shell admin-cn">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/">
          <span className="brand-mark">IA</span>
          <span><strong>Inner Atlas</strong><small>运营管理后台</small></span>
        </Link>
        <nav className="admin-side-nav" aria-label="后台导航">
          <span className="admin-nav-label">工作台</span>
          {navigation.slice(0, 4).map((item) => (
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
          {navigation.slice(4).map((item) => (
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
            <small>Inner Atlas / {navigation.find((item) => item.id === activeSection)?.label}</small>
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
              questions={questions}
              removeQuestion={removeQuestion}
              saveQuestion={saveQuestion}
              savingId={savingId}
              updateOption={updateOption}
              updateQuestion={updateQuestion}
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
              setConsentOnly={setConsentOnly}
              setEmailSearch={setEmailSearch}
            />
          ) : null}

          {activeSection === "payments" ? <PaymentPanel /> : null}
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

function QuestionManager({
  addQuestion,
  questions,
  removeQuestion,
  saveQuestion,
  savingId,
  updateOption,
  updateQuestion,
}: {
  addQuestion: () => void;
  questions: QuizQuestion[];
  removeQuestion: (question: QuizQuestion) => Promise<void>;
  saveQuestion: (question: QuizQuestion) => Promise<void>;
  savingId: string;
  updateOption: (id: string, index: number, next: { label?: string; microcopy?: string; scoreKey?: TraitKey }) => void;
  updateQuestion: (id: string, next: Partial<QuizQuestion>) => void;
}) {
  return (
    <>
      <div className="admin-page-heading question-heading-admin">
        <div><span className="admin-kicker">测评内容</span><h1>题目管理</h1><p>新增、编辑、排序和上下线图片题目。保存后用户端立即生效。</p></div>
        <button className="admin-primary-button" onClick={addQuestion}>＋ 新增题目</button>
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
      <section className="admin-card traffic-full"><CardHeader title="热门题目排行" subtitle="用户选择最多的题目" /><PopularQuestions items={stats?.popularQuestions ?? []} /></section>
    </>
  );
}

function EmailPanel({ consentOnly, emailSearch, emails, exportEmails, setConsentOnly, setEmailSearch }: { consentOnly: boolean; emailSearch: string; emails: Stats["emails"]; exportEmails: () => void; setConsentOnly: (value: boolean) => void; setEmailSearch: (value: string) => void }) {
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-kicker">用户资产</span><h1>邮箱用户</h1><p>查看测试结果、来源和邮件营销授权状态。</p></div><button className="admin-primary-button" onClick={exportEmails}>导出 CSV</button></div>
      <div className="email-toolbar"><label className="email-search">⌕<input placeholder="搜索邮箱地址" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} /></label><label className="consent-filter"><input checked={consentOnly} onChange={(event) => setConsentOnly(event.target.checked)} type="checkbox" />仅显示已授权营销</label><span>共 {emails.length} 条记录</span></div>
      <section className="admin-card email-table-card">
        <div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>邮箱地址</th><th>测试类型</th><th>流量来源</th><th>营销授权</th><th>提交时间</th></tr></thead><tbody>{emails.map((lead) => <tr key={`${lead.email}-${lead.completed_at}`}><td><strong>{lead.email}</strong></td><td><span className={`result-tag ${lead.result_type}`}>{resultNames[lead.result_type] ?? lead.result_type}</span></td><td>{lead.source ?? "direct"}</td><td>{lead.marketing_consent ? <span className="consent-yes">● 已授权</span> : <span className="consent-no">仅查看结果</span>}</td><td>{formatDate(lead.completed_at)}</td></tr>)}</tbody></table></div>
        {!emails.length ? <EmptyState title="暂无邮箱记录" text="用户完成测试并提交邮箱后会显示在这里。" /> : null}
      </section>
    </>
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
