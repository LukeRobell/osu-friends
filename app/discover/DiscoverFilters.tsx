'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const MODES = [
  { id: 'osu', label: 'osu!' },
  { id: 'taiko', label: 'Taiko' },
  { id: 'fruits', label: 'Catch' },
  { id: 'mania', label: 'Mania' },
];

const LANGUAGES = [
  'English', 'Japanese', 'Korean', 'Chinese', 'Portuguese', 'Russian',
  'Spanish', 'French', 'German', 'Polish', 'Indonesian', 'Thai',
  'Vietnamese', 'Turkish', 'Arabic', 'Italian', 'Dutch', 'Filipino',
];

export default function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeMode = searchParams.get('mode') ?? '';
  const showAll = searchParams.get('all') === '1';
  const country = searchParams.get('country') ?? '';
  const language = searchParams.get('language') ?? '';
  const rankMin = searchParams.get('rankMin') ?? '';
  const rankMax = searchParams.get('rankMax') ?? '';
  const q = searchParams.get('q') ?? '';

  const [rankMinInput, setRankMinInput] = useState(rankMin);
  const [rankMaxInput, setRankMaxInput] = useState(rankMax);
  const [countryInput, setCountryInput] = useState(country);

  const push = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/discover?${params.toString()}`);
  }, [router, searchParams]);

  function toggleMode(mode: string) {
    push({ mode: activeMode === mode ? null : mode });
  }

  function toggleAll() {
    push({ all: showAll ? null : '1' });
  }

  function applyRank() {
    push({ rankMin: rankMinInput || null, rankMax: rankMaxInput || null });
  }

  function applyCountry() {
    push({ country: countryInput.toUpperCase().slice(0, 2) || null });
  }

  const activeFilters = [country, language, rankMin, rankMax].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-8">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by username..."
          defaultValue={q}
          onKeyDown={e => {
            if (e.key === 'Enter') push({ q: (e.target as HTMLInputElement).value || null });
          }}
          onChange={e => {
            if (!e.target.value) push({ q: null });
          }}
          className="w-full bg-gray-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mode buttons */}
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => toggleMode(m.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeMode === m.id ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Country */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Country (e.g. US)"
            maxLength={2}
            value={countryInput}
            onChange={e => setCountryInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyCountry(); }}
            onBlur={applyCountry}
            className={`w-32 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none uppercase ${
              country ? 'border-pink-500/50 text-pink-400' : 'border-transparent'
            }`}
          />
        </div>

        {/* Language dropdown */}
        <select
          value={language}
          onChange={e => push({ language: e.target.value || null })}
          className={`bg-gray-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${
            language ? 'border-pink-500/50 text-pink-400' : 'border-transparent text-gray-400'
          }`}
        >
          <option value="">Any language</option>
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Rank range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Rank min"
            value={rankMinInput}
            onChange={e => setRankMinInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyRank(); }}
            onBlur={applyRank}
            className={`w-28 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none ${
              rankMin ? 'border-pink-500/50' : 'border-transparent'
            }`}
          />
          <span className="text-gray-600 text-sm">–</span>
          <input
            type="number"
            placeholder="Rank max"
            value={rankMaxInput}
            onChange={e => setRankMaxInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyRank(); }}
            onBlur={applyRank}
            className={`w-28 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none ${
              rankMax ? 'border-pink-500/50' : 'border-transparent'
            }`}
          />
        </div>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <button
          onClick={toggleAll}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showAll ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All members
        </button>

        {activeFilters > 0 && (
          <button
            onClick={() => push({ country: null, language: null, rankMin: null, rankMax: null })}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
          >
            Clear filters ({activeFilters})
          </button>
        )}
      </div>
    </div>
  );
}
