export const FIXED_VERSION = 'attachment-fixed-v2' as const;
export const FIXED_PREFIX = 'attachment-style-fixed-v2-q';
export const FIXED_KEYS = ['anxious','avoidant','secure','fearful'] as const;
export type FixedKey = typeof FIXED_KEYS[number];
export type FixedKind = 'core'|'relationship'|'family'|'history';
export type FixedQuestionConfig = { version: typeof FIXED_VERSION; kind: FixedKind; domain: string; sourceNumber?: number };
export type FixedOption = { id: string; tag: string; title: string; reading: string; preview: string; reviewZh?: {label:string;reading:string} };
export type FixedBlock = { id:string; title:string; preview:string; paragraphs:string[]; evidence?:string[] };
export type FixedTemplate = { label:string; headline:string; summary:string; traits:string[]; risks:FixedBlock[]; deeper:FixedBlock[] };
export type FixedTemplates = { version:typeof FIXED_VERSION; revision:number; profiles:Record<FixedKey,FixedTemplate> };
export type FixedAnswer = { questionId:string; optionId:string; questionNumber:number; prompt:string; answer:string; kind:FixedKind; domain:string; response:FixedKey|null; tag:string; title:string; reading:string; preview:string };
export type FixedOverview = { version:typeof FIXED_VERSION; state:'primary'|'mixed'|'insufficient'; primary:FixedKey|null; typeLabel:string; headline:string; summary:string; counts:Record<FixedKey,number>; validCore:number; totalCore:number; traits:string[]; evidence:FixedAnswer[]; riskPreviews:Pick<FixedBlock,'id'|'title'|'preview'>[]; familyPreviews:Pick<FixedBlock,'id'|'title'|'preview'>[]; missingBackground:number };
export type FixedReport = { version:typeof FIXED_VERSION; templateRevision:number; ruleVersion:'fixed-rules-v1'; overview:FixedOverview; risks:FixedBlock[]; origins:FixedBlock[]; deeper:FixedBlock[]; answers:FixedAnswer[] };
export const isFixedQuestion = (id:string) => id.startsWith(FIXED_PREFIX);
export const FIXED_LABELS:Record<FixedKey,string>={anxious:'Anxious attachment',avoidant:'Avoidant attachment',secure:'Secure attachment',fearful:'Fearful-avoidant attachment'};
export const FIXED_KIND_LABELS:Record<FixedKind,string>={core:'关系反应 · 计分',relationship:'关系互动 · 不计分',family:'家庭经历 · 不计分',history:'后来经历 · 不计分'};
export function fixedValidation(question: import('./quiz').QuizQuestion):string|null {
 const config=question.reportConfig;
 if (!config) return isFixedQuestion(question.id)?'新版题目必须保留解析配置。':null;
 if(config.version!==FIXED_VERSION||!['core','relationship','family','history'].includes(config.kind)||typeof config.domain!=='string'||!config.domain.trim()||config.domain.length>100)return '题目用途或情境领域无效。';
 if(question.options.length<4||question.options.length>8)return '新版题目需要 4–8 个选项。';
 const ids=new Set<string>();
 for(const o of question.options){const f=o.fixed;
 if(!f||typeof f.id!=='string'||!/^[a-z0-9_-]{1,100}$/.test(f.id)||ids.has(f.id)||o.optionId!==f.id)return '每个选项需要不同的稳定 ID。';ids.add(f.id);
 if([f.tag,f.title,f.reading,f.preview].some(v=>typeof v!=='string')||!f.tag.trim()||!f.title.trim()||!f.reading.trim()||f.reading.length>10000||f.title.length>250||f.preview.length>600||f.tag.length>100)return '请填写选项对应的标题、解析和预览；内容超出长度限制。';
 if(config.kind==='core'&&f.tag!=='skip'&&!FIXED_KEYS.includes(o.styleKey as FixedKey))return '计分选项必须选择依恋倾向。';
 if((config.kind!=='core'||f.tag==='skip')&&o.styleKey)return '背景题和跳过选项不能计入依恋类型。';
 }
 if(!question.options.some(o=>o.fixed?.tag==='skip'))return '请保留不适用／不确定选项。';
 return null;
}
export function validTemplates(value:unknown):value is FixedTemplates {
 if(!value||typeof value!=='object')return false;
 const t=value as FixedTemplates;
 if(t.version!==FIXED_VERSION||!Number.isSafeInteger(t.revision)||t.revision<1||!t.profiles)return false;
 return FIXED_KEYS.every(key=>{const p=t.profiles[key];return p&&[p.label,p.headline,p.summary].every(v=>typeof v==='string'&&v.trim()&&v.length<3000)&&Array.isArray(p.traits)&&p.traits.length>=3&&p.traits.length<=8&&p.traits.every(x=>typeof x==='string'&&x.trim()&&x.length<500)&&[p.risks,p.deeper].every(blocks=>Array.isArray(blocks)&&blocks.length>=1&&blocks.length<=5&&new Set(blocks.map(b=>b.id)).size===blocks.length&&blocks.every(b=>b&&typeof b.id==='string'&&/^[a-z0-9_-]{1,100}$/.test(b.id)&&typeof b.title==='string'&&b.title.trim()&&b.title.length<250&&typeof b.preview==='string'&&b.preview.length<600&&Array.isArray(b.paragraphs)&&b.paragraphs.length>=1&&b.paragraphs.length<=8&&b.paragraphs.every(x=>typeof x==='string'&&x.trim()&&x.length<5000)));});
}