'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSynced(false);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        setSynced(true);
        router.refresh();
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
    >
      <span
        style={{ display: 'inline-block' }}
        className={syncing ? 'animate-spin' : ''}
      >
        ↻
      </span>
      {syncing ? 'Syncing…' : synced ? 'Synced!' : 'Sync account'}
    </button>
  );
}
