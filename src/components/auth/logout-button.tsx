'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
    } finally {
      window.location.assign('/login');
    }
  }

  return <button type="button" onClick={logout} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>;
}
