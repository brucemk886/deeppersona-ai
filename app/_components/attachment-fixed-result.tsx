import Link from 'next/link';
import { FIXED_LABELS, FIXED_KEYS, type FixedOverview, type FixedReport, type FixedBlock } from '@/lib/attachment-fixed';

export function FixedSummary({overview:o}:{overview:FixedOverview}) {
 return <div className="fixed-reading"><header className="fixed-hero"><p className="ap-kicker">YOUR RELATIONSHIP PATTERNS</p><span className="fixed-type">{o.typeLabel || (o.primary?FIXED_LABELS[o.primary]:o.state==='mixed'?'A mixed pattern':'More context needed')}</span><h1>{o.headline}</h1><p className="fixed-lead">{o.summary}</p>{o.scoreNote?<div className="fixed-score-note"><p>{o.scoreNote}</p><details><summary>How your answers compare</summary><ul>{FIXED_KEYS.map(k=><li key={k}>{FIXED_LABELS[k]} <strong>{o.counts[k]} / {o.validCore}</strong></li>)}</ul><small>Counts of your selected reactions, not a measure of severity.</small></details></div>:null}<small>Based on your choices. A reflection, not a diagnosis.</small></header>
 {o.state==='insufficient'?<p><Link href="/tests/attachment-style">Retake the quiz →</Link></p>:<><section className="fixed-section"><span className="ap-kicker">WHAT YOUR ANSWERS REVEAL</span><h2>The moments that brought this pattern into view.</h2><p>You may recognize yourself in some moments more than others. These are the choices behind your result.</p><div className="fixed-evidence">{o.evidence.slice(0,3).map(a=><article key={a.questionId}><small>QUESTION {a.questionNumber}</small><h3>{a.title}</h3><blockquote>“{a.answer}”</blockquote><p>{a.reading}</p></article>)}</div></section>
</>}
 </div>;
}
function LockedChapter({number,title,intro,blocks,empty}:{number:string;title:string;intro:string;blocks:FixedOverview['riskPreviews'];empty?:string}) {
 return <section className="fixed-locked fixed-section"><div className="fixed-chapter-top"><span className="ap-kicker">{number}</span><span>In your complete reading</span></div><h2>{title}</h2><p>{intro}</p>{blocks.length?blocks.map(b=><article key={b.id}><h3>{b.title}</h3><div className="fixed-preview-excerpt"><p>{b.preview}</p><div className="fixed-redacted" aria-hidden="true"><i/><i/><i/></div></div></article>):<p>{empty}</p>}</section>;
}
export function FixedPreviews({overview:o}:{overview:FixedOverview}) {
 if(o.state==='insufficient')return null;
 return <div className="fixed-reading fixed-preview-stack">{o.riskPreviews.length?<LockedChapter number="01 / YOUR RELATIONSHIP DYNAMICS" title="What happens when your reactions meet your partner's?" intro="These chapters follow the interactions and reactions you selected." blocks={o.riskPreviews}/>:null}
 {o.familyPreviews.length?<LockedChapter number="02 / WHERE IT MAY HAVE STARTED" title="What did you learn to expect when you needed someone?" intro="Explore possible links to the family and later experiences you actually chose." blocks={o.familyPreviews}/>:<p className="fixed-context-note">You left family and past experiences open. Your reading focuses on your current reactions; it does not include a personal family-history interpretation.</p>}
 {o.deeperPreviews?.length?<LockedChapter number="03 / WHY IT FEELS FAMILIAR" title="Why can this pattern keep repeating?" intro="Look beneath the reaction: what it protects, what it can cost, and why it is familiar." blocks={o.deeperPreviews}/>:null}
 <section className="fixed-section fixed-answer-preview"><span className="ap-kicker">YOUR ANSWERS, CONNECTED</span><h2>See the meaning behind each choice.</h2><p>Your complete reading includes all {o.contents?.answers??20} answers with their individual explanations, so you can see which moments support your result.</p></section>
 </div>;
}
function FullChapter({title,kicker,blocks,empty}:{title:string;kicker:string;blocks:FixedBlock[];empty?:string}) {
 return <section className="fixed-section"><span className="ap-kicker">{kicker}</span><h2>{title}</h2>{blocks.map(b=><article className="fixed-full-block" key={b.id}><h3>{b.title}</h3>{b.evidence?.map((e,i)=><blockquote key={i}>{e}</blockquote>)}{b.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</article>)}{!blocks.length?<p>{empty}</p>:null}</section>;
}
export function FixedFullReport({report:r}:{report:FixedReport}) {
 return <article className="ap-results fixed-results"><p className="fixed-access">YOUR COMPLETE READING · SAVED WITH YOUR ANSWERS</p><FixedSummary overview={r.overview}/><div className="fixed-reading">
 <FullChapter kicker="01 / RELATIONSHIP RISKS" title="Where closeness can begin to cost you." blocks={r.risks} empty="No specific relationship interaction was selected."/>
 <FullChapter kicker="02 / FAMILY & LATER EXPERIENCES" title="The responses you learned to expect." blocks={r.origins} empty="You left these experiences open. We cannot tell what your childhood was like from an attachment label, so no family story has been assigned."/>
 {r.origins.length?<p className="fixed-context-note">These are possible connections to experiences you chose, not proof of what caused your attachment pattern. Later relationships can also change what you expect from closeness.</p>:null}
 <FullChapter kicker="03 / THE PATTERN BENEATH IT" title="Why this can keep feeling familiar." blocks={r.deeper}/>
 <section className="fixed-section"><span className="ap-kicker">YOUR COMPLETE ANSWER RECORD</span><h2>Every choice, kept in context.</h2><p>The first 14 questions describe your current reactions. The final six add context without changing your type.</p>{r.answers.map(a=><details className="fixed-answer" key={a.questionId}><summary><small>{a.questionNumber.toString().padStart(2,'0')}</small>{a.prompt}</summary><blockquote>“{a.answer}”</blockquote><p>{a.reading}</p></details>)}</section>
 <p className="fixed-footer-note">This reading is for self-reflection, not a clinical assessment. People can respond differently across relationships and over time.</p><Link href="/recover">Find your saved reports →</Link>
 </div></article>;
}