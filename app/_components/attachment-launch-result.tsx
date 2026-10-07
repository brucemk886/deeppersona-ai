import Link from 'next/link';
import { RESPONSE_KEYS, RESPONSE_LABELS, type AnswerEvidence, type LaunchOverview, type LaunchReport } from '@/lib/attachment-launch';

function Evidence({ value }: { value: AnswerEvidence }) {
  return <article className="launch-evidence"><span className="ap-kicker">Your answer · Question {value.questionNumber}</span><h3>{value.prompt}</h3><blockquote>“{value.answer}”</blockquote></article>;
}

export function LaunchSummary({ overview, offerPrice }: { overview: LaunchOverview; offerPrice?: string }) {
  const insight = overview.insight;
  return <>
    <header className="ap-hero launch-hero">
      <p className="ap-kicker">Your relationship reading · {overview.answered} answers</p>
      <span className="launch-pattern-label">{overview.headline}</span>
      <h1>{insight?.title ?? overview.headline}</h1>
      <p className="ap-hero-sub">{insight?.opening ?? overview.summary}</p>
      {offerPrice ? <p className="launch-early-offer"><a href="#unlock-full-results">Read my complete pattern · {offerPrice} →</a><small>A personal reading of your choices · one payment, no subscription</small></p> : null}
    </header>
    <section className="ap-section launch-opening"><span className="ap-kicker">01 · What your answers reveal</span><h2>There is a reason this moment matters to you.</h2>
      <div className="launch-evidence-grid launch-pair">{(insight?.evidence ?? overview.evidence.slice(0, 2)).map(e => <Evidence key={e.questionId} value={e} />)}</div>
      <p className="launch-reading-prose">{insight?.excerpt ?? overview.summary}</p>
      <p className="launch-reading-note">One possible reading of the choices you made. Keep what fits your experience.</p>
    </section>
    <section className="ap-section launch-contrast"><span className="ap-kicker">02 · The part a label would miss</span><h2>{insight?.contrastTitle ?? 'There is more than one side to this result.'}</h2><p>{insight?.contrast ?? overview.exceptionNote}</p></section>
    <details className="launch-count-details"><summary>See the answer counts behind this reading</summary><p>Counts of your selections, not clinical scores or personality percentages.</p><div className="launch-counts">{RESPONSE_KEYS.map(key => <div key={key}><span>{RESPONSE_LABELS[key]}</span><strong>{overview.counts[key]} / {overview.answered}</strong><meter min={0} max={overview.answered || 1} value={overview.counts[key]} aria-label={`${RESPONSE_LABELS[key]}: ${overview.counts[key]} of ${overview.answered} choices`} /></div>)}</div></details>
  </>;
}

export function LaunchOffer({ overview }: { overview: LaunchOverview }) {
  return <section className="ap-section launch-offer" aria-labelledby="launch-offer-title">
    <span className="ap-kicker">Continue your personal reading</span>
    <h2 id="launch-offer-title">Understand the reaction.<br />Choose what happens next.</h2>
    <p className="launch-offer-intro">Your first reaction is only the beginning. The full reading connects what you want, how you protect it, and what the other person may actually see.</p>
    <div className="launch-chapters">{overview.insight?.chapters.map((chapter, i) => <article key={chapter.questionId}><span className="launch-chapter-number">0{i + 1}</span><div><small>{chapter.title}</small><h3>{chapter.question}</h3><p>Built around the answer you selected in this situation.</p></div></article>)}</div>
    <div className="launch-offer-includes"><h3>Inside your complete reading</h3><ul><li>The need beneath your most frequent reactions, and what those reactions can cost you.</li><li>Three moments from your answers, explained in depth, with words you can adapt.</li><li>Where your responses change across closeness, conflict, boundaries, time apart, and stability.</li><li>How to read their follow-through and decide whether to ask, wait, or set a limit.</li></ul></div>
    <a className="launch-offer-link" href="#unlock-full-results">Continue to my complete reading →</a>
    <p className="launch-offer-note">One purchase includes the whole reading. No subscription or second upgrade.</p>
  </section>;
}

