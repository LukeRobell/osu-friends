'use client';

import { useState, useEffect } from 'react';

type State = 'loading' | 'idle' | 'sending' | 'sent' | 'bot_unavailable' | 'opened' | { error: string };

interface Props {
  targetId: number;
  targetUsername: string;
  roomName: string;
  roomId?: number;
  isPrivate?: boolean;
  variant?: 'host' | 'friend';
}

export default function AskToJoinButton({ targetId, targetUsername, roomName, roomId, isPrivate, variant = 'host' }: Props) {
  const [state, setState] = useState<State>('loading');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Check cooldown on mount so "Sent!" persists across page refreshes
  useEffect(() => {
    fetch(`/api/lobby/dm-status?targetId=${targetId}`)
      .then(r => r.json())
      .then(data => {
        if (data.onCooldown) {
          setSecondsRemaining(data.secondsRemaining);
          setState('sent');
        } else {
          setState('idle');
        }
      })
      .catch(() => setState('idle'));
  }, [targetId]);

  // Count down the cooldown timer; reset to idle when it expires
  useEffect(() => {
    if (state !== 'sent' || secondsRemaining <= 0) return;
    const id = setInterval(() => {
      setSecondsRemaining(s => {
        if (s <= 1) {
          clearInterval(id);
          setState('idle');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, secondsRemaining]);

  async function handleClick() {
    setState('sending');
    try {
      const res = await fetch('/api/lobby/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetUsername, roomName, roomId, isPrivate, variant }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSecondsRemaining(data.secondsRemaining ?? 420);
        setState('sent');
        return;
      }

      if (res.status === 429) {
        setSecondsRemaining(data.secondsRemaining ?? 60);
        setState('sent');
        return;
      }

      if (data.error === 'bot_unavailable') {
        setState('bot_unavailable');
        return;
      }

      if (data.fallback) {
        window.open(
          `https://osu.ppy.sh/home/messages/users/${targetId}`,
          'osu-dm',
          'width=900,height=650,noopener'
        );
        setState('opened');
        return;
      }

      setState({ error: data.error ?? `HTTP ${res.status}` });
    } catch {
      setState({ error: 'Network error' });
    }
  }

  if (state === 'loading') return null;

  if (state === 'sent') {
    const mins = Math.ceil(secondsRemaining / 60);
    return (
      <span className="text-xs text-green-400">
        Sent!{secondsRemaining > 30 && <span className="text-gray-500"> · {mins}m</span>}
      </span>
    );
  }

  if (state === 'opened') {
    return <span className="text-xs text-blue-400">Opened osu! chat ↗</span>;
  }

  if (state === 'bot_unavailable') {
    return (
      <span className="text-xs text-yellow-500" title="The DM bot is offline — try again later">
        DM unavailable
      </span>
    );
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
