'use client';

import { useEffect, useState } from 'react';

type RivalStatus = 'loading' | 'not_logged_in' | 'self' | 'none' | 'pending_sent' | 'pending_received' | 'rivals' | 'rival_limit';

export default function RivalButton({ targetOsuId, rivalUserId }: { targetOsuId: number; rivalUserId?: string }) {
  const [status, setStatus] = useState<RivalStatus>('loading');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/rival/status?targetOsuId=${targetOsuId}`)
      .then(r => r.json())
      .then(d => {
        setStatus(d.status ?? 'none');
        setRequestId(d.requestId ?? null);
      })
      .catch(() => setStatus('none'));
  }, [targetOsuId]);

  async function sendRequest() {
    setBusy(true);
    const res = await fetch('/api/rival/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetOsuId }),
    });
    if (res.ok) setStatus('pending_sent');
    else {
      const d = await res.json();
      if (d.error === 'rival_limit_reached') setStatus('rival_limit');
    }
    setBusy(false);
  }

  async function accept() {
    if (!requestId) return;
    setBusy(true);
    const res = await fetch(`/api/rival/request/${requestId}/accept`, { method: 'POST' });
    if (res.ok) setStatus('rivals');
    setBusy(false);
  }

  async function decline() {
    if (!requestId) return;
    setBusy(true);
    const res = await fetch(`/api/rival/request/${requestId}/decline`, { method: 'POST' });
    if (res.ok) setStatus('none');
    setBusy(false);
  }

  async function remove() {
    if (!rivalUserId) return;
    setBusy(true);
    const res = await fetch('/api/rival/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rivalUserId }),
    });
    if (res.ok) setStatus('none');
    setBusy(false);
  }

  if (status === 'loading') return <div className="h-8 w-32 bg-gray-700 animate-pulse rounded-lg" />;
  if (status === 'not_logged_in' || status === 'self') return null;

  if (status === 'rivals') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-pink-400 font-medium">⚔️ Your rival</span>
        {rivalUserId && (
          <button onClick={remove} disabled={busy} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            Remove
          </button>
        )}
      </div>
    );
  }

  if (status === 'pending_sent') {
    return <span className="text-sm text-gray-400 italic">Challenge sent...</span>;
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button onClick={accept} disabled={busy} className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
          Accept ⚔️
        </button>
        <button onClick={decline} disabled={busy} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
          Decline
        </button>
      </div>
    );
  }

  if (status === 'rival_limit') {
    return <span className="text-xs text-gray-500">Max 3 rivals reached</span>;
  }

  return (
    <button
      onClick={sendRequest}
      disabled={busy}
      className="px-3 py-1.5 bg-gray-700 hover:bg-pink-500 border border-gray-600 hover:border-pink-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
    >
      ⚔️ Challenge as Rival
    </button>
  );
}
