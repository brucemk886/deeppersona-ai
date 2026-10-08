import {buildSync} from 'esbuild';
import {writeFileSync} from 'node:fs';
const moduleText=buildSync({stdin:{contents:"export {fixedQuestions} from './lib/attachment-fixed-content';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {fixedQuestions}=await import('data:text/javascript;base64,'+Buffer.from(moduleText).toString('base64'));
const before=structuredClone(fixedQuestions[0]);before.options=before.options.slice(0,4);
const after=structuredClone(before);
after.prompt="Your partner usually keeps in touch, but you haven't heard anything for several hours. Which reaction feels closest to yours right now?";
const copy={
 anxious:{
  label:"I start worrying that my partner doesn't care about me and feel an urgent need for a reply.",
  title:'Silence makes you question how much you matter',
  reading:"A few hours without contact can start to feel like a sign that you matter less. A reply may feel urgent because it would reassure you about the relationship, not simply update you on your partner's day.",
  preview:'A gap in contact can quickly become a question about whether you still matter.',
  reviewZh:{label:'我开始担心对方是不是不在乎我，很需要马上得到回应。',reading:'几个小时没有联系，可能开始让你怀疑自己在对方心里的分量。你急着得到回应，是想确认关系还在，而不只是想知道对方正在做什么。'}
 },
 avoidant:{
  label:"I don't like caring this much, so I lower my expectations and pull back emotionally.",
  title:'You protect yourself by lowering your expectations',
  reading:'When you notice how much the silence affects you, you try to care less and pull back. Keeping your expectations low may feel safer than waiting on someone else to make you feel secure. That can protect you from disappointment while also making it harder to stay open to closeness.',
  preview:'Lowering your expectations can feel safer than letting the wait affect you.',
  reviewZh:{label:'我不喜欢自己这么在意对方，会刻意收起期待，减少投入。',reading:'当你发现没有消息会影响自己的情绪，你会试着少在乎一点、收回一些投入。比起等别人让自己安心，降低期待可能更让你觉得踏实。这能减少失望，也可能让你更难继续敞开自己。'}
 },
 secure:{
  label:'I assume my partner is busy and feel comfortable getting on with my day until we can talk.',
  title:'You can trust the connection while you wait',
  reading:'You leave room for an ordinary explanation, such as your partner being busy, and keep living your day. A gap in contact does not immediately change what you believe about the relationship.',
  preview:'You can leave room for a delay without immediately questioning the relationship.',
  reviewZh:{label:'我觉得对方可能在忙，能安心做自己的事，等有空再聊。',reading:'你能为暂时没有消息保留一种普通的解释，例如对方正在忙，也能继续过自己的生活。联系暂时中断，不会立刻改变你对这段关系的信任。'}
 },
 fearful:{
  label:"I want to reach out, but I'm afraid my partner won't respond, so I hesitate.",
  title:'You want contact and hesitate to risk no response',
  reading:'You want to reach out, but the possibility of getting no response makes you hesitate. Wanting connection and protecting yourself from rejection are both present at the same moment. Holding back does not necessarily mean you care less.',
  preview:'You want closeness and protection from rejection at the same time.',
  reviewZh:{label:'我很想联系，却又怕自己的主动得不到回应，想靠近又不敢。',reading:'你想主动联系，但又怕得不到回应。想靠近的愿望和保护自己不被拒绝的顾虑同时存在。你的犹豫，不代表你没有那么在乎。'}
 }
};
for(const o of after.options){const c=copy[o.styleKey];o.label=c.label;Object.assign(o.fixed,{title:c.title,reading:c.reading,preview:c.preview,reviewZh:c.reviewZh});}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const paths=['label','optionId','styleKey','fixed.id','fixed.tag','fixed.title','fixed.reading','fixed.preview','fixed.reviewZh.label','fixed.reviewZh.reading'];
const valueAt=(o,path)=>path.split('.').reduce((v,k)=>v[k],o);
const guard=before.options.flatMap((o,i)=>paths.map(path=>`json_extract(options_json,'$[${i}].${path}')=${quote(valueAt(o,path))}`)).join('\n  AND ');
const edits=after.options.flatMap((o,i)=>['label','fixed.title','fixed.reading','fixed.preview','fixed.reviewZh.label','fixed.reviewZh.reading'].flatMap(path=>[quote(`$[${i}].${path}`),quote(valueAt(o,path))]));
const sql=`-- Approved Q1 parallel reactions: compare one moment, not a sequence of texts.\n-- Stable option IDs, positions, style keys and tags are preserved.\n-- Historical snapshots, other questions and report templates are not touched.\nUPDATE quiz_questions\nSET prompt=${quote(after.prompt)},\n    options_json=json_set(options_json,\n      ${edits.join(',\n      ')}),\n    updated_at=CURRENT_TIMESTAMP\nWHERE id=${quote(before.id)} AND test_id='attachment-style' AND active=1\n  AND prompt=${quote(before.prompt)}\n  AND json_extract(report_config_json,'$.version')='attachment-fixed-v2'\n  AND json_extract(report_config_json,'$.kind')='core'\n  AND json_array_length(options_json)=4\n  AND ${guard};\n`;
writeFileSync('db/releases/2026-10-08-attachment-q1-parallel.sql',sql);
console.log('Prepared guarded Q1 copy and interpretation migration; four stable choices.');