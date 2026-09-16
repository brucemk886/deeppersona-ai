'use client';
import { useEffect, useState } from 'react';

type Provider = 'lemonsqueezy' | 'stripe';
type Settings = {provider: Provider; updatedAt: string | null; options: {provider: Provider; ready: boolean; sandbox: boolean}[]};
const names = {lemonsqueezy: 'Lemon Squeezy', stripe: 'Stripe'};

export default function SettingsPanel() {
  const [data, setData] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<Provider>('lemonsqueezy');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    void fetch('/api/admin/settings', {cache:'no-store',signal:abort.signal}).then(async r => {
      if (!r.ok) throw new Error('无法读取设置，请刷新重试。');
      const settings: Settings = await r.json(); setData(settings); setSelected(settings.provider);
    }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, []);
  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const r = await fetch('/api/admin/settings', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:selected})});
      const result = await r.json() as Settings & {error?: string};
      if (!r.ok) throw new Error(result.error || '保存失败，请稍后重试。');
      setData(result); setSelected(result.provider); setMessage(`已保存，新订单使用 ${names[result.provider as Provider]}。`);
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败，请稍后重试。'); }
    finally { setSaving(false); }
  }
  const current = data?.options.find(o => o.provider === data.provider);
  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">网站设置</span><h1>设置</h1><p>管理网站支付渠道，保存后立即对新订单生效。</p></div></div>
    <section className="admin-card payment-settings-card">
      <h2>支付渠道</h2>
      <p>当前使用：<strong>{data ? names[data.provider] : '正在读取…'}</strong>{current ? ` · ${current.sandbox ? '测试模式（不扣真钱）' : '正式收款'}` : ''}</p>
      {error ? <p role="alert" className="payment-settings-error">{error}</p> : null}
      <fieldset className="payment-provider-options" disabled={!data || saving}><legend>选择支付渠道</legend>
        {data?.options.map(option => <label key={option.provider} className={`payment-provider-option${selected === option.provider ? ' selected' : ''}`}>
          <input type="radio" name="payment-provider" value={option.provider} checked={selected === option.provider} disabled={!option.ready}
            onChange={() => { setSelected(option.provider); setMessage(''); }} />
          <span><strong>{names[option.provider]}</strong><small>{option.sandbox ? '测试模式 · 不扣真钱' : '正式模式 · 收取真实款项'}</small></span>
          <span className="payment-provider-status">{!option.ready ? '未完成配置' : data.provider === option.provider ? '当前使用' : '可切换'}</span>
        </label>)}
      </fieldset>
      <p>切换只影响新订单。已创建的支付及退款继续使用原渠道，已购买的报告不受影响。</p>
      <div className="payment-settings-actions"><button className="admin-primary-button" disabled={!data || saving || selected === data.provider || !data.options.find(o => o.provider === selected)?.ready} onClick={() => void save()}>{saving ? '保存中…' : '保存支付设置'}</button><span role="status">{message}</span></div>
    </section>
  </>;
}
