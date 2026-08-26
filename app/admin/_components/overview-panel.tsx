"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminJson } from "@/app/admin/_lib/api";
import {
  CardHeader,
  Funnel,
  MetricCard,
  PageHeading,
  RankList,
  SevenDayChart,
  SourceList,
  Toast,
} from "@/app/admin/_components/ui";
import { FUNNEL_STEPS } from "@/lib/admin/labels";

type Stats = {
  funnel: { event_name: string; users: number }[];
  onlineNow: number;
  popularQuestions: { answers: number; prompt: string; question_id: string; users: number }[];
  popularTests: { test_id: string; title: string; users: number }[];
  sevenDays: { day: string; leads: number; sessions: number }[];
  sources: { source: string; users: number }[];
  today: { leads: number; sessions: number };
  totals: { consented: number; leads: number; sessions: number };
};

export function OverviewPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setStats(await fetchAdminJson<Stats>("/api/admin/stats"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "统计数据读取失败");
      window.setTimeout(() => setNotice(""), 3200);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const funnel = useMemo(() => {
    const values = new Map(stats?.funnel.map((item) => [item.event_name, item.users]) ?? []);
    return FUNNEL_STEPS.map(([key, label]) => ({ key, label, users: values.get(key) ?? 0 }));
  }, [stats]);
  const funnelMax = Math.max(1, funnel[0]?.users ?? 0);
  const sevenDayTotal = stats?.sevenDays.reduce((sum, item) => sum + item.sessions, 0) ?? 0;
  const chartMax = Math.max(1, ...(stats?.sevenDays.map((item) => item.sessions) ?? [0]));
  const conversion = stats?.totals.sessions
    ? ((stats.totals.leads / stats.totals.sessions) * 100).toFixed(1)
    : "0.0";

  return (
    <>
      <Toast message={notice} />
      <PageHeading
        action={
          <button className="admin-ghost-button" onClick={() => void load()}>
            刷新数据
          </button>
        }
        kicker="实时经营数据"
        title="欢迎回来，今天的测试表现如下"
      />
      <div className="admin-page-heading" style={{ marginTop: -8, marginBottom: 18 }}>
        <span className="admin-date">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date())}</span>
      </div>

      <section className="metric-grid five">
        <MetricCard accent="green" label="当前在线" live note="最近 5 分钟活跃用户" value={loading ? "—" : stats?.onlineNow ?? 0} />
        <MetricCard label="今日访问" note={`今日新增邮箱 ${stats?.today.leads ?? 0}`} value={loading ? "—" : stats?.today.sessions ?? 0} />
        <MetricCard label="近 7 日流量" note="独立测试会话" value={loading ? "—" : sevenDayTotal} />
        <MetricCard label="累计邮箱" note={`营销授权 ${stats?.totals.consented ?? 0}`} value={loading ? "—" : stats?.totals.leads ?? 0} />
        <MetricCard accent="wine" label="邮箱转化率" note="访问 → 邮箱提交" value={`${conversion}%`} />
      </section>

      <section className="dashboard-two-column wide-left">
        <div className="admin-card chart-card">
          <CardHeader subtitle="访问会话与邮箱转化趋势" title="最近 7 日流量" />
          <SevenDayChart data={stats?.sevenDays ?? []} max={chartMax} />
        </div>
        <div className="admin-card">
          <CardHeader subtitle="各关键节点的独立用户" title="转化漏斗" />
          <Funnel funnel={funnel} max={funnelMax} />
        </div>
      </section>

      <section className="dashboard-two-column equal">
        <div className="admin-card">
          <CardHeader subtitle="按照用户选择次数排序" title="最热门题目" />
          <RankList
            emptyText="新版题目埋点上线后，会自动按选择次数排序。"
            emptyTitle="暂无热门题目数据"
            items={(stats?.popularQuestions ?? []).map((item) => ({
              id: item.question_id,
              label: item.prompt,
              value: item.answers,
            }))}
            valueLabel="次"
          />
        </div>
        <div className="admin-card">
          <CardHeader subtitle="用于 TikTok 矩阵账号归因" title="主要流量来源" />
          <SourceList sources={stats?.sources ?? []} />
        </div>
      </section>

      <section className="admin-card traffic-full">
        <CardHeader subtitle="按照开始测试的独立用户数排序" title="热门测试排行" />
        <RankList
          emptyText="首批测试上线后，会自动按开始人数排序。"
          emptyTitle="暂无热门测试数据"
          items={(stats?.popularTests ?? []).map((item) => ({
            id: item.test_id,
            label: item.title,
            value: item.users,
          }))}
          valueLabel="人"
        />
      </section>
    </>
  );
}
