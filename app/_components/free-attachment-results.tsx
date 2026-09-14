import Link from "next/link";
import {
  HowYouScored,
  LockedInsightCard,
  PremiumLock,
  SelfWorthRing,
  StyleBanner,
} from "@/app/_components/attachment-result";
import { SceneCard, sceneKeyFromPath } from "@/app/_components/scene-card";
import { ATTACHMENT_STYLE_META, isAttachmentStyle } from "@/lib/attachment";
import type { ReportResponse } from "@/lib/payment-types";
import type { ResultProfile } from "@/lib/quiz";

type AtlasImageProps = {
  path: string;
  index: number;
  className?: string;
  loading?: "eager" | "lazy";
};

function AtlasThumb({ path, index, className = "", loading = "eager" }: AtlasImageProps) {
  return (
    <span className={`atlas-image atlas-${index} ${className}`.trim()} aria-hidden="true">
      <img alt="" decoding="async" height="1254" loading={loading} src={path} width="1254" />
    </span>
  );
}

export function FreeAttachmentResults({
  result,
  preview,
  testTitle,
  amountCents,
  sandbox,
  checkoutReady,
  submitting,
  refundPolicy,
  status,
  error,
  paymentQuery,
  onCheckout,
  onRefresh,
}: {
  result: ResultProfile;
  preview: NonNullable<ReportResponse["preview"]>;
  testTitle: string;
  amountCents: number;
  sandbox: boolean;
  checkoutReady: boolean;
  submitting: boolean;
  refundPolicy: string;
  status: string;
  error?: string;
  paymentQuery?: string | null;
  onCheckout: () => void;
  onRefresh: () => void;
}) {
  const style = isAttachmentStyle(result.key) ? result.key : null;
  const title = style ? ATTACHMENT_STYLE_META[style].label : result.title;
  const subtitle = result.themeTitle || result.summary;
  const scores = preview.scores ?? {
    anxiety: result.anxiety ?? 0,
    avoidance: result.avoidance ?? 0,
  };
  const price = `$${(amountCents / 100).toFixed(2)}`;
  return (
    <article className="ap-results">
      <header className="ap-hero">
        <p className="ap-kicker">{testTitle}</p>
        <h1>{title}</h1>
        <p className="ap-hero-sub">{subtitle}</p>
        <StyleBanner styleKey={result.key} />
      </header>

      <HowYouScored anxiety={scores.anxiety} avoidance={scores.avoidance} />

      <section className="ap-section" aria-labelledby="romance-title">
        <h2 id="romance-title">Your romantic patterns</h2>
        {preview.romanceEssay ? <p className="ap-essay">{preview.romanceEssay}</p> : null}
        <PremiumLock
          title={`${title} (Romantic) Characteristics`}
          onUnlock={onCheckout}
        />
        <div className="ap-card-pair">
          <LockedInsightCard kind="superpower" title="Your superpowers in romance" onUnlock={onCheckout} />
          <LockedInsightCard kind="trigger" title="Your triggers in romance" onUnlock={onCheckout} />
        </div>
      </section>

      {preview.caregiver ? (
        <section className="ap-section" aria-labelledby="caregiver-title">
          <StyleBanner styleKey={result.key} />
          <h2 id="caregiver-title">Your caregiver attachment patterns</h2>
          <p className="ap-essay">{preview.caregiver.intro}</p>
          <HowYouScored
            heading="How you scored"
            anxiety={preview.caregiver.anxiety}
            avoidance={preview.caregiver.avoidance}
          />
          <PremiumLock title="What does this mean?" onUnlock={onCheckout} />
        </section>
      ) : null}

      {preview.selfWorth ? (
        <section className="ap-section" aria-labelledby="self-worth-title">
          <h2 id="self-worth-title">How you see yourself</h2>
          <SelfWorthRing level={preview.selfWorth.level} percent={preview.selfWorth.percent} />
          <p className="ap-essay">{preview.selfWorth.sentences}</p>
          <PremiumLock title="Self-talk rewrites" onUnlock={onCheckout} />
        </section>
      ) : null}

      {preview.sample ? (
        <section className="ap-section ap-sample" aria-labelledby="free-sample-title">
          <span>{preview.sample.choice.atlasPath ? "One image from this quiz" : "One choice from this quiz"}</span>
          <h2 id="free-sample-title">{preview.sample.moduleTitle}</h2>
          <p>{preview.sample.explanation}</p>
          <article className="free-sample-choice">
            {preview.sample.choice.atlasPath
              ? (sceneKeyFromPath(preview.sample.choice.atlasPath)
                ? <SceneCard className="choice-review-image" index={preview.sample.choice.selectedIndex} scene={sceneKeyFromPath(preview.sample.choice.atlasPath) ?? "phone"} />
                : <AtlasThumb className="choice-review-image" index={preview.sample.choice.selectedIndex} path={preview.sample.choice.atlasPath} />)
              : null}
            <div>
              <span>Question {preview.sample.choice.questionNumber}</span>
              <p className="choice-review-question">{preview.sample.choice.prompt}</p>
              <h3>{preview.sample.choice.label}</h3>
              {preview.sample.choice.meaning ? <p>{preview.sample.choice.meaning}</p> : null}
            </div>
          </article>
        </section>
      ) : null}

      <section className="ap-paywall" id="unlock-full-results">
        <h2>Unlock full results · {amountCents === 0 ? "Free" : price}</h2>
        <p>{amountCents > 0 ? `USD ${(amountCents / 100).toFixed(2)}, one time. ` : ""}This page unlocks after confirmation, plus an email backup link to the address you used with the test.</p>
        <p className="service-context">For entertainment and self-reflection. This is not a clinical diagnosis, a validated psychological assessment, or professional advice. <Link href="/disclaimer">How to use these results</Link></p>
        {sandbox ? <p className="sandbox-notice">Test checkout — no real money will be charged.</p> : null}
        {status === "refunded" ? <p>This purchase has been refunded. Full report access has ended.</p> : (
          <>
            {amountCents > 0 && (
              <p className="purchase-refund-notice">
                {refundPolicy === "14-day-2026-09-08"
                  ? <>This order retains our original 14-day refund request policy. <Link href="/refunds/legacy-2026-09">Read your policy</Link></>
                  : <>After successful delivery, no refunds for a change of mind or subjective dissatisfaction. Delivery failures, duplicate charges, material misdescription and legal rights are excepted. <Link href="/refunds">Read the refund policy</Link></>}
              </p>
            )}
            <button
              className="unlock-button unlock-button-primary"
              disabled={submitting || (!checkoutReady && amountCents > 0)}
              onClick={onCheckout}
              type="button"
            >
              {submitting ? "Opening checkout…" : amountCents === 0 ? "Open my full results" : `Unlock full results · ${price}`}
            </button>
            {!checkoutReady && amountCents > 0 ? <p>Checkout is being set up. Your result is saved; please come back later.</p> : null}
          </>
        )}
        {paymentQuery === "cancelled" ? <p>Checkout was cancelled. Your result is still saved.</p> : null}
        {paymentQuery === "success" ? <p role="status">Checking your payment. If your report has not opened yet, use the button below to check again.</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="text-button" onClick={onRefresh} type="button">Check payment status</button>
        <p><Link href="/recover">Find my paid reports / Resend report email</Link></p>
        <p className="checkout-legal">By purchasing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/refunds">Refund & Delivery Policy</Link>. See our <Link href="/privacy">Privacy Policy</Link>.</p>
        <p>After payment confirmation, we email a private report link to the address you provided with your test. You can use it on another browser. PDF downloads are not included. For help, contact <a href="mailto:bruce@deeppersonaai.com">bruce@deeppersonaai.com</a>.</p>
      </section>
    </article>
  );
}
