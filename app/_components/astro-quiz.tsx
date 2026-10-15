"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ASTRO_TEST_ID, ELEMENT, LOADING_QUESTIONS, LOVE_ARCHETYPE, LP_TXT, MOON_TXT, QUESTIONS, STATEMENT_OPTS,
  challengeQuestion, lifePathNumber, loveElements, moonForDay, sunMoonLine, sunSign, isValidDate,
  type Option, type PublicReading, type Sign,
} from "@/lib/astro";
import { currentAttribution, type Attribution } from "@/lib/traffic";
import { AstroReport, type AstroTrack } from "./astro-report";
import s from "./astro.module.css";

type ScreenId =
  | "welcome" | "gender" | "goals" | "echo_goals" | "status" | "challenge" | "dob" | "reveal_sun" | "time" | "place"
  | "reveal_moon" | "st0" | "st1" | "st2" | "insight" | "overthink" | "q_drain" | "q_love" | "reveal_love" | "q_others" | "q_decide"
  | "reveal_lp" | "yes_compat" | "yes_career" | "email" | "loading" | "report";

const SCREENS: ScreenId[] = [
  "welcome", "gender", "goals", "echo_goals", "status", "challenge", "dob", "reveal_sun", "time", "place", "reveal_moon",
  "st0", "st1", "st2", "insight", "overthink", "q_drain", "q_love", "reveal_love", "q_others", "q_decide", "reveal_lp",
  "yes_compat", "yes_career", "email", "loading", "report",
];
const NO_PROGRESS: ScreenId[] = ["welcome", "loading", "report"];
const QUIZ_SCREENS = SCREENS.filter((id) => !NO_PROGRESS.includes(id));
const TRACKER_FROM = SCREENS.indexOf("dob");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Birth place is picked from a list so we get clean, comparable values (no "usa" / "U.S." / typos).
const TOP_COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "New Zealand", "Ireland", "India", "Philippines", "South Africa", "Germany", "France", "Mexico", "Brazil"];
const COUNTRIES = ("Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cambodia|Cameroon|Canada|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo|Costa Rica|Côte d'Ivoire|Croatia|Cuba|Cyprus|Czech Republic|Democratic Republic of the Congo|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hong Kong|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kosovo|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Macau|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Puerto Rico|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe").split("|");

type Chart = { sun: Sign; moon: ReturnType<typeof moonForDay>; lifePath: number };

function chartFor(dob: { y: number; m: number; d: number }, time: string | null): Chart {
  return { sun: sunSign(dob.m, dob.d), moon: moonForDay(dob.y, dob.m, dob.d, time), lifePath: lifePathNumber(dob.y, dob.m, dob.d) };
}

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

