import assert from "node:assert/strict";
import test from "node:test";
import {
  adminStatsTimePredicate,
  completeAdminStatsSeries,
  resolveAdminStatsRange,
  shanghaiYmd,
} from "../lib/admin-stats-range.ts";

test("resolves admin stats ranges and fills Shanghai buckets", () => {
  assert.equal(resolveAdminStatsRange("today"), "today");
  assert.equal(resolveAdminStatsRange("yesterday"), "yesterday");
  assert.equal(resolveAdminStatsRange("30d"), "30d");
  assert.equal(resolveAdminStatsRange("week"), "7d");
  assert.match(adminStatsTimePredicate("started_at", "today"), /\+8 hours/);
  assert.match(adminStatsTimePredicate("created_at", "30d"), /-29 days/);

  const now = new Date("2026-09-09T15:40:00Z");
  assert.equal(shanghaiYmd(now), "2026-09-09");
  const days = completeAdminStatsSeries("7d", [{ day: "2026-09-09", leads: 2, sessions: 5 }], now);
  assert.equal(days.length, 7);
  assert.equal(days[0].day, "2026-09-03");
  assert.equal(days[6].sessions, 5);
  assert.equal(days[5].sessions, 0);

  const month = completeAdminStatsSeries("30d", [], now);
  assert.equal(month.length, 30);
  assert.equal(month[0].day, "2026-08-11");
  assert.equal(month[29].day, "2026-09-09");

  const hours = completeAdminStatsSeries(
    "today",
    [{ day: "2026-09-09 16:00", leads: 1, sessions: 3 }],
    now,
  );
  assert.equal(hours.length, 24);
  assert.equal(hours[0].day, "2026-09-09 00:00");
  assert.equal(hours[16].sessions, 3);
  assert.equal(hours[17].sessions, 0);

  const yesterday = completeAdminStatsSeries("yesterday", [], now);
  assert.equal(yesterday[0].day, "2026-09-08 00:00");
  assert.equal(yesterday[23].day, "2026-09-08 23:00");
});
