'use client';

import { useState } from 'react';
import { countryFlagUrl } from '@/lib/osu-api';

const MODE_LABELS: Record<string, string> = {
  osu: 'osu!',
  taiko: 'Taiko',
  fruits: 'Catch',
  mania: 'Mania',
};

interface Props {
  preferredMode: string;
  globalRank: number | null;
  countryRank: number | null;
  countryCode: string;
  pp: number | null;
  taikoGlobalRank: number | null;
  taikoPp: number | null;
  catchGlobalRank: number | null;
  catchPp: number | null;
  maniaGlobalRank: number | null;
  maniaPp: number | null;
}

export default function ProfileStats({
  preferredMode,
  globalRank,
  countryRank,
  countryCode,
  pp,
  taikoGlobalRank,
  taikoPp,
  catchGlobalRank,
  catchPp,
  maniaGlobalRank,
  maniaPp,
}: Props) {
  const [mode, setMode] = useState(preferredMode);

  const rankByMode: Record<string, number | null> = {
    osu: globalRank,
    taiko: taikoGlobalRank,
    fruits: catchGlobalRank,
    mania: maniaGlobalRank,
  };

  const ppByMode: Record<string, number | null> = {
    osu: pp,
    taiko: taikoPp,
    fruits: catchPp,
    mania: maniaPp,
  };

  // Only show modes that have data
  const availableModes = Object.entries(rankByMode)
    .filter(([, rank]) => rank != null)
    .map(([m]) => m);

  const currentRank = rankByMode[mode] ?? null;
  const currentPp = ppByMode[mode] ?? null;

  return (
    <div className="mb-8">
      {availableModes.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          {availableModes.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {MODE_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">
            Global Rank
            <span className="text-gray-600 text-xs ml-1">({MODE_LABELS[mode] ?? mode})</span>
          </p>
          <p className="text-2xl font-bold text-pink-400">
            {currentRank != null ? `#${currentRank.toLocaleString()}` : '—'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Country Rank</p>
          <div className="flex items-center gap-2 mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={countryFlagUrl(countryCode)} alt={countryCode} width={24} height={17} className="rounded-sm flex-shrink-0" />
            <p className="text-2xl font-bold text-purple-400">
              {mode === 'osu' && countryRank != null ? `#${countryRank.toLocaleString()}` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Average Play</p>
          <p className="text-2xl font-bold text-white">
            {currentPp != null ? `${Math.round(currentPp).toLocaleString()}pp` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
