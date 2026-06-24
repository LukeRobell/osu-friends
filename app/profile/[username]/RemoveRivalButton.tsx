'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RemoveRivalButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm('Remove your rival? You can always challenge them again.')) return;
    setBusy(true);
    await fetch('/api/rival/remove', { method: 'POST' });
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      onClick={handleRemove}
      disabled={busy}
      className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      Remove rival
    </button>
  );
}
