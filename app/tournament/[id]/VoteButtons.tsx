'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VoteButtons({ tournamentId, hasVoted }: { tournamentId: string; hasVoted: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(hasVoted);
  const router = useRouter();

  async function vote(availability: 'now' | 'tonight') {
    setLoading(availability);
    await fetch(`/api/tournament/${tournamentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability }),
    });
    setDone(true);
    setLoading(null);
    router.refresh();
  }

  if (done) {
    return (
      <p className="text-green-400 text-sm text-center py-2">
        Vote recorded — waiting for others…
      </p>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => vote('now')}
        disabled={loading !== null}
        className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
      >
        {loading === 'now' ? '…' : '⚡ Right now'}
      </button>
      <button
        onClick={() => vote('tonight')}
        disabled={loading !== null}
        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
      >
        {loading === 'tonight' ? '…' : '🌙 Tonight'}
      </button>
    </div>
  );
}
