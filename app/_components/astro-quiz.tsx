"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ASTRO_TEST_ID, ELEMENT, LOADING_QUESTIONS, LOVE_TYPE, QUESTIONS, SUN_LOVE, ZODIAC,
  compatLine, compatScore, fill, hasSomeone, matchesFor, pronounFor, sunSign, isValidDate,
  type Option, type PublicReading, type QuestionId, type Sign,
} from "@/lib/astro";
import { validateEmailAddress } from "@/lib/email-validation";
import { currentAttribution, type Attribution } from "@/lib/traffic";
import { AstroReport, type AstroTrack } from "./astro-report";
import s from "./astro.module.css";

type ScreenId =
  | "welcome" | QuestionId | "dob" | "reveal_sun" | "reveal_love" | "reveal_compat" | "reveal_patterns" | "email" | "loading" | "report";

const SCREENS: ScreenId[] = [
  "welcome", "gender", "drawn_to", "status", "someone", "their_sign", "dob", "reveal_sun",
  "falls_for", "fear", "past", "when_like", "reveal_love", "love_lang", "future", "want_now", "their_attitude", "anxious", "reveal_compat",
  "looks", "loved_how", "dynamic", "effort", "destiny", "reveal_patterns", "email", "loading", "report",
];
const NO_PROGRESS: ScreenId[] = ["welcome", "loading", "report"];
const CONDITIONAL: ScreenId[] = ["their_sign", "their_attitude"];
const TRACKER_FROM = SCREENS.indexOf("dob");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Chart = { sun: Sign };

function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
    let frame = 0;
    const size = () => {
      canvas.width = innerWidth; canvas.height = innerHeight;
      stars = Array.from({ length: 110 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.3 + 0.2, a: Math.random(), s: Math.random() * 0.02 + 0.004 }));
    };
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        star.a += star.s;
        ctx.fillStyle = `rgba(255,255,255,${(0.35 + Math.abs(Math.sin(star.a)) * 0.65) * 0.8})`;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, 6.3); ctx.fill();
      }
      frame = requestAnimationFrame(loop);
    };
    size(); addEventListener("resize", size); loop();
    return () => { cancelAnimationFrame(frame); removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className={s.stars} aria-hidden="true" />;
}

function OptionButton({ option, selected, onClick, check }: { option: Option; selected: boolean; onClick: () => void; check?: boolean }) {
  return (
    <button type="button" className={`${s.opt} ${selected ? s.sel : ""}`} onClick={onClick}>
      <span className={s.em}>{option[0]}</span><span className={s.lbl}>{option[1]}</span>
      {check && <span className={s.chk}>✓</span>}
    </button>
  );
}

const an = (word: string) => (/^[AEIOU]/i.test(word) ? `an ${word}` : `a ${word}`);
const isQuestion = (id: ScreenId): id is QuestionId => id in QUESTIONS;

