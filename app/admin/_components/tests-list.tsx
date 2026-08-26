"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchAdminJson } from "@/app/admin/_lib/api";
import { EmptyState, PageHeading, Toast } from "@/app/admin/_components/ui";
import type { QuizTest } from "@/lib/quiz";

export function TestsListPanel() {
  const [tests, setTests] = useState<QuizTest[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminJson<{ tests: QuizTest[] }>("/api/admin/tests");
      setTests(result.tests ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "测试列表读取失败");
      window.setTimeout(() => setNotice(""), 3200);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <>
      <Toast message={notice} />
      <PageHeading
        description="一个测试对应前台一张测试卡。进入详情可同时管理基础信息、结果配置与全部题目。"
        kicker="内容产品"
        title="测试内容"
      />
      <div className="question-summary-strip">
        <span>
          <strong>{tests.length}</strong>全部测试
        </span>
        <span>
          <strong>{tests.filter((item) => item.active).length}</strong>已上线
        </span>
        <span>
          <strong>{tests.reduce((sum, item) => sum + (item.questionCount ?? 0), 0)}</strong>上线题目
        </span>
        <small>前台保持英文；这里使用中文操作提示。</small>
      </div>

      {loading ? <EmptyState title="正在加载测试" text="请稍候…" /> : null}

      <div className="test-manager-grid">
        {tests.map((test, index) => (
          <article className="test-editor-card" key={test.id}>
            <div className="test-editor-cover">
              <span className="atlas-image atlas-0" style={{ backgroundImage: `url(${test.coverAtlasPath})` }} />
              <b>{String(index + 1).padStart(2, "0")}</b>
            </div>
            <div className="test-editor-fields">
              <div className="test-editor-status">
                <small>ID: {test.id}</small>
                <span className={`status-tag ${test.active ? "" : "draft"}`}>{test.active ? "已上线" : "草稿"}</span>
              </div>
              <strong style={{ fontSize: 18, color: "var(--admin-text)" }}>{test.title}</strong>
              <p style={{ margin: 0, color: "var(--admin-muted)", fontSize: 13, lineHeight: 1.5 }}>{test.description}</p>
              <div className="question-summary-strip" style={{ margin: 0, padding: "10px 12px" }}>
                <span>
                  <strong>{test.questionCount ?? 0}</strong>上线题目
                </span>
                <span>
                  <strong>{(test.reportPriceCents / 100).toFixed(2)}</strong>USD
                </span>
                <span>
                  <strong>{test.featured ? "是" : "否"}</strong>主推
                </span>
              </div>
              <Link className="admin-primary-button" href={`/admin/tests/${encodeURIComponent(test.id)}`}>
                编辑测试与题目 →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!loading && !tests.length ? (
        <div className="admin-empty-state">
          <strong>还没有测试</strong>
          <p>数据库初始化后会自动写入默认测试目录。</p>
        </div>
      ) : null}
    </>
  );
}
