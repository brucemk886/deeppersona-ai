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

const SHANGHAI = "Asia/Shanghai";

export function resolveAdminStatsRange(raw?: string | null): AdminStatsRange {
  return ADMIN_STATS_RANGES.includes(raw as AdminStatsRange) ? (raw as AdminStatsRange) : "7d";
}

export function isHourlyAdminStatsRange(range: AdminStatsRange): boolean {
  return range === "today" || range === "yesterday";
}

function shanghaiShift(daysAgo: number, extra = "") {
  const dayPart = daysAgo === 0 ? "" : `, '-${daysAgo} days'`;
  return `datetime('now', '+8 hours'${dayPart}${extra}, 'start of day', '-8 hours')`;
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
        startExpr: shanghaiShift(0),
        endExpr: shanghaiShift(0, ", '+1 day'"),
        buckets: 24,
        hourly: true,
      };
    case "yesterday":
      return {
        startExpr: shanghaiShift(1),
        endExpr: shanghaiShift(0),
        buckets: 24,
        hourly: true,
      };
    case "7d":
      return {
        startExpr: shanghaiShift(6),
        endExpr: null,
        buckets: 7,
        hourly: false,
      };
    case "30d":
      return {
        startExpr: shanghaiShift(29),
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

export function shanghaiDayExpr(column: string) {
  return `date(${column}, '+8 hours')`;
}

export function shanghaiHourExpr(column: string) {
  return `strftime('%Y-%m-%d %H:00', ${column}, '+8 hours')`;
}

export function shanghaiYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function ymdToUtcDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function utcDateToYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function completeAdminStatsSeries(
  range: AdminStatsRange,
  rows: AdminStatsBucket[],
  now = new Date(),
): AdminStatsBucket[] {
  const byKey = new Map(rows.map((item) => [item.day, item]));
  if (isHourlyAdminStatsRange(range)) {
    const start = ymdToUtcDate(shanghaiYmd(now));
    if (range === "yesterday") start.setUTCDate(start.getUTCDate() - 1);
    const day = utcDateToYmd(start);
    return Array.from({ length: 24 }, (_, hour) => {
      const key = `${day} ${String(hour).padStart(2, "0")}:00`;
      return byKey.get(key) ?? { day: key, leads: 0, sessions: 0 };
    });
  }

  const days = range === "30d" ? 30 : 7;
  const end = ymdToUtcDate(shanghaiYmd(now));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    const day = utcDateToYmd(date);
    return byKey.get(day) ?? { day, leads: 0, sessions: 0 };
  });
}
