"use client";

import { useEffect, useRef, useState } from "react";
import { ASTRO_TEST_ID, PLANS, type Access, type PlanId, type PublicReading } from "@/lib/astro";
import s from "./astro.module.css";

type ReportResponse = {
  id: string;
  access: Access;
  orderStatus: string | null;
  checkoutReady: boolean;
  plans: typeof PLANS;
  reading: PublicReading;
};

export type AstroTrack = (eventName: string, extra?: { questionId?: string; optionLabel?: string; step?: number }) => void;

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function AstroReport({ reportId, initialReading, track, embedded = false }: {
  reportId: string;
  initialReading?: PublicReading;
  track?: AstroTrack;
  embedded?: boolean;
}) {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [reading, setReading] = useState<PublicReading | undefined>(initialReading);
  const [plan, setPlan] = useState<PlanId>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    let stopped = false;
    const params = new URLSearchParams(location.search);
    const paid = params.get("payment") === "success";
    setConfirming(paid);
    const load = async (attempt: number): Promise<void> => {
      try {
        const response = await fetch(`/api/astro/report/${encodeURIComponent(reportId)}${paid ? "?sync=1" : ""}`, { cache: "no-store" });
        const body = await response.json() as ReportResponse & { error?: string };
        if (stopped) return;
        if (!response.ok) { setError(body.error || "We couldn't open this reading."); setConfirming(false); return; }
        setData(body); setReading(body.reading);
        // Stripe can finish a moment after the redirect, so keep checking for a short time.
        if (paid && body.access === "free" && attempt < 10) { setTimeout(() => void load(attempt + 1), 2000); return; }
        setConfirming(false);
        if (paid && body.access !== "free") history.replaceState(null, "", `/reports/${reportId}`);
      } catch {
        if (!stopped) { setError("Connection problem. Please refresh the page."); setConfirming(false); }
      }
    };
    void load(0);
    return () => { stopped = true; };
  }, [reportId]);

  useEffect(() => {
    if (reading && !viewed.current) { viewed.current = true; track?.("result_viewed", { questionId: ASTRO_TEST_ID }); }
  }, [reading, track]);

  // Server-side view log (one per session and view type), also works when the reading is opened from email.
  const loggedView = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const view = data.access === "free" ? "summary" : "full";
    if (loggedView.current === view) return;
    loggedView.current = view;
    void fetch(`/api/reports/${encodeURIComponent(reportId)}/viewed`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ view }),
    }).catch(() => undefined);
  }, [data, reportId]);

  const access: Access = data?.access ?? reading?.access ?? "free";
  const [unlockVisible, setUnlockVisible] = useState(false);
  useEffect(() => {
    const target = document.getElementById("unlock");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setUnlockVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [reading, access]);

  async function checkout() {
    if (busy) return;
    setBusy(true); setError("");
    track?.("checkout_started", { optionLabel: plan });
    try {
      const response = await fetch("/api/astro/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, plan }),
      });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Checkout is not available right now.");
      location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout is not available right now.");
      setBusy(false);
    }
  }

  const body = (
    <div className={s.screen}>
      {!reading ? (
        <div className={s.center} style={{ paddingTop: 60 }}>
          <p className={s.sub}>{error || "Opening your reading…"}</p>
        </div>
      ) : (
        <>
          <p className={s.kicker}>{access === "free" ? "✨ Your chart is complete" : "✨ Your reading is unlocked"}</p>
          <h2>{access === "free"
            ? (reading.profile ? `We found ${reading.sections.filter((section) => section.locked).length} hidden patterns in your love chart` : `We found ${reading.sections.filter((section) => section.locked).length} hidden patterns in your chart`)
            : (reading.profile ? "Your Love Reading" : "Your Cosmic Blueprint")}</h2>
          {reading.profile ? (
            <div className={s.summary}>
              <div><b>{reading.chart.sun.glyph}</b><span>{reading.chart.sun.name} Sun</span></div>
              <div><b>{reading.profile.typeGlyph}</b><span>{reading.profile.type}</span></div>
              {reading.profile.partner
                ? <div><b>{reading.profile.partner.score}%</b><span>You &amp; {reading.profile.partner.name}</span></div>
                : <div><b>🔒</b><span>Soulmate sign</span></div>}
            </div>
          ) : (
            <div className={s.summary}>
              <div><b>{reading.chart.sun.glyph}</b><span>{reading.chart.sun.name} Sun</span></div>
              <div><b>{reading.chart.moon.glyph}</b><span>{reading.chart.moon.name} Moon</span></div>
              <div><b>{reading.chart.lifePath}</b><span>Life Path</span></div>
            </div>
          )}
          {confirming && <div className={s.hint}>⏳ <span>Confirming your payment… this usually takes a few seconds.</span></div>}
          {!reading.profile && !reading.chart.moon.certain && (
            <p className={`${s.sub} ${s.small}`} style={{ marginTop: 10 }}>
              The Moon changed sign on your birth day ({reading.chart.moon.early} early, {reading.chart.moon.late} later). We used midday.
            </p>
          )}
          {access === "free" && (() => {
            const total = reading.sections.length;
            const open = reading.sections.filter((section) => !section.locked).length;
            return (
              <div className={s.progress}>
                <div className={s.progressTop}><span>Your reading</span><b>{open} of {total} unlocked</b></div>
                <div className={s.progressBar}><i style={{ width: `${Math.round((open / total) * 100)}%` }} /></div>
              </div>
            );
          })()}
          <div style={{ height: 8 }} />
          {reading.sections.map((section, n) => (<div key={section.id}>
            {access === "free" && reading.profile && n > 0 && reading.sections[n - 1].access === "free" && section.locked && (
              <a href="#unlock" className={s.btn} style={{ display: "block", textAlign: "center", textDecoration: "none", margin: "6px 0 16px" }}
                onClick={() => track?.("unlock_jump", { questionId: "inline" })}>Unlock my full love reading ↓</a>
            )}
            <div className={`${s.report} ${section.locked ? s.locked : ""}`}>
              <h4>{section.icon} {section.title}{section.access === "free" && <span className={s.free}>FREE</span>}</h4>
              {section.tag && <div className={s.tag}>{section.tag}</div>}
              {section.score !== undefined && (
                <div className={s.score}><div className={s.scoreBar}><i style={{ width: `${section.score}%` }} /></div><b>{section.score}%</b></div>
              )}
              {section.locked
                ? <>
                    <p className={s.hook}>{section.teaser}</p>
                    {section.preview && (
                      <div className={s.previewChips}>{section.preview.map((label) => <span key={label}>{label}<i aria-hidden="true">••••••</i></span>)}</div>
                    )}
                    <div className={s.peekWrap}>
                      {section.peek && <p className={s.peek}>{section.peek}</p>}
                      <p className={s.blurLine} aria-hidden="true">Your full reading continues here with the details written for your chart and your answers.</p>
                      <div className={s.lock}>🔒 {section.access === "basic" ? "Included in both plans" : "Complete Reading"}</div>
                    </div>
                  </>
                : (section.body ?? [section.teaser]).map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>))}

          {access === "free" && (
            <div id="unlock" style={{ marginTop: 10 }}>
              <h2>{reading.profile ? `Unlock your full ${reading.chart.sun.name} love reading` : `Unlock your full ${reading.chart.sun.name} reading`}</h2>
              {(["basic", "full"] as const).map((id) => (
                <button key={id} type="button" className={`${s.plan} ${plan === id ? s.planSel : ""}`}
                  onClick={() => { setPlan(id); track?.("plan_selected", { optionLabel: id }); }}>
                  {id === "full" && <span className={s.badge}>RECOMMENDED</span>}
                  <span className={s.radio} />
                  <span className={s.info}><b>{PLANS[id].name}</b><span>{PLANS[id].blurb}</span></span>
                  <span className={s.price}><b>{money(PLANS[id].cents)}</b></span>
                </button>
              ))}
              {reading.profile ? (
                <ul className={s.feat}>
                  <li>💞 Your soulmate profile: sign, look, how they&apos;ll love you</li>
                  <li>💘 {reading.profile.partner ? `How ${reading.profile.partner.name} really sees you` : "What your soulmate notices first about you"}</li>
                  <li>🌗 The moment they pull away, and what to do</li>
                  {plan === "full" && <li>⭐ Your top 3 matches &amp; the sign to avoid</li>}
                  {plan === "full" && <li>🗓️ The exact date of your next love window</li>}
                  <li>📄 Yours to keep on this page</li>
                </ul>
              ) : (
                <ul className={s.feat}>
                  <li>✨ Written around your Sun, Moon &amp; Life Path</li>
                  <li>🌗 The side of you people don&apos;t see</li>
                  <li>💞 Your love pattern{plan === "full" ? " & top 3 matches with scores" : ""}</li>
                  {plan === "full" && <li>🧭 Hidden talent &amp; career direction</li>}
                  <li>📄 Yours to keep on this page</li>
                </ul>
              )}
              <button type="button" className={s.btn} disabled={busy || data?.checkoutReady === false} onClick={() => void checkout()}>
                {busy ? "Opening secure checkout…" : `Get my reading — ${money(PLANS[plan].cents)}`}
              </button>
              <div className={s.err}>{error}</div>
              <div className={s.trust}><span>🔒 Secure checkout by Stripe</span><span>💳 One-time payment</span><span>No subscription</span></div>
              <p className={s.legal}>
                For entertainment and self-reflection only — not professional advice. See our <a href="/refunds">refund policy</a>, <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.
              </p>
            </div>
          )}
          {access === "free" && reading.profile && !unlockVisible && (
            <div className={s.jump}>
              <a href="#unlock" className={s.btn} style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                onClick={() => track?.("unlock_jump", { questionId: "sticky" })}>See my soulmate — from {money(PLANS.basic.cents)}</a>
            </div>
          )}
          {access === "basic" && (
            <p className={s.legal}>Your {PLANS.basic.name} is unlocked. Questions? Email bruce@deeppersonaai.com.</p>
          )}
          {access === "full" && (
            <p className={s.legal}>For entertainment and self-reflection. Bookmark this page to come back to your reading.</p>
          )}
        </>
      )}
    </div>
  );

  if (embedded) return body;
  return (
    <div className={s.root}>
      <div className={s.app}>
        <header className={s.header}>
          <a className={s.back} href="/" aria-label="Home" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>←</a>
          <div className={s.logo}>DEEPPERSONA ✦ ASTRO</div>
          <div className={s.count} />
        </header>
        {body}
      </div>
    </div>
  );
}