export function LaunchFullReport({ report }: { report: LaunchReport }) {
  const reading = report.reading;
  return <article className="ap-results ap-paid launch-report">
    <p className="launch-delivered">Your complete relationship reading · Unlocked</p>
    <LaunchSummary overview={report.overview} />
    {reading && <>
      <section className="ap-section launch-depth"><span className="ap-kicker">03 · Beneath the reaction</span><h2>What you may be trying to protect</h2><p className="launch-need">{reading.need}</p><div className="launch-depth-pair"><div><h3>Why the reaction makes sense</h3><p>{reading.protection}</p></div><div><h3>Where it can start costing you</h3><p>{reading.cost}</p></div></div><div className="launch-misread"><h3>What someone else may see</h3><p>{reading.misread}</p></div><h3>The change to practice</h3><p>{reading.pivot}</p></section>
      <nav className="launch-chapter-nav" aria-label="Your report chapters">{report.scenarios.map((s, i) => <a key={s.evidence.questionId} href={`#reading-moment-${i + 1}`}>0{i + 1} · {s.title ?? s.evidence.domain}</a>)}<a href="#reading-follow-through">What their response tells you</a></nav>
    </>}
    <section className="ap-section"><span className="ap-kicker">04 · Your pattern in real moments</span><h2>Let’s look at what happens next.</h2><p>These situations come from your answers. Each reading connects the reaction you chose with a need, a possible consequence, and a different way to respond.</p>{report.scenarios.map((scenario, i) => <article className="launch-scenario" id={`reading-moment-${i + 1}`} key={scenario.evidence.questionId}><span className="ap-kicker">Your moment 0{i + 1} · {scenario.evidence.domain}</span><h3 className="launch-scenario-title">{scenario.question ?? scenario.evidence.prompt}</h3><Evidence value={scenario.evidence} /><p className="launch-reading-prose">{scenario.reading}</p><div className="launch-script"><h4>Words to try in this moment</h4><blockquote>“{scenario.sentence}”</blockquote></div><div className="launch-depth-pair"><div><h4>When this helps</h4><p>{scenario.condition}</p></div><div><h4>What to look for afterward</h4><p>{scenario.observation}</p></div></div></article>)}</section>
    {reading && <section className="ap-section" id="reading-follow-through"><span className="ap-kicker">05 · Your next decision</span><h2>Their response matters, too.</h2><p>Understanding your own reaction is one part of the picture. Use what actually happens next to decide whether the agreement works for you.</p><div className="launch-decisions">{reading.relationship.map((item, i) => <article key={item.title}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div></section>}
    <section className="ap-section"><span className="ap-kicker">06 · Compare the situations</span><h2>Where your pattern changes</h2><div className="launch-domain-list">{report.domains.map(domain => <details key={domain.title}><summary>{domain.title}</summary><p>{domain.reading}</p><ul>{RESPONSE_KEYS.filter(key => domain.counts[key]).map(key => <li key={key}>{RESPONSE_LABELS[key]}: {domain.counts[key]} choices</li>)}</ul></details>)}</div></section>
    <section className="ap-section launch-action"><span className="ap-kicker">Bring it into your next conversation</span><h2>{report.practice.title}</h2><ol className="launch-list">{report.practice.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Your reflection:</strong> {report.practice.reflection}</p></section>
    <section className="ap-section"><details><summary>Review all {report.answers.length} of your answers</summary><div className="launch-evidence-grid">{report.answers.map(answer => <Evidence key={answer.questionId} value={answer} />)}</div></details></section>
    <section className="ap-section launch-reading-note"><p>Prepared from your saved choices. This guide is for self-reflection, not diagnosis or a conclusion about your partner. <Link href="/disclaimer">About this reading</Link>.</p><p><Link href="/recover">Find my paid reports / Resend report email</Link></p></section>
  </article>;
}