export function AstroQuiz() {
  const [idx, setIdx] = useState(0);
  const [past, setPast] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [dob, setDob] = useState<{ y: number; m: number; d: number } | null>(null);
  const [dobDraft, setDobDraft] = useState({ y: "", m: "", d: "" });
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pop, setPop] = useState<string | null>(null);
  const [report, setReport] = useState<{ id: string; reading: PublicReading } | null>(null);
  const session = useRef<{ id: string; attribution: Attribution } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const screen = SCREENS[idx];
  const chart: Chart | null = dob ? { sun: sunSign(dob.m, dob.d) } : null;
  const someone = hasSomeone(answers.someone);
  const p = pronounFor(answers.drawn_to);
  const f = (text: string) => fill(text, p);
  const partner = someone ? ZODIAC.find((sign) => sign.name === answers.their_sign) ?? null : null;
  const soul = chart ? matchesFor(chart.sun).matches[0].sign : null;
  const type = LOVE_TYPE[answers.when_like];

  const applies = useCallback((id: ScreenId) => !CONDITIONAL.includes(id) || hasSomeone(answers.someone), [answers.someone]);
  const quizScreens = SCREENS.filter((id) => !NO_PROGRESS.includes(id) && applies(id));

  const track = useCallback<AstroTrack>((eventName, extra = {}) => {
    const current = session.current;
    if (!current) return;
    const { visitId, ...attribution } = current.attribution;
    void fetch("/api/events", {
      method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: current.id, eventName, testId: ASTRO_TEST_ID, ...attribution, ...(eventName === "session_started" && visitId ? { visitId } : {}), ...extra }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    session.current = { id: crypto.randomUUID(), attribution: currentAttribution() };
    track("session_started");
  }, [track]);

  const step = quizScreens.indexOf(screen) + 1;
  useEffect(() => {
    rootRef.current?.scrollTo(0, 0);
    if (step === 0) return;
    if (screen.startsWith("reveal_")) track("reveal_viewed", { questionId: screen, step });
    else if (screen === "email") track("email_gate_viewed", { step });
    else track("question_viewed", { questionId: screen, step });
    // step is derived from screen; only log once per screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, track]);

  const goTo = (target: number) => { setPast((list) => [...list, idx]); setIdx(target); };
  // Skips follow-up questions about "someone" when there is nobody specific. `someoneNow` covers the answer being set in the same tick.
  const next = (someoneNow = answers.someone) => {
    let target = idx + 1;
    while (CONDITIONAL.includes(SCREENS[target]) && !hasSomeone(someoneNow)) target++;
    goTo(target);
  };
  const back = () => setPast((list) => { if (!list.length) return list; setIdx(list[list.length - 1]); return list.slice(0, -1); });
  const answer = (id: QuestionId, label: string) => {
    setAnswers((a) => {
      const updated = { ...a, [id]: label };
      // Changing "someone" to nobody drops the follow-up answers so they aren't submitted.
      if (id === "someone" && !hasSomeone(label)) { delete updated.their_sign; delete updated.their_attitude; }
      return updated;
    });
    track("answer_selected", { questionId: id, optionLabel: label, step });
    setTimeout(() => next(id === "someone" ? label : answers.someone), 220);
  };
  const flash = (slot: string) => { setPop(slot); setTimeout(() => setPop(null), 800); };

  async function submit(extra: Record<string, string>) {
    const current = session.current;
    if (!current || !dob) throw new Error("Please restart the quiz.");
    const all: Record<string, string | string[]> = { ...answers, ...multi, ...extra };
    if (!hasSomeone(answers.someone)) { delete all.their_sign; delete all.their_attitude; }
    const response = await fetch("/api/astro/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: current.id, email, source: current.attribution.source, campaign: current.attribution.campaign, dob, answers: all }),
    });
    const body = await response.json() as { reportId?: string; reading?: PublicReading; error?: string };
    if (!response.ok || !body.reportId || !body.reading) throw new Error(body.error || "We couldn't create your reading. Please try again.");
    return { id: body.reportId, reading: body.reading };
  }

  const inQuiz = step > 0;
  const after = (id: ScreenId) => idx > SCREENS.indexOf(id);
  const slots: [string, string, string, string | null][] = [
    ["sun", "☉", "Sun", chart && after("dob") ? `${chart.sun.glyph} ${chart.sun.name}` : null],
    ["type", "💗", "Love type", type && after("when_like") ? type.name.replace(/^The /, "") : null],
    ["match", "💫", partner ? "You & them" : "Soulmate", chart && after("anxious") ? (partner ? `${compatScore(chart.sun, partner)}%` : "Found 🔒") : null],
    ["window", "🗓️", "Love window", null],
  ];

  let view: React.ReactNode = null;
  if (isQuestion(screen)) {
    const q = QUESTIONS[screen] as (typeof QUESTIONS)[QuestionId] & { multi?: boolean; grid?: boolean; sub?: string };
    const title = f(q.q);
    if (q.multi) {
      const picked = multi[screen] ?? [];
      view = (<>
        <h2>{title}</h2><p className={s.sub}>{q.sub}</p>
        <div className={s.opts}>
          {q.opts.map((o) => <OptionButton key={o[1]} option={o} check selected={picked.includes(o[1])}
            onClick={() => setMulti((m) => ({ ...m, [screen]: picked.includes(o[1]) ? picked.filter((x) => x !== o[1]) : [...picked, o[1]] }))} />)}
        </div>
        <div className={`${s.cta} ${s.sticky}`}><button type="button" className={s.btn} disabled={!picked.length} onClick={() => {
          track("answer_selected", { questionId: screen, optionLabel: picked.join(", "), step }); next();
        }}>Continue</button></div>
      </>);
    } else {
      view = (<>
        <h2>{title}</h2>{q.sub ? <p className={s.sub}>{f(q.sub)}</p> : <div style={{ height: 14 }} />}
        <div className={q.grid ? (screen === "their_sign" ? s.grid3 : s.grid2) : s.opts}>
          {q.opts.map((o) => <OptionButton key={o[1]} option={o} selected={answers[screen] === o[1]} onClick={() => answer(screen, o[1])} />)}
        </div>
      </>);
    }
  } else switch (screen) {
    case "welcome":
      view = (<>
        <div className={s.hero}><div className={s.orb} />
          <h1>Who is your soulmate? Your stars already know.</h1>
          <p className={s.sub}>Answer a few quick questions about love. We&apos;ll find your soulmate&apos;s sign, how they&apos;ll love you, and the date of your next love window.</p>
        </div>
        <div className={s.cta}>
          <button type="button" className={s.btn} onClick={() => { track("quiz_started"); next(); }}>Start the quiz</button>
          <p className={`${s.sub} ${s.center}`} style={{ marginTop: 14, fontSize: 13 }}>Takes about 2 minutes · For entertainment and self-reflection.</p>
        </div>
      </>);
      break;
    case "dob": {
      const yNow = new Date().getFullYear();
      const y = Number(dobDraft.y), m = Number(dobDraft.m), d = Number(dobDraft.d);
      const valid = Boolean(dobDraft.y && dobDraft.m && dobDraft.d) && isValidDate(y, m, d);
      view = (<>
        <h2>What&apos;s your date of birth?</h2><p className={s.sub}>{partner ? `Unlocks your Sun sign and your match with ${partner.name}.` : "Unlocks your Sun sign and your soulmate's sign."}</p>
        <div className={s.selects}>
          <select className={s.field} aria-label="Month" value={dobDraft.m} onChange={(e) => setDobDraft({ ...dobDraft, m: e.target.value })}>
            <option value="">Month</option>{MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
          <select className={s.field} aria-label="Day" value={dobDraft.d} onChange={(e) => setDobDraft({ ...dobDraft, d: e.target.value })}>
            <option value="">Day</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
          <select className={s.field} aria-label="Year" value={dobDraft.y} onChange={(e) => setDobDraft({ ...dobDraft, y: e.target.value })}>
            <option value="">Year</option>{Array.from({ length: 87 }, (_, i) => <option key={i} value={yNow - 14 - i}>{yNow - 14 - i}</option>)}
          </select>
        </div>
        {dobDraft.y && dobDraft.m && dobDraft.d && !valid && <div className={s.err}>That date doesn&apos;t exist. Please check the day.</div>}
        <div className={s.hint}>🔒 <span>Your data is private and only used to calculate your chart.</span></div>
        <div className={s.cta}><button type="button" className={s.btn} disabled={!valid} onClick={() => {
          setDob({ y, m, d }); track("answer_selected", { questionId: "dob", optionLabel: sunSign(m, d).name, step }); flash("sun"); next();
        }}>Unlock my Sun sign</button></div>
      </>);
      break;
    }
    case "reveal_sun":
      if (chart) view = (<>
        <div className={s.center}><p className={s.kicker}>✨ Sun sign unlocked</p><div className={s.sign}>{chart.sun.glyph}</div><h1>{chart.sun.name}</h1>
          <div className={s.chips}><span className={s.chip}>{chart.sun.element} sign</span>{ELEMENT[chart.sun.element].traits.map((t) => <span key={t} className={s.chip}>{t}</span>)}</div>
          <div className={s.report}><p>{SUN_LOVE[chart.sun.element]}</p></div>
          <p className={s.sub}>Next: what makes you fall for someone, and who you actually need.</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => next()}>Continue</button></div>
      </>);
      break;
    case "reveal_love":
      if (chart && type) {
        const pairEl = { Fire: "Air", Air: "Fire", Earth: "Water", Water: "Earth" }[chart.sun.element];
        view = (<>
          <div className={s.center}><p className={s.kicker}>✨ Love type unlocked</p><div className={s.sign}>{type.glyph}</div><h1>{type.name}</h1>
            <div className={s.report}><p>{type.line}</p></div>
            <p className={s.sub}>As {an(chart.sun.element)} sign, you click fastest with other {chart.sun.element} signs and with {pairEl} signs. Your soulmate&apos;s exact sign is in your reading.</p>
          </div>
          <div className={s.cta}><button type="button" className={s.btn} onClick={() => { flash("type"); next(); }}>Continue</button></div>
        </>);
      }
      break;
    case "reveal_compat":
      if (chart && soul) view = partner ? (<>
        <div className={s.center}><p className={s.kicker}>✨ Compatibility found</p>
          <div className={s.sign}>{chart.sun.glyph} + {partner.glyph}</div><h1>You &amp; {partner.name}</h1>
          <div className={s.big}>{compatScore(chart.sun, partner)}%</div>
          <div className={s.report}><p>{compatLine(chart.sun, partner, p)}</p></div>
          <p className={s.sub}>{f("What {they} really think{s} of you, and the moment {they} pull{s} away, are in your reading.")}</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => { flash("match"); next(); }}>Continue</button></div>
      </>) : (<>
        <div className={s.center}><p className={s.kicker}>✨ Soulmate sign found</p><div className={s.sign}>🔒</div><h1>Your soulmate is {an(soul.element)} sign</h1>
          <div className={s.big}>{compatScore(chart.sun, soul)}%</div>
          <p className={s.sub}>{f("That's how well {they} match{es} your " + chart.sun.name + " Sun. A few more questions and we'll describe what {they} look{s} like.")}</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => { flash("match"); next(); }}>Continue</button></div>
      </>);
      break;
    case "reveal_patterns":
      view = (<>
        <div className={s.center} style={{ paddingTop: 12 }}><div className={s.big}>3</div>
          <h2>We found 3 patterns in your love chart</h2>
          <div className={s.chips}>
            <span className={s.chip}>🔁 The type you keep choosing</span>
            <span className={s.chip}>{f("🌗 The moment {they} pull{s} away")}</span>
            <span className={s.chip}>🗓️ Your next love window</span>
          </div>
          <p className={s.sub}>Your reading is ready to be written around your answers.</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => next()}>See my reading</button></div>
      </>);
      break;
    case "email":
      view = (<>
        <h2>Last step: where should we send your reading?</h2>
        <p className={s.sub}>Your {chart?.sun.name} love reading is almost ready. We&apos;ll email you a copy so you never lose it, plus a free weekly love forecast. Unsubscribe anytime.</p>
        <input className={s.field} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} />
        <div className={s.err}>{emailError}</div>
        <div className={s.hint}>🔒 <span>We respect your privacy. No spam. See our <a href="/privacy" style={{ color: "inherit" }}>privacy policy</a>.</span></div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => {
          // Same rules as the server, checked before the loading screen so a typo doesn't cost the user 20 seconds.
          const checked = validateEmailAddress(email);
          if (!checked.valid) { setEmailError(checked.message); return; }
          setEmail(checked.normalized); track("answer_selected", { questionId: "email", optionLabel: "submitted", step }); next();
        }}>Create my reading</button></div>
      </>);
      break;
    case "loading":
      if (chart) view = <Loading steps={[
        `Placing your ${chart.sun.name} Sun`, "Reading your love type",
        partner ? `Matching you with ${partner.name}` : "Finding your soulmate's sign",
        "Calculating your next love window", "Writing your reading",
      ]} onAnswer={(key, value) => {
        track("answer_selected", { questionId: key, optionLabel: value });
      }} onDone={async (extra) => {
        try {
          const saved = await submit(extra);
          setReport(saved);
          track("quiz_completed");
          history.replaceState(null, "", `/reports/${saved.id}`);
          goTo(SCREENS.indexOf("report"));
        } catch (err) {
          setEmailError(err instanceof Error ? err.message : "We couldn't create your reading. Please try again.");
          setIdx(SCREENS.indexOf("email"));
        }
      }} />;
      break;
    case "report":
      if (report) view = <AstroReport embedded reportId={report.id} initialReading={report.reading} track={track} />;
      break;
  }

  const showBack = idx > 0 && screen !== "loading" && screen !== "report";
  return (
    <div className={s.root} ref={rootRef}>
      <Starfield />
      <div className={s.app}>
        <header className={s.header}>
          <button type="button" className={`${s.back} ${showBack ? "" : s.hidden}`} aria-label="Back" onClick={back}>←</button>
          <div className={s.logo}>DEEPPERSONA ✦ ASTRO</div>
          <div className={s.count}>{inQuiz ? `${step}/${quizScreens.length}` : ""}</div>
        </header>
        <div className={`${s.bar} ${inQuiz ? "" : s.hidden}`}><i style={{ width: inQuiz ? `${(step / quizScreens.length) * 100}%` : 0 }} /></div>
        {inQuiz && idx >= TRACKER_FROM && (
          <div className={s.tracker}>
            {slots.map(([k, g, l, v]) => (
              <div key={k} className={`${s.slot} ${v ? s.slotOn : ""}`} style={v && pop !== k ? { animation: "none" } : undefined}>
                <span className={s.slotG}>{g}</span><span className={s.slotL}>{l}</span><span className={s.slotV}>{v || "🔒"}</span>
              </div>
            ))}
          </div>
        )}
        <main className={s.screen} key={screen}>{view}</main>
      </div>
    </div>
  );
}

