export const ADMIN_STATS_RANGES = ["today", "yesterday", "7d", "30d"] as const;

export type AdminStatsRange = (typeof ADMIN_STATS_RANGES)[number];

export type AdminStatsBucket = {
  day: string;
  leads: number;
  sessions: number;
};

export const ADMIN_STATS_RANGE_LABELS: Record<AdminStatsRange, string> = {
  today: "今天",
  yesterday: "昨天",
  "7d": "近7天",
  "30d": "近30天",
};

export function resolveAdminStatsRange(raw?: string | null): AdminStatsRange {
  return ADMIN_STATS_RANGES.includes(raw as AdminStatsRange) ? (raw as AdminStatsRange) : "7d";
}

export function isHourlyAdminStatsRange(range: AdminStatsRange): boolean {
  return range === "today" || range === "yesterday";
}

export function adminStatsRangeWindow(range: AdminStatsRange): {
  buckets: number;
  endExpr: string | null;
  hourly: boolean;
  startExpr: string;
} {
  switch (range) {
    case "today":
      return {
        startExpr: "datetime('now', 'start of day')",
        endExpr: "datetime('now', '+1 day', 'start of day')",
        buckets: 24,
        hourly: true,
      };
    case "yesterday":
      return {
        startExpr: "datetime('now', '-1 day', 'start of day')",
        endExpr: "datetime('now', 'start of day')",
        buckets: 24,
        hourly: true,
      };
    case "7d":
      return {
        startExpr: "datetime('now', '-6 days', 'start of day')",
        endExpr: null,
        buckets: 7,
        hourly: false,
      };
    case "30d":
      return {
        startExpr: "datetime('now', '-29 days', 'start of day')",
        endExpr: null,
        buckets: 30,
        hourly: false,
      };
  }
}

export function adminStatsTimePredicate(column: string, range: AdminStatsRange): string {
  const { endExpr, startExpr } = adminStatsRangeWindow(range);
  return endExpr ? `${column} >= ${startExpr} AND ${column} < ${endExpr}` : `${column} >= ${startExpr}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function utcHourKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ${pad2(date.getUTCHours())}:00`;
}

export function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function completeAdminStatsSeries(
  range: AdminStatsRange,
  rows: AdminStatsBucket[],
  now = new Date(),
): AdminStatsBucket[] {
  const byKey = new Map(rows.map((item) => [item.day, item]));
  if (isHourlyAdminStatsRange(range)) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (range === "yesterday") start.setUTCDate(start.getUTCDate() - 1);
    return Array.from({ length: 24 }, (_, hour) => {
      const date = new Date(start);
      date.setUTCHours(hour);
      const day = utcHourKey(date);
      return byKey.get(day) ?? { day, leads: 0, sessions: 0 };
    });
  }

  const days = range === "30d" ? 30 : 7;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    const day = utcDayKey(date);
    return byKey.get(day) ?? { day, leads: 0, sessions: 0 };
  });
}
