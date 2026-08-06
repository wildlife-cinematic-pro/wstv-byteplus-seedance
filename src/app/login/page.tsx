'use client';

import { FormEvent, useState } from 'react';

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setError('Unable to sign in. Check your credentials and try again.');
        return;
      }
      window.location.assign(safeNext(new URLSearchParams(window.location.search).get('next')));
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-semibold">ASTV sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Animal Stories TV — use the server-configured account.</p>
        </div>
        <label className="block text-sm">
          Username
          <input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required />
        </label>
        <label className="block text-sm">
          Password
          <input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        {error ? <p className="text-sm text-red-300" role="alert">{error}</p> : null}
        <button className="w-full rounded bg-emerald-600 px-3 py-2 font-medium disabled:opacity-50" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