function Loading({ steps, onAnswer, onDone }: {
  steps: string[];
  onAnswer: (key: string, value: "yes" | "no") => void;
  onDone: (extra: Record<string, string>) => Promise<void>;
}) {
  const [pct, setPct] = useState(0);
  const [ask, setAsk] = useState<keyof typeof LOADING_QUESTIONS | null>(null);
  const [finishing, setFinishing] = useState(false);
  const extra = useRef<Record<string, string>>({});
  const done = useRef(false);

  useEffect(() => {
    if (ask || finishing) return;
    if (pct === 34 && !extra.current.loading_q34) { setAsk("loading_q34"); return; }
    if (pct === 72 && !extra.current.loading_q72) { setAsk("loading_q72"); return; }
    if (pct >= 100) {
      if (!done.current) { done.current = true; setFinishing(true); void onDone(extra.current); }
      return;
    }
    const timer = setTimeout(() => setPct((v) => v + 1), 40);
    return () => clearTimeout(timer);
  }, [pct, ask, finishing, onDone]);

  const reply = (value: "yes" | "no") => {
    if (!ask) return;
    extra.current[ask] = value; onAnswer(ask, value); setAsk(null); setPct((v) => v + 1);
  };
  return (<>
    <h2 className={s.center}>{finishing ? "Finishing your reading…" : "Creating your reading…"}</h2>
    <div className={s.loader}>
      <svg width="150" height="150" aria-hidden="true">
        <circle cx="75" cy="75" r="66" stroke="rgba(255,255,255,.12)" strokeWidth="10" fill="none" />
        <circle cx="75" cy="75" r="66" stroke="url(#astroArc)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="415" strokeDashoffset={415 - 415 * Math.min(pct, 100) / 100} />
        <defs><linearGradient id="astroArc"><stop offset="0" stopColor="#a98bff" /><stop offset="1" stopColor="#ff8fd8" /></linearGradient></defs>
      </svg>
      <div className={s.pct}>{Math.min(pct, 100)}%</div>
    </div>
    <div className={s.steps}>
      {steps.map((text, i) => {
        const isDone = i < Math.floor(pct / 20);
        return <div key={text} className={`${s.step} ${isDone ? s.done : ""}`}><span className={s.dot}>{isDone ? "✓" : ""}</span>{text}</div>;
      })}
    </div>
    {ask && (
      <div className={s.modal}>
        <div className={s.box}>
          <p className={s.sub} style={{ marginBottom: 6 }}>To improve accuracy</p>
          <h3>{LOADING_QUESTIONS[ask]}</h3>
          <div className={s.row}>
            <button type="button" className={s.ghost} onClick={() => reply("no")}>No</button>
            <button type="button" className={s.btn} style={{ padding: 15 }} onClick={() => reply("yes")}>Yes</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