export function AstroQuiz() {
  const [idx, setIdx] = useState(0);
  const [past, setPast] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<string[]>([]);
  const [dob, setDob] = useState<{ y: number; m: number; d: number } | null>(null);
  const [dobDraft, setDobDraft] = useState({ y: "", m: "", d: "" });
  const [time, setTime] = useState<string | null>(null);
  const [timeDraft, setTimeDraft] = useState("12:00");
  const [place, setPlace] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pop, setPop] = useState<string | null>(null);
  const [report, setReport] = useState<{ id: string; reading: PublicReading } | null>(null);
  const session = useRef<{ id: string; attribution: Attribution } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const screen = SCREENS[idx];
  const chart = dob ? chartFor(dob, time) : null;

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

  useEffect(() => {
    rootRef.current?.scrollTo(0, 0);
    if (!QUIZ_SCREENS.includes(screen)) return;
    if (screen.startsWith("reveal_") || screen === "insight" || screen === "echo_goals") track("reveal_viewed", { questionId: screen, step: QUIZ_SCREENS.indexOf(screen) + 1 });
    else if (screen === "email") track("email_gate_viewed", { step: QUIZ_SCREENS.indexOf(screen) + 1 });
    else track("question_viewed", { questionId: screen, step: QUIZ_SCREENS.indexOf(screen) + 1 });
  }, [screen, track]);

  const goTo = (next: number) => { setPast((p) => [...p, idx]); setIdx(next); };
  const next = () => goTo(idx + 1);
  const back = () => setPast((p) => { if (!p.length) return p; setIdx(p[p.length - 1]); return p.slice(0, -1); });
  const answer = (id: string, label: string) => {
    setAnswers((a) => ({ ...a, [id]: label }));
    track("answer_selected", { questionId: id, optionLabel: label, step: QUIZ_SCREENS.indexOf(screen) + 1 });
    setTimeout(next, 220);
  };
  const flash = (slot: string) => { setPop(slot); setTimeout(() => setPop(null), 800); };

  async function submit(finalAnswers: Record<string, string>) {
    const current = session.current;
    if (!current || !dob) throw new Error("Please restart the quiz.");
    const response = await fetch("/api/astro/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: current.id, email, source: current.attribution.source, campaign: current.attribution.campaign, dob, time, place, goals, answers: finalAnswers }),
    });
    const body = await response.json() as { reportId?: string; reading?: PublicReading; error?: string };
    if (!response.ok || !body.reportId || !body.reading) throw new Error(body.error || "We couldn't create your reading. Please try again.");
    return { id: body.reportId, reading: body.reading };
  }

  const inQuiz = QUIZ_SCREENS.includes(screen);
  const pos = QUIZ_SCREENS.indexOf(screen) + 1;
  const slots: [string, string, string, string | null][] = [
    ["sun", "☉", "Sun", chart && idx > SCREENS.indexOf("dob") ? `${chart.sun.glyph} ${chart.sun.name}` : null],
    ["element", "△", "Element", chart && idx > SCREENS.indexOf("dob") ? chart.sun.element : null],
    ["moon", "🌙", "Moon", chart && idx >= SCREENS.indexOf("reveal_moon") ? `${chart.moon.glyph} ${chart.moon.name}` : null],
    ["lp", "#", "Life Path", chart && idx >= SCREENS.indexOf("reveal_lp") ? String(chart.lifePath) : null],
  ];

  let view: React.ReactNode = null;
  switch (screen) {
    case "welcome":
      view = (<>
        <div className={s.hero}><div className={s.orb} />
          <h1>Discover who you really are — written in your stars</h1>
          <p className={s.sub}>Answer a few quick questions. We&apos;ll map your Sun, Moon and Life Path number and build a reading around your answers.</p>
        </div>
        <div className={s.cta}>
          <button type="button" className={s.btn} onClick={() => { track("quiz_started"); next(); }}>Start the quiz</button>
          <p className={`${s.sub} ${s.center}`} style={{ marginTop: 14, fontSize: 13 }}>Takes about 3 minutes · For entertainment and self-reflection.</p>
        </div>
      </>);
      break;
    case "gender": case "status": case "challenge": case "overthink": case "q_drain": case "q_love": case "q_others": case "q_decide": {
      const q = screen === "challenge" ? challengeQuestion(answers.status) : QUESTIONS[screen];
      const hint = "sub" in q ? q.sub : undefined;
      view = (<>
        <h2>{q.q}</h2>{hint ? <p className={s.sub}>{hint}</p> : <div style={{ height: 14 }} />}
        <div className={screen === "gender" ? s.grid2 : s.opts}>
          {q.opts.map((o) => <OptionButton key={o[1]} option={o} selected={answers[screen] === o[1]} onClick={() => {
            // A new relationship status can make the previous challenge answer invalid.
            if (screen === "status" && answers.status !== o[1]) setAnswers((a) => { const { challenge: _drop, ...rest } = a; return rest; });
            answer(screen, o[1]);
          }} />)}
        </div>
      </>);
      break;
    }
    case "goals":
      view = (<>
        <h2>{QUESTIONS.goals.q}</h2><p className={s.sub}>{QUESTIONS.goals.sub}</p>
        <div className={s.opts}>
          {QUESTIONS.goals.opts.map((o) => <OptionButton key={o[1]} option={o} check selected={goals.includes(o[1])}
            onClick={() => setGoals((g) => g.includes(o[1]) ? g.filter((x) => x !== o[1]) : [...g, o[1]])} />)}
        </div>
        <div className={s.cta}><button type="button" className={s.btn} disabled={!goals.length} onClick={() => { track("answer_selected", { questionId: "goals", optionLabel: goals.join(", ") }); next(); }}>Continue</button></div>
      </>);
      break;
    case "echo_goals":
      view = (<>
        <div className={s.center} style={{ paddingTop: 24 }}><div className={s.sign}>🔭</div>
          <h2>Got it. We&apos;ll build your reading around</h2>
          <div className={s.chips}>{goals.map((g) => <span key={g} className={s.chip}>{g}</span>)}</div>
          <p className={s.sub}>Next, we&apos;ll map the 4 key points of your chart. Each answer unlocks one.</p>
          <div className={s.previewSlots}>{slots.map(([k, g, l]) => <div key={k} className={s.slot}><span className={s.slotG}>{g}</span><span className={s.slotL}>{l}</span><span className={s.slotV}>🔒</span></div>)}</div>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Start mapping</button></div>
      </>);
      break;
    case "dob": {
      const yNow = new Date().getFullYear();
      const y = Number(dobDraft.y), m = Number(dobDraft.m), d = Number(dobDraft.d);
      const valid = Boolean(dobDraft.y && dobDraft.m && dobDraft.d) && isValidDate(y, m, d);
      view = (<>
        <h2>What&apos;s your date of birth?</h2><p className={s.sub}>Unlocks your Sun sign, Element and Life Path number.</p>
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
          setDob({ y, m, d }); track("answer_selected", { questionId: "dob", optionLabel: sunSign(m, d).name }); flash("sun"); next();
        }}>Unlock my Sun sign</button></div>
      </>);
      break;
    }
    case "reveal_sun":
      if (chart) view = (<>
        <div className={s.center}><p className={s.kicker}>✨ Sun sign unlocked</p><div className={s.sign}>{chart.sun.glyph}</div><h1>{chart.sun.name}</h1>
          <div className={s.chips}><span className={s.chip}>{chart.sun.element} sign</span>{ELEMENT[chart.sun.element].traits.map((t) => <span key={t} className={s.chip}>{t}</span>)}</div>
          <div className={s.report}><p>{ELEMENT[chart.sun.element].core}</p></div>
          <p className={s.sub}>Your Sun is how you shine. But your <b className={s.w}>Moon</b> — how you feel and love — is often a completely different sign.</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Find my Moon sign</button></div>
      </>);
      break;
    case "time":
      view = (<>
        <h2>Do you know your time of birth?</h2>
        <p className={s.sub}>The Moon changes sign every ~2.5 days, so your birth time makes your Moon sign more accurate.</p>
        <input className={s.field} type="time" value={timeDraft} onChange={(e) => setTimeDraft(e.target.value)} />
        <div className={s.cta}>
          <button type="button" className={s.btn} disabled={!/^\d{2}:\d{2}$/.test(timeDraft)} onClick={() => { setTime(timeDraft); track("answer_selected", { questionId: "time", optionLabel: "known" }); next(); }}>Continue</button>
          <button type="button" className={s.link} onClick={() => { setTime(null); track("answer_selected", { questionId: "time", optionLabel: "unknown" }); goTo(idx + 2); flash("moon"); }}>I don&apos;t know</button>
        </div>
      </>);
      break;
    case "place":
      view = (<>
        <h2>Where were you born?</h2><p className={s.sub}>Pick your country of birth. Saved with your chart so we can add your Rising sign to your reading.</p>
        <select className={s.field} aria-label="Country of birth" value={place} onChange={(e) => setPlace(e.target.value)}>
          <option value="">Select your country</option>
          <optgroup label="Most common">{TOP_COUNTRIES.map((c) => <option key={`top-${c}`} value={c}>{c}</option>)}</optgroup>
          <optgroup label="All countries">{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
        </select>
        <div className={s.cta}>
          <button type="button" className={s.btn} disabled={!place} onClick={() => { track("answer_selected", { questionId: "place", optionLabel: place }); flash("moon"); next(); }}>Continue</button>
          <button type="button" className={s.link} onClick={() => { setPlace(""); track("answer_selected", { questionId: "place", optionLabel: "skipped" }); flash("moon"); next(); }}>Skip</button>
        </div>
      </>);
      break;
    case "reveal_moon":
      if (chart) view = (<>
        <div className={s.center}><p className={s.kicker}>✨ Moon sign unlocked</p><div className={s.sign}>{chart.moon.glyph}</div><h1>Moon in {chart.moon.name}</h1>
          <div className={s.report}><p>{MOON_TXT[chart.moon.element]}</p></div>
          <p className={s.sub}>{sunMoonLine(chart.sun, chart.moon)}</p>
          {!time && (chart.moon.certain
            ? <p className={`${s.sub} ${s.small}`}>✅ The Moon stayed in {chart.moon.name} for your whole birth day, so this is accurate even without a birth time.</p>
            : <p className={`${s.sub} ${s.small}`}>⚠️ The Moon changed sign on your birth day: {chart.moon.early} early in the day, {chart.moon.late} later. We used midday ({chart.moon.name}). Go back and add your birth time for certainty.</p>)}
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Continue</button></div>
      </>);
      break;
    case "st0": case "st1": case "st2":
      if (chart) view = (<>
        <p className={s.kicker}>Do you relate to this statement?</p>
        <div className={s.quote}>“{ELEMENT[chart.sun.element].statements[Number(screen[2])]}”</div>
        <div className={s.opts} style={{ marginTop: 20 }}>
          {STATEMENT_OPTS.map((o) => <OptionButton key={o[1]} option={o} selected={answers[screen] === o[1]} onClick={() => answer(screen, o[1])} />)}
        </div>
      </>);
      break;
    case "insight":
      if (chart) {
        const hits = ["st0", "st1", "st2"].filter((k) => answers[k] && answers[k] !== "Not really").length;
        view = (<>
          <div className={s.center} style={{ paddingTop: 12 }}><div className={s.big}>{hits}/3</div>
            <h2>{hits >= 2 ? `Strong ${chart.sun.element} pattern detected` : "Your Moon is speaking louder than your Sun"}</h2>
            <p className={s.sub}>{hits >= 2
              ? `You matched ${hits} of 3 core ${chart.sun.element} traits. Your answers so far point to a pattern in how you handle ${(goals[0] || "life").toLowerCase()} — we'll break it down in your reading.`
              : `You matched fewer ${chart.sun.element} traits than most ${chart.sun.name}s — that usually means your ${chart.moon.name} Moon shapes you more than your Sun. Your reading will reflect this.`}</p>
          </div>
          <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Keep going</button></div>
        </>);
      }
      break;
    case "reveal_love": {
      const style = LOVE_ARCHETYPE[answers.q_love];
      if (chart && style) {
        const [same, partner] = loveElements(chart.sun.element);
        view = (<>
          <div className={s.center}><p className={s.kicker}>✨ Love style unlocked</p><div className={s.sign}>{style.glyph}</div><h1>{style.name}</h1>
            <div className={s.report}><p>{style.line}</p></div>
            <p className={s.sub}>As a {chart.sun.element} sign, you click fastest with other {same} signs and with {partner} signs. Your exact top 3 matches are in your reading.</p>
          </div>
          <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Continue</button></div>
        </>);
      }
      break;
    }
    case "reveal_lp":
      if (chart) view = (<>
        <div className={s.center}><p className={s.kicker}>✨ Life Path number unlocked</p><div className={s.big} style={{ fontSize: 84 }}>{chart.lifePath}</div><h1>{LP_TXT[chart.lifePath]}</h1>
          <p className={s.sub}>Calculated from your full birth date. Combined with your {chart.sun.name} Sun and {chart.moon.name} Moon, it shapes your purpose and the kind of work that fulfils you.</p>
        </div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={next}>Continue</button></div>
      </>);
      break;
    case "yes_compat": case "yes_career": {
      const copy = screen === "yes_compat"
        ? ["Do you want to know which signs you're most compatible with?", "We'll include your top 3 matches — and the sign to be careful with."]
        : ["Do you want to discover your hidden talent?", "Based on your chart and your answers about how you decide."];
      view = (<>
        <div className={s.center} style={{ paddingTop: 30 }}><div className={s.sign}>💫</div><h2>{copy[0]}</h2><p className={s.sub}>{copy[1]}</p></div>
        <div className={s.cta}>
          <button type="button" className={s.btn} onClick={() => answer(screen, "yes")}>Yes, include it</button>
          <button type="button" className={s.link} onClick={() => answer(screen, "no")}>Not now</button>
        </div>
      </>);
      break;
    }
    case "email":
      view = (<>
        <h2>Last step: where should we send your reading?</h2>
        <p className={s.sub}>Your {chart?.sun.name} reading is almost ready. We&apos;ll email you a copy so you never lose it, plus a free weekly forecast — unsubscribe anytime.</p>
        <input className={s.field} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} />
        <div className={s.err}>{emailError}</div>
        <div className={s.hint}>🔒 <span>We respect your privacy. No spam. See our <a href="/privacy" style={{ color: "inherit" }}>privacy policy</a>.</span></div>
        <div className={s.cta}><button type="button" className={s.btn} onClick={() => {
          if (!EMAIL.test(email.trim())) { setEmailError("Please enter a valid email."); return; }
          setEmail(email.trim()); track("answer_selected", { questionId: "email", optionLabel: "submitted" }); next();
        }}>Create my reading</button></div>
      </>);
      break;
    case "loading":
      if (chart) view = <Loading chart={chart} onAnswer={(key, value) => {
        setAnswers((a) => ({ ...a, [key]: value }));
        track("answer_selected", { questionId: key, optionLabel: value });
      }} onDone={async (extra) => {
        try {
          const saved = await submit({ ...answers, ...extra });
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
          <div className={s.count}>{inQuiz ? `${pos}/${QUIZ_SCREENS.length}` : ""}</div>
        </header>
        <div className={`${s.bar} ${inQuiz ? "" : s.hidden}`}><i style={{ width: inQuiz ? `${(pos / QUIZ_SCREENS.length) * 100}%` : 0 }} /></div>
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

function Loading({ chart, onAnswer, onDone }: {
  chart: Chart;
  onAnswer: (key: string, value: "yes" | "no") => void;
  onDone: (extra: Record<string, string>) => Promise<void>;
}) {
  const [pct, setPct] = useState(0);
  const [ask, setAsk] = useState<keyof typeof LOADING_QUESTIONS | null>(null);
  const [finishing, setFinishing] = useState(false);
  const extra = useRef<Record<string, string>>({});
  const done = useRef(false);
  const steps = [`Placing your ${chart.sun.name} Sun`, `Placing your ${chart.moon.name} Moon`, `Reading Life Path ${chart.lifePath}`, "Matching compatibility", "Writing your reading"];

  useEffect(() => {
    if (ask || finishing) return;
    if (pct === 34 && !extra.current.loading_q34) { setAsk("loading_q34"); return; }
    if (pct === 72 && !extra.current.loading_q72) { setAsk("loading_q72"); return; }
    if (pct >= 100) {
      if (!done.current) { done.current = true; setFinishing(true); void onDone(extra.current); }
      return;
    }
    const timer = setTimeout(() => setPct((p) => p + 1), 40);
    return () => clearTimeout(timer);
  }, [pct, ask, finishing, onDone]);

  const reply = (value: "yes" | "no") => {
    if (!ask) return;
    extra.current[ask] = value; onAnswer(ask, value); setAsk(null); setPct((p) => p + 1);
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
