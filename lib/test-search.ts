export type SearchableTest = {
  id: string;
  position: number;
  title: string;
};

export function matchTestByQuery<T extends SearchableTest>(query: string, tests: T[]): T | null {
  const normalized = query.trim().toLowerCase().replace(/^#/, "");
  if (!normalized) return null;

  const digits = normalized.replace(/\s+/g, "");
  if (/^\d{1,2}$/.test(digits)) {
    const number = Number.parseInt(digits, 10);
    const byIndex = tests[number - 1];
    if (byIndex) return byIndex;
    return tests.find((test) => test.position === number) ?? null;
  }

  const exactId = tests.find((test) => test.id.toLowerCase() === normalized);
  if (exactId) return exactId;

  const matches = tests.filter((test) =>
    test.id.toLowerCase().includes(normalized) || test.title.toLowerCase().includes(normalized),
  );
  if (matches.length === 1) return matches[0];
  return matches.find((test) =>
    test.title.toLowerCase().startsWith(normalized) || test.id.toLowerCase().startsWith(normalized),
  ) ?? null;
}
