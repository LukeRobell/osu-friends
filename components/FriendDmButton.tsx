'use client';

import { useState, useEffect } from 'react';

type State = 'loading' | 'idle' | 'sending' | 'sent' | 'bot_unavailable' | { error: string };

interface Props {
  targetId: number;
  targetUsername: string;
}

export default function FriendDmButton({ targetId, targetUsername }: Props) {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    fetch(`/api/member/dm-status?targetId=${targetId}`)
      .then(r => r.json())
      .then(data => setState(data.onCooldown ? 'sent' : 'idle'))
      .catch(() => setState('idle'));
  }, [targetId]);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setState('sending');
    try {
      const res = await fetch('/api/member/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetUsername }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status === 429) { setState('sent'); return; }
      if (data.error === 'bot_unavailable') { setState('bot_unavailable'); return; }
      setState({ error: data.error ?? `HTTP ${res.status}` });
    } catch {
      setState({ error: 'Network error' });
    }
  }

  if (state === 'loading') return null;

  if (state === 'sent') {
    return <span className="text-xs text-green-400">DM Sent!</span>;
  }

  if (state === 'bot_unavailable') {
    return <span className="text-xs text-yellow-500" title="DM bot is offline">DM unavailable</span>;
  }

  if (typeof state === 'object') {
    return (
      <button
        onClick={handleClick}
        title={state.error}
        className="text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        Failed — retry?
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'sending'}
      className="text-xs text-pink-400 hover:text-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === 'sending' ? 'Sending…' : "Let's be friends!"}
    </button>
  );
}
