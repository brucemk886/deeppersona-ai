'use client';

type Counts = { started:number; finished:number; submitted:number; checkout:number; paid:number };
export type TrafficData = {
  updatedAt:string; anonymous:{pageviews:number}; operations:Counts & {emails:number};
  days:{day:string;started:number;finished:number}[];
  sources:(Counts & {source:string;campaign:string;medium:string;content:string})[];
  questions:{test_id:string;question_id:string;test_title:string;prompt:string;reached:number;answered:number}[];
};
const rate = (part:number,total:number) => total ? `${(100*part/total).toFixed(1)}%` : '—';
export default function TrafficPanel({data}:{data?:TrafficData}) {
  if (!data) return <p>正在读取流量数据…</p>;
  const steps:[string,number][]=[['开始测试',data.operations.started],['完成答题',data.operations.finished],['提交邮箱',data.operations.submitted],['收银台已创建',data.operations.checkout],['付款成功',data.operations.paid]];
  const max=Math.max(1,...data.days.map(d=>d.started));
  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">获客与转化</span><h1>流量分析</h1><p>近 14 天 · 北京时间 · 更新于 {new Date(data.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</p></div></div>
    <p className="email-guidance">访问次数为页面浏览次数，刷新也计数，不是独立人数；历史访问无法补回。测试与订单排除已标记测试、沙盒及内部预览；邮箱软删除不改变历史转化。</p>
    <section className="metric-grid four">{[['访问次数',data.anonymous.pageviews],['开始测试',data.operations.started],['完成测试',data.operations.finished],['付款成功',data.operations.paid]].map(([label,value])=><div className="admin-card" key={label}><p>{label}</p><h2>{value}</h2></div>)}</section>
    <section className="admin-card"><h2>测试到付款</h2><p>按测试开始日期统计，重做算一次新测试；含免费测试，退款不抹除成交记录。</p><div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>阶段</th><th>测试会话数</th><th>较上一步</th></tr></thead><tbody>{steps.map(([name,value],i)=><tr key={name}><td>{name}</td><td>{value}</td><td>{i?rate(value,steps[i-1][1]):'—'}</td></tr>)}</tbody></table></div></section>
    <section className="admin-card"><h2>每日测试会话与完成情况</h2><div className="order-trend">{data.days.map(d=><div className="order-trend-day" key={d.day} title={`开始 ${d.started}，完成 ${d.finished}`}><strong>{d.started}</strong><div className="order-trend-track"><span style={{height:`${d.started/max*100}%`}} /></div><small>{d.day.slice(5)}</small><p>完成 {d.finished}</p></div>)}</div></section>
    <section className="admin-card"><h2>来源、账号与视频活动</h2><p>推广链接使用 utm_source、utm_campaign、utm_medium、utm_content。建议 campaign 填账号代号、content 填视频代号，不要放邮箱等个人信息。unknown 表示历史来源无法确定。</p><div className="table-scroll"><table className="lead-table-cn"><thead><tr>{['来源','活动 / 账号','媒介','内容 / 视频','开始','完成','邮箱提交','收银台','成交'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{data.sources.map((r,i)=><tr key={i}>{[r.source,r.campaign||'—',r.medium||'—',r.content||'—',r.started,r.finished,r.submitted,r.checkout,r.paid].map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div></section>
    <section className="admin-card"><h2>逐题流失</h2><p>按测试会话去重。未作答包含仍在答题的用户；历史上报遗漏可能影响到达人数。</p><div className="table-scroll"><table className="lead-table-cn"><thead><tr>{['测试','题目','到达','作答','未作答','作答率'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{data.questions.map(q=><tr key={`${q.test_id}:${q.question_id}`}><td>{q.test_title}</td><td>{q.prompt}</td><td>{q.reached}</td><td>{q.answered}</td><td>{q.reached-q.answered}</td><td>{rate(q.answered,q.reached)}</td></tr>)}</tbody></table></div></section>
  </>;
}
