"use client";

import { useCallback, useState, type ReactNode } from "react";
import { formatAdminDay } from "@/lib/admin/labels";

export function PageHeading({
  action,
  description,
  kicker,
  title,
}: {
  action?: ReactNode;
  description?: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="admin-page-heading">
      <div>
        <span className="admin-kicker">{kicker}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
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
      <div>
        <span>{label}</span>
        {live ? <i className="metric-live" /> : null}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function CardHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <header className="card-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span>•••</span>
    </header>
  );
}

export function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <div className="admin-empty">
      <span>◇</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function SevenDayChart({
  data,
  max,
}: {
  data: { day: string; leads: number; sessions: number }[];
  max: number;
}) {
  return (
    <div className="seven-day-chart">
      <div className="chart-lines">
        <i />
        <i />
        <i />
        <i />
      </div>
      {data.map((item) => (
        <div className="day-column" key={item.day}>
          <div className="day-value">{item.sessions}</div>
          <div className="bar-wrap">
            <span className="session-bar" style={{ height: `${Math.max(4, (item.sessions / max) * 100)}%` }} />
            <span className="lead-bar" style={{ height: `${Math.max(0, (item.leads / max) * 100)}%` }} />
          </div>
          <small>{formatAdminDay(item.day)}</small>
        </div>
      ))}
      <div className="chart-legend">
        <span>
          <i className="legend-session" />
          访问
        </span>
        <span>
          <i className="legend-lead" />
          邮箱
        </span>
      </div>
    </div>
  );
}

export function Funnel({
  funnel,
  max,
}: {
  funnel: { key: string; label: string; users: number }[];
  max: number;
}) {
  return (
    <div className="funnel-list-cn">
      {funnel.map((item, index) => {
        const previous = index === 0 ? item.users : funnel[index - 1]?.users ?? 0;
        const rate = previous ? Math.round((item.users / previous) * 100) : 0;
        return (
          <div className="funnel-item-cn" key={item.key}>
            <div>
              <span>{index + 1}</span>
              <strong>{item.label}</strong>
              <b>{item.users}</b>
            </div>
            <div className="funnel-track-cn">
              <i style={{ width: `${(item.users / max) * 100}%` }} />
            </div>
            <small>{index === 0 ? "基准流量" : `上一步留存 ${rate}%`}</small>
          </div>
        );
      })}
    </div>
  );
}

export function RankList({
  emptyText,
  emptyTitle,
  items,
  valueLabel,
}: {
  emptyText: string;
  emptyTitle: string;
  items: { id: string; label: string; value: number }[];
  valueLabel: string;
}) {
  if (!items.length) return <EmptyState title={emptyTitle} text={emptyText} />;
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="popular-list">
      {items.map((item, index) => (
        <div className="popular-row" key={item.id}>
          <span className="rank">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.label}</strong>
            <span>
              <i style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
          </div>
          <b>
            {item.value} {valueLabel}
          </b>
        </div>
      ))}
    </div>
  );
}

export function SourceList({ sources }: { sources: { source: string; users: number }[] }) {
  if (!sources.length) return <EmptyState title="暂无来源数据" text="带 UTM 或 ttclid 的访问会自动归因。" />;
  const max = Math.max(1, ...sources.map((source) => source.users));
  return (
    <div className="source-list-cn">
      {sources.map((source) => (
        <div key={source.source}>
          <span>
            <i className={source.source.includes("tiktok") ? "tiktok-dot" : ""} />
            {source.source}
          </span>
          <div>
            <i style={{ width: `${(source.users / max) * 100}%` }} />
          </div>
          <b>{source.users}</b>
        </div>
      ))}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="admin-toast" role="status">
      {message}
    </div>
  );
}

export function useNotice(durationMs = 2600) {
  const [notice, setNotice] = useState("");
  const showNotice = useCallback(
    (message: string) => {
      setNotice(message);
      window.setTimeout(() => setNotice(""), durationMs);
    },
    [durationMs],
  );
  return { notice, showNotice };
}
