"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizQuestion, TraitKey } from "@/lib/quiz";

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
  totals: { consented: number; leads: number; sessions: number };
};

const funnelOrder = [
  ["quiz_started", "Started"],
  ["answer_selected", "Answered"],
  ["email_gate_viewed", "Reached email"],
  ["result_viewed", "Viewed result"],
] as const;

export function AdminDashboard({
  adminEmail,
  hasAllowlist,
  signOutPath,
}: {
  adminEmail: string;
  hasAllowlist: boolean;
  signOutPath: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/stats").then((response) => response.json()),
      fetch("/api/questions?all=1").then((response) => response.json()),
    ]).then(([statsData, questionData]) => {
      setStats(statsData);
      setQuestions(questionData.questions ?? []);
    });
  }, []);

  const funnel = useMemo(() => {
    const values = new Map(stats?.funnel.map((item) => [item.event_name, item.users]) ?? []);
    return funnelOrder.map(([key, label]) => ({ key, label, users: values.get(key) ?? 0 }));
  }, [stats]);
  const funnelMax = Math.max(1, funnel[0]?.users ?? 0);

  function updateQuestion(id: string, patch: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  }

  function updateOption(
    questionId: string,
    index: number,
    patch: { label?: string; scoreKey?: TraitKey },
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ...patch } : option,
              ),
            }
          : question,
      ),
    );
  }

  async function save(question: QuizQuestion) {
    setSavingId(question.id);
    try {
      await fetch("/api/questions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(question),
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="admin-shell">
      <nav className="admin-nav">
        <a className="brand" href="/"><span className="brand-mark">IA</span><span>Inner Atlas / Admin</span></a>
        <div className="admin-nav-actions"><span>{adminEmail}</span><a href={signOutPath}>Sign out</a></div>
      </nav>
      <div className="admin-main">
        <header className="admin-heading">
          <div><span className="pill">Growth console</span><h1>Quiz performance</h1></div>
          <p>Track where visitors leave, which sources convert, and update the live question copy without redeploying.</p>
        </header>

        {!hasAllowlist ? (
          <div className="admin-notice">
            MVP mode: any signed-in ChatGPT user can access this private site. Set ADMIN_EMAILS before making the site public.
          </div>
        ) : null}

        <section className="stat-grid">
          <div className="stat-card"><span>Sessions</span><strong>{stats?.totals.sessions ?? "—"}</strong></div>
          <div className="stat-card"><span>Captured emails</span><strong>{stats?.totals.leads ?? "—"}</strong></div>
          <div className="stat-card"><span>Marketing opt-ins</span><strong>{stats?.totals.consented ?? "—"}</strong></div>
        </section>

        <section className="admin-grid">
          <div className="admin-panel">
            <h2>Conversion funnel</h2>
            {funnel.map((item) => (
              <div className="funnel-row" key={item.key}>
                <span>{item.label}</span>
                <div className="funnel-bar"><span style={{ width: `${(item.users / funnelMax) * 100}%` }} /></div>
                <strong>{item.users}</strong>
              </div>
            ))}
          </div>
          <div className="admin-panel">
            <h2>Traffic sources</h2>
            {(stats?.sources ?? []).map((source) => (
              <div className="source-row" key={source.source}><span>{source.source}</span><strong>{source.users}</strong></div>
            ))}
          </div>
        </section>

        <div className="admin-section-heading"><h2>Question manager</h2><span className="pill">{questions.length} questions</span></div>
        {questions.map((question) => (
          <section className="question-editor" key={question.id}>
            <div className="question-thumb atlas-image atlas-0" style={{ backgroundImage: `url(${question.atlasPath})` }} />
            <div className="question-fields">
              <input value={question.kicker} aria-label={`${question.id} kicker`} onChange={(event) => updateQuestion(question.id, { kicker: event.target.value })} />
              <input value={question.prompt} aria-label={`${question.id} prompt`} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} />
              <div className="question-options">
                {question.options.map((option, index) => (
                  <div className="option-edit" key={index}>
                    <input value={option.label} aria-label={`${question.id} option ${index + 1}`} onChange={(event) => updateOption(question.id, index, { label: event.target.value })} />
                    <select value={option.scoreKey} aria-label={`${question.id} score ${index + 1}`} onChange={(event) => updateOption(question.id, index, { scoreKey: event.target.value as TraitKey })}>
                      <option value="explorer">Explorer</option><option value="connector">Connector</option><option value="architect">Architect</option><option value="creator">Creator</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <button className="save-button" onClick={() => save(question)}>{savingId === question.id ? "Saving…" : "Save"}</button>
          </section>
        ))}

        <div className="admin-section-heading"><h2>Recent leads</h2><span className="pill">Email-ready</span></div>
        <section className="admin-panel table-scroll">
          <table className="lead-table">
            <thead><tr><th>Email</th><th>Type</th><th>Source</th><th>Marketing</th><th>Captured</th></tr></thead>
            <tbody>
              {(stats?.emails ?? []).map((lead) => (
                <tr key={`${lead.email}-${lead.completed_at}`}>
                  <td>{lead.email}</td><td>{lead.result_type}</td><td>{lead.source ?? "direct"}</td><td>{lead.marketing_consent ? "Opted in" : "Result only"}</td><td>{new Date(lead.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
