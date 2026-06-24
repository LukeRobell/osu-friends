'use client';

import { useState } from 'react';

export default function TournamentOptIn({ initialValue }: { initialValue: boolean }) {
  const [optedIn, setOptedIn] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !optedIn;
    const res = await fetch('/api/user/tournament-opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn: next }),
    });
    if (res.ok) setOptedIn(next);
    setSaving(false);
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Tournaments</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Get matched with 7 players at your level for a 4v4 tournament today.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
            optedIn ? 'bg-pink-500' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              optedIn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
