"use client";

import { useCallback, useEffect, useState } from 'react';

type MailRow = {
  id: string; report_id: string; email: string; test_title: string; status: string;
  attempts: number; error: string | null; reason: string | null; resend_id: string | null;
  created_at: number; sent_at: number | null; next_attempt: number; first_access_at: number | null;
  delivery_updated_at: number | null; order_id: string; order_status: string; livemode: number; already_delivered: number;
};
type MailData = { rows: MailRow[]; total: number; page: number; webhookConfigured: boolean;
  summary: { total: number; attention: number; delivered: number; pending: number } };
const labels: Record<string, string> = {
  pending: '待发送', retry: '自动重试中', accepted: '等待投递回执', sent: '等待投递回执',
  delivered: '发布成功', failed: '发送失败', bounced: '退信', complained: '被标记为垃圾邮件',
  suppressed: '已被邮件服务拦截', delivery_delayed: '投递延迟', sandbox_skipped: '沙盒不外发',
};
const problems = new Set(['failed','retry','bounced','complained','suppressed','delivery_delayed']);
const date = (value: number | null) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
function explanation(row: MailRow) {
  const code = row.reason || row.error || '';
  if (/daily_quota/.test(code)) return '已达到每日发送额度，请在 Resend 查看额度，恢复后再补发。';
  if (/monthly_quota/.test(code)) return '已达到每月发送额度，请在 Resend 查看额度。';
  if (/429/.test(code)) return '邮件服务限流或额度不足，请在 Resend 检查发送额度。';
  if (/401|403/.test(code)) return '邮件服务拒绝请求，请检查密钥权限和发信域名。';
  if (/resend_http_5/.test(code)) return '邮件服务暂时不可用。';
  if (code === 'retry_window_expired') return '自动重试窗口已结束，可检查原因后手动补发。';
  if (code === 'send_failed') return '发送请求失败或超时。';
  if (row.status === 'bounced') return '收件服务器拒收，请先核对邮箱，避免反复补发。';
  if (row.status === 'complained') return '用户标记了垃圾邮件，请先处理用户反馈。';
  if (row.status === 'suppressed') return '收件地址被邮件服务拦截，请到 Resend 查看原因。';
  if (row.status === 'delivery_delayed') return '收件服务器暂时无法接收，等待后续投递回执。';
  return code ? '请结合下方错误码在 Resend 查看详情。' : '';
}

export default function ReportEmailPanel() {
  const [data, setData] = useState<MailData | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/report-emails?${new URLSearchParams({ q: query, status, page: String(page) })}`, { cache: 'no-store', signal });
      if (!response.ok) throw new Error(response.status === 401 ? '登录已过期，请重新登录后台。' : '无法读取邮件记录，请重试。');
      const result: MailData = await response.json();
      if (!signal?.aborted) { setData(result); setError(''); }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : '读取失败'); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [page, query, status]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => { if (!document.hidden) void load(controller.signal); }, 60 * 60 * 1000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load]);
  async function resend(row: MailRow) {
    setSending(row.report_id); setMessage('');
    try {
      const response = await fetch('/api/admin/report-emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: row.report_id }) });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok && response.status !== 429) throw new Error(result.error || '补发请求失败');
      setMessage(result.message || '已加入队列'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : '补发请求失败'); }
    finally { setSending(''); }
  }
  return <div className="mail-records">
    <div className="admin-page-heading"><div><span className="admin-kicker">报告交付</span><h1>邮件记录</h1><p>查看报告邮件的发送、退信和补发结果。页面每 1 小时自动刷新。</p></div><button className="admin-primary-button" disabled={busy} onClick={() => void load()}>{busy ? '刷新中…' : '刷新记录'}</button></div>
    {error && <p role="alert" className="mail-alert">{error}</p>}
    {message && <p role="status" className="mail-notice">{message}</p>}
    {data && !data.webhookConfigured && <p role="alert" className="mail-alert">投递回执尚未配置，目前只能确认发送请求是否被接受。</p>}
    <div className="mail-summary">
      {([['total','发送记录'],['attention','异常 / 需关注'],['delivered','发布成功'],['pending','待发送 / 重试']] as const).map(([key,label]) => <div className={`admin-card ${key === 'attention' && data?.summary.attention ? 'mail-attention' : ''}`} key={key}><span>{label}</span><strong>{data?.summary[key] ?? '—'}</strong></div>)}
    </div>
    <section className="admin-card">
      <form className="mail-filters" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
        <label>邮箱或报告编号<input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索收件邮箱" maxLength={254} /></label>
        <label>发送状态<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">全部记录</option><option value="attention">异常 / 需关注</option><option value="failed">失败 / 退信 / 投诉</option><option value="pending">待发送 / 重试</option><option value="accepted">等待投递回执</option><option value="delivered">发布成功</option>
        </select></label><button className="admin-primary-button" type="submit">搜索</button>
      </form>
      <p className="mail-help">发布成功的报告无需补发。补发会消耗邮件额度；每份报告五分钟内最多创建一次发送任务。</p>
      <div className="table-scroll"><table className="lead-table-cn"><thead><tr><th>收件邮箱 / 报告</th><th>发送状态</th><th>尝试次数</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>{data?.rows.map(row => <tr key={row.id}>
          <td><strong>{row.email}</strong><small>{row.test_title}</small><small>{row.order_id.startsWith('preview_') ? '内部预览（未收款）' : row.livemode ? '正式订单' : '沙盒订单'}{row.order_status === 'refunded' ? ' · 已退款' : ''}</small><details><summary>记录编号</summary><small>报告：{row.report_id}</small><small>邮件：{row.id}</small>{row.resend_id && <small>Resend：{row.resend_id}</small>}</details></td>
          <td><span className={`mail-status ${problems.has(row.status) ? 'mail-status-error' : row.status === 'delivered' ? 'mail-status-ok' : ''}`}>{labels[row.status] || row.status}</span>{explanation(row) && <small>{explanation(row)}</small>}{(row.reason || row.error) && <small className="mail-code">{row.reason || row.error}</small>}{row.first_access_at && <small>报告链接有访问记录（可能含邮件安全扫描）</small>}</td>
          <td>{row.attempts} / 10</td><td><small>创建：{date(row.created_at)}</small><small>发送受理：{date(row.sent_at)}</small>{row.delivery_updated_at && <small>回执更新：{date(row.delivery_updated_at)}</small>}{row.status === 'retry' && <small>下次重试：{date(row.next_attempt)}</small>}</td>
          <td>{row.order_status === 'paid' && Boolean(row.livemode) ? <button className="mail-resend-button" disabled={Boolean(row.already_delivered) || Boolean(sending) || ['pending','retry','delivery_delayed','complained','suppressed'].includes(row.status)} onClick={() => void resend(row)}>{row.already_delivered ? '已发布成功' : sending === row.report_id ? '提交中…' : '补发此报告'}</button> : <small>不可补发</small>}</td>
        </tr>)}</tbody></table></div>
      {data && !data.rows.length && <div className="admin-empty"><strong>没有符合条件的邮件记录</strong><p>{status === 'all' && !query ? '用户购买报告或找回报告后，发送任务会显示在这里。' : '可以切换状态或修改搜索条件。'}</p></div>}
      <div className="mail-pagination"><span>共 {data?.total ?? 0} 条 · 第 {page} 页</span><button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>上一页</button><button disabled={busy || !data || page * 30 >= data.total} onClick={() => setPage(page + 1)}>下一页</button></div>
    </section>
  </div>;
}
