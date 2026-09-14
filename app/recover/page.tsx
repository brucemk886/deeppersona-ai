'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function RecoverReports() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendLinks(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch('/api/report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json() as { message?: string; error?: string };
      setMessage(payload.message || payload.error || '');
    } catch {
      setMessage('Unable to send right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="legal-shell">
      <article className="legal-document">
        <h1>Find my paid reports</h1>
        <p>Enter the email you provided with your test. We will send private links to that address. No password or new payment is needed.</p>
        <form onSubmit={sendLinks}>
          <label htmlFor="recovery-email">Your email</label>
          <input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <button className="primary-button" disabled={busy}>{busy ? 'Sending…' : 'Email my report links'}</button>
        </form>
        <p role="status">{message}</p>
        <p>Need help? <a href="mailto:bruce@deeppersonaai.com">bruce@deeppersonaai.com</a></p>
        <Link href="/">Back to tests</Link>
      </article>
    </main>
  );
}
