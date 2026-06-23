'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const MODES = [
  { id: 'osu', label: 'osu!' },
  { id: 'taiko', label: 'Taiko' },
  { id: 'fruits', label: 'Catch' },
  { id: 'mania', label: 'Mania' },
];

export default function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMode = searchParams.get('mode') ?? '';

  function toggleMode(mode: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activeMode === mode) params.delete('mode');
    else params.set('mode', mode);
    router.push(`/discover?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 mb-8">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => toggleMode(m.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeMode === m.id
              ? 'bg-pink-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
