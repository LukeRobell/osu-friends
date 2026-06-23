'use client';

import { useState } from 'react';

type State = 'idle' | 'sending' | 'sent' | { error: string };

interface Props {
  targetId: number;
  targetUsername: string;
  roomName: string;
  variant?: 'host' | 'friend';
}

export default function AskToJoinButton({ targetId, targetUsername, roomName, variant = 'host' }: Props) {
  const [state, setState] = useState<State>('idle');

  async function handleClick() {
    setState('sending');
    try {
      const res = await fetch('/api/lobby/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, roomName, variant }),
      });
      if (res.ok) {
        setState('sent');
      } else {
        const data = await res.json().catch(() => ({}));
        setState({ error: data.error ?? `HTTP ${res.status}` });
      }
    } catch {
      setState({ error: 'Network error' });
    }
  }

  if (state === 'sent') {
    return <span className="text-xs text-green-400">Sent!</span>;
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
      title={`Ask ${targetUsername} if you can join`}
      className="text-xs text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === 'sending' ? 'Sending…' : 'Ask to join'}
    </button>
  );
}
