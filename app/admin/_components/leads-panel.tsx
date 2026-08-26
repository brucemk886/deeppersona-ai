"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminJson } from "@/app/admin/_lib/api";
import { EmptyState, PageHeading, Toast, useNotice } from "@/app/admin/_components/ui";
import { formatAdminDate, RESULT_NAMES, SEGMENT_RECOMMENDATIONS } from "@/lib/admin/labels";
import { getLeadAnswerDetails, getMarketingTags, type LeadAnswerDetail } from "@/lib/admin/leads";
import type { AdminAnswerEvent, AdminLeadRow } from "@/lib/admin/types";
import type { QuizQuestion } from "@/lib/quiz";

export function LeadsPanel() {
  const { notice, showNotice } = useNotice();
  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedLead, setSelectedLead] = useState<AdminLeadRow | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<LeadAnswerDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
        segment: segmentFilter,
      });
      if (consentOnly) params.set("consent", "1");
      if (emailSearch.trim()) params.set("q", emailSearch.trim());

      const [leadsResult, questionsResult] = await Promise.all([
        fetchAdminJson<{ leads: AdminLeadRow[]; total: number }>(`/api/admin/leads?${params}`),
        fetchAdminJson<{ questions: QuizQuestion[] }>("/api/admin/questions"),
      ]);
      setLeads(leadsResult.leads ?? []);
      setTotal(leadsResult.total ?? 0);
      setQuestions(questionsResult.questions ?? []);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "线索读取失败");
    } finally {
      setLoading(false);
    }
  }, [consentOnly, emailSearch, segmentFilter, showNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openDetail(sessionId: string) {
    setSelectedSessionId(sessionId);
    try {
      const detail = await fetchAdminJson<{ answerEvents: AdminAnswerEvent[]; lead: AdminLeadRow }>(
        `/api/admin/leads?session=${encodeURIComponent(sessionId)}`,
      );
      setSelectedLead(detail.lead);
      setSelectedAnswers(getLeadAnswerDetails(detail.lead, questions, detail.answerEvents));
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "详情读取失败");
      setSelectedSessionId("");
    }
  }

  function exportEmails() {
    const escape = (value: unknown) => {
      const safe = String(value ?? "").replace(/^([=+\-@])/, "'$1").replaceAll('"', '""');
      return `"${safe}"`;
    };
    const rows = [
      ["邮箱", "测试名称", "结果类型", "营销分群", "推荐产品方向", "流量来源", "活动参数", "营销授权", "提交时间"],
      ...leads.map((lead) => [
        lead.email,
        lead.test_title ?? lead.test_id ?? "未知测试",
        RESULT_NAMES[lead.result_type] ?? lead.result_type,
        getMarketingTags(lead).join("；"),
        SEGMENT_RECOMMENDATIONS[lead.result_type] ?? "根据测试内容人工判断",
        lead.source ?? "direct",
        lead.campaign ?? "—",
        lead.marketing_consent ? "已授权" : "仅查看结果",
        lead.completed_at,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deep-persona-ai-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Toast message={notice} />
      <PageHeading
        action={
          <button className="admin-primary-button" onClick={exportEmails}>
            导出分群 CSV
          </button>
        }
        description="查看每位用户的逐题选择、心理投射和营销分群，便于定向推荐后续产品。"
        kicker="用户资产"
        title="邮箱用户"
      />
      <div className="email-guidance">
        <strong>定向营销提示</strong>
        <span>结果类型和答题倾向可以用来划分内容兴趣；实际发送邮件时，请仅使用“已授权营销”的用户。</span>
      </div>
      <div className="email-toolbar">
        <label className="email-search">
          ⌕
          <input placeholder="搜索邮箱、测试或类型" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} />
        </label>
        <label className="segment-filter">
          营销分群
          <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {Object.entries(RESULT_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="consent-filter">
          <input checked={consentOnly} onChange={(event) => setConsentOnly(event.target.checked)} type="checkbox" />
          仅显示已授权营销
        </label>
        <span>
          共 {total} 条记录{loading ? " · 加载中" : ""}
        </span>
      </div>

      <section className="admin-card email-table-card">
        <div className="table-scroll">
          <table className="lead-table-cn">
            <thead>
              <tr>
                <th>邮箱地址</th>
                <th>测试名称</th>
                <th>结果类型</th>
                <th>营销分群</th>
                <th>流量来源</th>
                <th>营销授权</th>
                <th>提交时间</th>
                <th>答题详情</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.session_id}>
                  <td>
                    <strong>{lead.email}</strong>
                  </td>
                  <td>{lead.test_title ?? lead.test_id ?? "未知测试"}</td>
                  <td>
                    <span className={`result-tag ${lead.result_type}`}>{RESULT_NAMES[lead.result_type] ?? lead.result_type}</span>
                  </td>
                  <td>
                    <span className="segment-summary">{getMarketingTags(lead).slice(1).join(" · ") || "待分析"}</span>
                  </td>
                  <td>{lead.source ?? "direct"}</td>
                  <td>
                    {lead.marketing_consent ? <span className="consent-yes">● 已授权</span> : <span className="consent-no">仅查看结果</span>}
                  </td>
                  <td>{formatAdminDate(lead.completed_at)}</td>
                  <td>
                    <button className="lead-detail-button" onClick={() => void openDetail(lead.session_id)}>
                      查看详情 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!leads.length ? <EmptyState title="暂无邮箱记录" text="用户完成测试并提交邮箱后会显示在这里。" /> : null}
      </section>

      {selectedSessionId && selectedLead ? (
        <div className="lead-detail-backdrop" onClick={() => setSelectedSessionId("")} role="presentation">
          <aside
            aria-labelledby="lead-detail-title"
            aria-modal="true"
            className="lead-detail-drawer"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="lead-detail-header">
              <div>
                <span>用户答题档案</span>
                <h2 id="lead-detail-title">{selectedLead.email}</h2>
                <p>
                  {selectedLead.test_title ?? selectedLead.test_id ?? "未知测试"} · {formatAdminDate(selectedLead.completed_at)}
                </p>
              </div>
              <button aria-label="关闭答题详情" onClick={() => setSelectedSessionId("")}>
                ×
              </button>
            </header>
            <section className="lead-profile-grid">
              <div>
                <span>最终类型</span>
                <strong>{RESULT_NAMES[selectedLead.result_type] ?? selectedLead.result_type}</strong>
              </div>
              <div>
                <span>营销授权</span>
                <strong className={selectedLead.marketing_consent ? "consent-yes" : "consent-no"}>
                  {selectedLead.marketing_consent ? "已授权" : "未授权"}
                </strong>
              </div>
              <div>
                <span>流量来源</span>
                <strong>{selectedLead.source ?? "direct"}</strong>
              </div>
              <div>
                <span>活动参数</span>
                <strong>{selectedLead.campaign ?? "—"}</strong>
              </div>
            </section>
            <section className="lead-marketing-card">
              <span>营销分群标签</span>
              <div>
                {getMarketingTags(selectedLead).map((tag) => (
                  <b key={tag}>{tag}</b>
                ))}
              </div>
              <p>
                <strong>适合推荐：</strong>
                {SEGMENT_RECOMMENDATIONS[selectedLead.result_type] ?? "根据测试内容人工判断"}
              </p>
            </section>
            <section className="lead-answer-section">
              <header>
                <span>逐题选择</span>
                <strong>{selectedAnswers.length} 条已保存答案</strong>
              </header>
              <div className="lead-answer-list">
                {selectedAnswers.map((answer, index) => (
                  <article className="lead-answer-card" key={answer.questionId}>
                    <AnswerThumbnail answer={answer} />
                    <div>
                      <span>
                        第 {index + 1} 题 · 用户选择 {answer.optionIndex >= 0 ? String.fromCharCode(65 + answer.optionIndex) : "—"}
                      </span>
                      <h3>{answer.question?.prompt ?? `历史题目 ${answer.questionId}`}</h3>
                      <strong>{answer.optionLabel}</strong>
                      <p>
                        <b>代表含义：</b>
                        {answer.option?.meaning ?? "历史选项内容已变更，保留了原始选择标签。"}
                      </p>
                      <p>
                        <b>心理投射：</b>
                        {answer.option?.projection ?? `已保存倾向：${RESULT_NAMES[answer.scoreKey] ?? answer.scoreKey}`}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              {!selectedAnswers.length ? (
                <EmptyState title="暂无逐题答案" text="该记录可能来自旧版本；后续新提交会完整显示每一道选择。" />
              ) : null}
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
      style={{
        backgroundImage: `url(${answer.question.atlasPath})`,
        backgroundPosition: `${horizontal} ${vertical}`,
      }}
    />
  );
}
