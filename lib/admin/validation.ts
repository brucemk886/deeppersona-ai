import { TRAIT_KEYS, type AffiliateProduct, type QuizQuestion, type QuizTest } from "@/lib/quiz";

export function isValidAffiliateProduct(value: AffiliateProduct): boolean {
  if (!value || typeof value.id !== "string" || !value.id.trim() || value.id.length > 100) return false;
  if (![value.name, value.description, value.url, value.buttonLabel].every((item) => typeof item === "string" && item.trim())) {
    return false;
  }
  if (value.name.length > 140 || value.description.length > 1000 || value.buttonLabel.length > 100) return false;
  if (!Number.isFinite(value.position) || typeof value.active !== "boolean") return false;
  try {
    const url = new URL(value.url);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function hasValidAffiliateProductIds(test: QuizTest) {
  return TRAIT_KEYS.every((key) => {
    const productId = test.results[key]?.affiliateProductId;
    return productId === undefined || (typeof productId === "string" && productId.length <= 100);
  });
}

export function isValidQuizTest(body: QuizTest): boolean {
  return (
    typeof body.id === "string" &&
    typeof body.title === "string" &&
    typeof body.kicker === "string" &&
    typeof body.description === "string" &&
    typeof body.coverAtlasPath === "string" &&
    typeof body.accent === "string" &&
    Number.isInteger(body.reportPriceCents) &&
    body.reportPriceCents >= 0 &&
    Number.isFinite(body.position) &&
    Boolean(body.results) &&
    TRAIT_KEYS.every((key) => body.results[key]?.key === key) &&
    hasValidAffiliateProductIds(body)
  );
}

export function isValidQuizQuestion(body: QuizQuestion): boolean {
  return (
    typeof body.id === "string" &&
    typeof body.testId === "string" &&
    typeof body.prompt === "string" &&
    typeof body.kicker === "string" &&
    typeof body.atlasPath === "string" &&
    Array.isArray(body.options) &&
    body.options.length === 4 &&
    body.options.every(
      (option) =>
        typeof option.label === "string" &&
        typeof option.microcopy === "string" &&
        typeof option.meaning === "string" &&
        typeof option.projection === "string" &&
        TRAIT_KEYS.includes(option.scoreKey),
    )
  );
}
