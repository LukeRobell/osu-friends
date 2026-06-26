'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const MODES = [
  { id: 'osu',    label: 'osu!' },
  { id: 'taiko',  label: 'Taiko' },
  { id: 'fruits', label: 'Catch' },
  { id: 'mania',  label: 'Mania' },
];

export default function ModeFilter() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') ?? 'osu';
  const tab  = searchParams.get('tab')  ?? 'players';

  return (
    <div className="flex gap-1 mb-6">
      {MODES.map(m => (
        <Link
          key={m.id}
          href={`/leaderboard?tab=${tab}&mode=${m.id}`}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === m.id
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
