import {fixedFreeOverview} from './attachment-fixed-preview';
import type { QuizQuestion, ResultProfile } from './quiz';
import type { DeepResultContent } from './deep-results';
import { FIXED_VERSION, FIXED_KEYS, FIXED_LABELS, validTemplates, type FixedAnswer, type FixedBlock, type FixedKey, type FixedReport, type FixedTemplates } from './attachment-fixed';

export function buildFixedReport(questions:QuizQuestion[], choices:Record<string,number>, templates:FixedTemplates):{result:ResultProfile;deepResult:DeepResultContent} {
 if(!validTemplates(templates))throw new Error('The report edition is not ready. Please try again shortly.');
 const answers:FixedAnswer[]=questions.map((q,i)=>{const o=q.options[choices[q.id]],f=o?.fixed,c=q.reportConfig;if(!o||!f||c?.version!==FIXED_VERSION)throw new Error('This question needs a fixed interpretation before it can be submitted.');return {questionId:q.id,optionId:f.id,questionNumber:i+1,prompt:q.prompt,answer:o.label,kind:c.kind,domain:c.domain,response:c.kind==='core'&&f.tag!=='skip'&&FIXED_KEYS.includes(o.styleKey as FixedKey)?o.styleKey as FixedKey:null,tag:f.tag,title:f.title,reading:f.reading,preview:f.preview};});
 const core=answers.filter(a=>a.kind==='core'&&a.response);const counts={anxious:0,avoidant:0,secure:0,fearful:0};for(const a of core)counts[a.response!]++;
 const ranked=FIXED_KEYS.slice().sort((a,b)=>counts[b]-counts[a]);const top=ranked[0];
 const coverage=new Set(core.map(a=>a.domain)).size;
 const insufficient=core.length<10||coverage<5;
 // Same count vector always selects the same starting report. Exact ties use
 // stable display order only, and are explicitly disclosed rather than overstated.
 const primary=insufficient?null:top,state=insufficient?'insufficient':'primary';
 const secondary=insufficient?[]:ranked.slice(1).filter(k=>counts[k]>0&&counts[top]-counts[k]<=2);
 const tied=secondary.filter(k=>counts[k]===counts[top]);
 const scoreNote=insufficient?'':tied.length?`${[top,...tied].map(k=>FIXED_LABELS[k]).join(' and ')} are equally represented in your answers (${counts[top]} each). This reading starts with ${FIXED_LABELS[top].toLowerCase()}; it is not a stronger result than the tied pattern.`:secondary.length?`${FIXED_LABELS[top]} appears most often (${counts[top]} of ${core.length} answers). ${secondary.map(k=>`${FIXED_LABELS[k]}: ${counts[k]}`).join('; ')}. These patterns are close, so the examples matter more than one label.`:`${counts[top]} of your ${core.length} scored answers matched ${FIXED_LABELS[top].toLowerCase()}. Other reactions can still appear in particular situations.`;
 const profile=primary?templates.profiles[primary]:null;
 const candidates=core.filter(a=>questions.find(q=>q.id===a.questionId)?.reportConfig?.sourceNumber!==13).sort((a,b)=>Number(b.response===primary)-Number(a.response===primary)||a.questionNumber-b.questionNumber);
 const evidence:FixedAnswer[]=[];const domains=new Set<string>(),seen=new Set<string>();
 for(const first of [true,false])for(const a of candidates){const tag=a.domain+'|'+a.tag;if(evidence.length>=5||seen.has(tag)||(first&&domains.has(a.domain)))continue;evidence.push(a);seen.add(tag);domains.add(a.domain);}
 const blockOf=(a:FixedAnswer):FixedBlock=>({id:a.optionId,title:a.title,preview:a.preview,paragraphs:[a.reading],evidence:[`Question ${a.questionNumber}: “${a.answer}”`]});
 const tags=new Set(answers.filter(a=>a.tag!=='skip').map(a=>a.tag));
 const relation=answers.filter(a=>a.kind==='relationship'&&a.tag!=='skip');
 const risks:FixedBlock[]=relation.map(blockOf);
 const own=(...t:string[])=>core.some(a=>t.includes(a.tag));
 if(own('pursuit','reassurance')&&tags.has('partner_disappears'))risks.unshift({id:'cycle-pursue-withdraw',title:'You keep reaching, and the conversation never comes back',preview:'Your urge to restore contact can grow stronger when the other person leaves the issue unanswered.',paragraphs:['Your answers include needing reassurance or trying to restore contact, and you described someone who rarely returns to a disagreement. Together, those responses can form a loop: the more you need the connection restored, the more you reach; the less they respond, the harder it becomes to stop.','Getting any response can begin to feel like a successful repair. Yet the issue that made you reach out may still be untouched. The cost is the energy spent maintaining contact while your original need remains waiting.'],evidence:relation.filter(a=>a.tag==='partner_disappears').map(a=>`Question ${a.questionNumber}: “${a.answer}”`)});
 if(own('withdrawal','distance','self-reliance')&&tags.has('partner_presses'))risks.unshift({id:'cycle-pressure-distance',title:'You need breathing room, and they keep pressing for an answer',preview:'The more immediate the demand becomes, the harder it may be for you to explain what you feel.',paragraphs:['You selected withdrawing or handling things yourself, and described someone who finds a pause hard to accept. You may speak less because the conversation feels pressuring; they may push harder because you are speaking less.','Relief comes when there is distance, but neither person has necessarily understood the other. Repeated often, this can make even an ordinary need for conversation feel like a threat to your space. A clear return and respect for a pause are different from either constant pressure or disappearing indefinitely.'],evidence:relation.filter(a=>a.tag==='partner_presses').map(a=>`Question ${a.questionNumber}: “${a.answer}”`)});
 if(own('push-pull')&&(tags.has('partner_inconsistent')||tags.has('needs_dismissed')))risks.unshift({id:'cycle-closeness-alarm',title:'Just as you start to come closer, you begin protecting yourself again',preview:'Your reaching and retreating meets an interaction that does not always feel predictable or receptive.',paragraphs:['Your answers include wanting closeness and holding back, alongside inconsistent responses or dismissed needs. A caring moment may encourage you to open up, while the next difficult response reminds you to keep something protected.','In this loop, relief can be real without accumulating into trust. Each change starts a new round of interpretation. The relationship can become a place where both closeness and distance require effort, instead of giving you somewhere to settle.'],evidence:relation.filter(a=>['partner_inconsistent','needs_dismissed'].includes(a.tag)).map(a=>`Question ${a.questionNumber}: “${a.answer}”`)});
 const riskSupport:Record<string,boolean>={
  'anxious-unfinished':tags.has('partner_disappears'),
  'anxious-warmth':tags.has('partner_inconsistent')||tags.has('needs_empty_promises'),
  'anxious-repair':tags.has('partner_disappears')||tags.has('needs_dismissed'),
  'avoidant-pressure':tags.has('partner_presses'),
  'avoidant-silent':own('withdrawal','distance','self-reliance'),
  'avoidant-needs':own('withdrawal','distance','self-reliance'),
  'fearful-shift':own('push-pull'),
  'fearful-unpredictable':tags.has('partner_inconsistent')||tags.has('needs_dismissed'),
  'fearful-unheard':own('push-pull'),
  'secure-promises':tags.has('needs_empty_promises'),
  'secure-one-sided':tags.has('partner_disappears')||tags.has('needs_dismissed'),
  'secure-boundaries':tags.has('needs_dismissed'),
 };
 if(profile)risks.push(...structuredClone(profile.risks.filter(b=>riskSupport[b.id])));
 const origins:FixedBlock[]=answers.filter(a=>['family','history'].includes(a.kind)&&a.tag!=='skip').map(blockOf);
 // History is never filled from the type. Avoid extending past self-reliance into
 // the present when the person's core answers do not support that connection.
 const unsupported=answers.find(a=>a.tag==='family_help_unavailable');
 if(unsupported&&!own('self-reliance','distance','withdrawal')){const b=origins.find(x=>x.id===unsupported.optionId)!;b.paragraphs=[unsupported.reading.replace('Later, even in a close relationship, depending on someone may rarely feel like an available choice.','Your current answers also matter: that earlier expectation may have changed in later relationships.')];}
 const independence=answers.find(a=>a.tag==='family_independence_rewarded');
 if(unsupported&&independence){const at=origins.findIndex(b=>b.id===unsupported.optionId);origins[at].paragraphs.push(independence.reading);origins[at].evidence!.push(`Question ${independence.questionNumber}: “${independence.answer}”`);origins.splice(origins.findIndex(b=>b.id===independence.optionId),1);}
 const deeper:FixedBlock[]=profile?structuredClone(profile.deeper):[{id:'mixed-context',title:'Your responses change with the situation',preview:'Different reactions can belong to the same person without adding up to one clear label.',paragraphs:['The answers you chose did not form one clearly leading pattern. You may seek contact in one situation and prefer distance in another. That difference is part of the result, rather than evidence that you must secretly belong to one particular type.','The examples in your free reading show which situations brought out each response. The relationship and experience sections use the backgrounds you actually selected, so they remain relevant without requiring a single type label.']}];
 const headline=insufficient?'There is not enough information to name a main pattern':profile?.headline||'Your answers show more than one relationship pattern';
 const summary=insufficient?'Too many situations were not applicable, or some areas are missing. Your answers are saved. You can retake the quiz when you have a relationship in mind that fits more of the situations; no paid type report is offered for this result.':profile?.summary||'Your choices do not clearly point to one main style. Some situations bring out a wish for reassurance, others a wish for space. The specific moments below are more useful than forcing one label onto all of them.';
 const overview:FixedReport['overview']={version:FIXED_VERSION,state,primary,typeLabel:profile?.label|| 'More context needed',headline,summary,counts,validCore:core.length,totalCore:answers.filter(a=>a.kind==='core').length,traits:insufficient?[]:evidence.map(a=>a.title),evidence:insufficient?[]:evidence,riskPreviews:insufficient?[]:risks.slice(0,3).map(({id,title,preview})=>({id,title,preview})),familyPreviews:insufficient?[]:origins.slice(0,3).map(({id,title,preview})=>({id,title,preview})),missingBackground:answers.filter(a=>a.kind!=='core'&&a.tag==='skip').length};
 overview.secondary=secondary;overview.scoreNote=scoreNote;
 overview.contents={risks:risks.length,origins:origins.length,deeper:deeper.length,answers:answers.length};
 overview.deeperPreviews=insufficient?[]:deeper.map(({id,title,preview})=>({id,title,preview}));
 const report:FixedReport={version:FIXED_VERSION,ruleVersion:'fixed-rules-v2',templateRevision:templates.revision,overview,risks:insufficient?[]:risks,origins:insufficient?[]:origins,deeper:insufficient?[]:deeper,answers};
 report.overview=fixedFreeOverview(report);
 return {result:{key:primary||'choices',eyebrow:profile?.label||'Your relationship responses',title:headline,summary,strength:'',watchout:'',nextStep:''},deepResult:{fixedReport:report,lens:{title:'Your choices, in context',explanation:'A fixed reading of your selected answers, for reflection rather than diagnosis.',reflectionPrompt:''}}};
}