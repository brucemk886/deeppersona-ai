import Link from 'next/link';
import { RESPONSE_KEYS, RESPONSE_LABELS, type AnswerEvidence, type LaunchOverview, type LaunchReport } from '@/lib/attachment-launch';

function Evidence({ value }: { value: AnswerEvidence }) {
  return <article className="launch-evidence"><span className="ap-kicker">Question {value.questionNumber} · {value.domain}</span><h3>{value.prompt}</h3><blockquote>“{value.answer}”</blockquote></article>;
}

export function LaunchSummary({ overview, offerPrice }: { overview: LaunchOverview; offerPrice?: string }) {
  return <>
    <header className="ap-hero"><p className="ap-kicker">Your relationship response pattern</p><h1>{overview.headline}</h1><p className="ap-hero-sub">{overview.summary}</p><span className="result-basis">Based on your {overview.answered} answers</span>{offerPrice ? <p className="launch-early-offer"><a href="#unlock-full-results">See the complete report · {offerPrice}</a><small>Three conversation tools tailored to your selected moments · one payment</small></p> : null}</header>
    <section className="ap-section"><h2>What you selected</h2><p>Counts of your choices in this quiz. These are not clinical scores or percentages of your personality.</p><div className="launch-counts">{RESPONSE_KEYS.map(key => <div key={key}><span>{RESPONSE_LABELS[key]}</span><strong>{overview.counts[key]} / {overview.answered}</strong><meter min={0} max={overview.answered || 1} value={overview.counts[key]} aria-label={`${RESPONSE_LABELS[key]}: ${overview.counts[key]} of ${overview.answered} choices`} /></div>)}</div></section>
    <section className="ap-section"><h2>Where this shows up in your answers</h2><div className="launch-evidence-grid">{overview.evidence.map(e => <Evidence key={e.questionId} value={e} />)}</div></section>
    <section className="ap-section"><h2>{overview.exception ? 'A different response you also chose' : 'A consistent thread'}</h2><p>{overview.exceptionNote}</p>{overview.exception && <Evidence value={overview.exception} />}</section>
    <section className="ap-section launch-action"><span className="ap-kicker">Try this once</span><h2>One useful next move</h2><p>{overview.action}</p></section>
  </>;
}

export function LaunchOffer() {
  return <section className="ap-section"><h2>Turn the pattern into words you can use</h2><p>Your complete report connects your actual choices to the next conversation, including:</p><ul className="launch-list"><li>Your responses across five relationship situations.</li><li>Three selected moments: what you notice, what you may assume, and what you tend to do next.</li><li>Three adaptable conversation scripts, when to use them, and what to watch afterward.</li><li>All your answers and one small practice to try.</li></ul><div className="launch-sample"><span className="ap-kicker">Example of the format · your report uses your selected moments</span><h3>When someone needs an evening alone</h3><p>“An evening to yourself works for me. Could we agree on when we’ll catch up? Having a plan helps me settle.”</p><p>Ask for something they can realistically offer, then notice whether the agreement works for you too.</p></div><p>One purchase includes the whole report. No second upgrade is needed for this edition.</p></section>;
}

export function LaunchFullReport({ report }: { report: LaunchReport }) {
  return <article className="ap-results ap-paid launch-report">
    <p className="launch-delivered">Your complete report is unlocked · All tools below are included</p>
    <LaunchSummary overview={report.overview} />
    <section className="ap-section"><h2>Your pattern across five areas</h2><div className="launch-evidence-grid">{report.domains.map(domain => <article className="launch-evidence" key={domain.title}><h3>{domain.title}</h3><p>{domain.reading}</p><ul>{RESPONSE_KEYS.filter(key => domain.counts[key]).map(key => <li key={key}>{RESPONSE_LABELS[key]}: {domain.counts[key]} choices</li>)}</ul></article>)}</div></section>
    <section className="ap-section"><h2>Three moments to work with</h2><p>Selected from different areas of your answers, starting with moments where you sought reassurance, distance, or both. If you chose steady communication throughout, these tools help you keep practicing that response.</p>{report.scenarios.map((scenario, i) => <article className="launch-scenario" key={scenario.evidence.questionId}><span className="ap-kicker">Moment {i + 1}</span><h3>{scenario.evidence.prompt}</h3><p>{scenario.reading}</p><ol className="launch-loop">{scenario.loop.map((step, index) => <li key={index}><strong>{['The moment', 'A possible interpretation', 'The move your choice describes', 'What can happen next'][index]}</strong><p>{step}</p></li>)}</ol><div className="launch-script"><h4>A sentence to adapt</h4><blockquote>“{scenario.sentence}”</blockquote></div><h4>When this fits</h4><p>{scenario.condition}</p><h4>What to notice afterward</h4><p>{scenario.observation}</p></article>)}</section>
    <section className="ap-section launch-action"><h2>{report.practice.title}</h2><ol className="launch-list">{report.practice.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Your reflection:</strong> {report.practice.reflection}</p></section>
    <section className="ap-section"><details><summary>Review all {report.answers.length} of your answers</summary><div className="launch-evidence-grid">{report.answers.map(answer => <Evidence key={answer.questionId} value={answer} />)}</div></details></section>
    <section className="ap-section"><p>Prepared from your choices in this edition. This is a self-reflection guide, not a validated assessment, diagnosis, or explanation of your partner’s behavior. You can disagree with a reading and keep what is useful. <Link href="/disclaimer">Read the limitations</Link>.</p><p>Your private report link is saved to this browser. <Link href="/recover">Find my paid reports / Resend report email</Link></p></section>
  </article>;
}
