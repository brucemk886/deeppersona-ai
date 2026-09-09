'use client';
import {useState} from 'react';
import Link from 'next/link';
export default function RecoverReports() {
  const [email,setEmail]=useState(''), [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  return <main className="legal-shell"><article className="legal-document"><h1>Find my paid reports</h1><p>Enter the email you provided with your test. We will send private links to that address. No password or new payment is needed.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await fetch('/api/report-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const j=await r.json();setMessage(j.message||j.error);}catch{setMessage('Unable to send right now. Please try again.');}finally{setBusy(false);}}}><label htmlFor="recovery-email">Your email</label><input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} /><button className="primary-button" disabled={busy}>{busy?'Sending…':'Email my report links'}</button></form><p role="status">{message}</p><p>Need help? <a href="mailto:bruce@deeppersonaai.com">bruce@deeppersonaai.com</a></p><Link href="/">Back to tests</Link></article></main>;
}
