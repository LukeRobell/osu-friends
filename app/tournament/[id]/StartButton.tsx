'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartButton({ tournamentId }: { tournamentId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const router = useRouter();

  async function handleStart() {
    setState('loading');
    await fetch(`/api/tournament/${tournamentId}/start`, { method: 'POST' });
    setState('done');
    router.refresh();
  }

  if (state === 'done') return null;

  return (
    <button
      onClick={handleStart}
      disabled={state === 'loading'}
      className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
    >
      {state === 'loading' ? 'Starting…' : "We're live! Match started"}
    </button>
  );
}
