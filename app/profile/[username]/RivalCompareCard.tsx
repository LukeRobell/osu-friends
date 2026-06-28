'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { countryFlagUrl } from '@/lib/osu-api';

const MODE_LABELS: Record<string, string> = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };

export interface RivalCardData {
  rivalUserId: string;
  rivalUsername: string;
  rivalAvatarUrl: string;
  rivalOsuId: number;
  rivalGlobalRank: number | null;
  rivalPp: number | null;
  rivalCountryCode: string | null;
  myGlobalRank: number | null;
  myPp: number | null;
  gameMode: string;
  snipesIGaveThisMonth: number;
  snipesTheyGaveThisMonth: number;
  recentPlay: { title: string; version: string; pp: number; beatmapId: string; beatmapsetId: string } | null;
}

export default function RivalCompareCard({
  data,
  onRemove,
}: {
  data: RivalCardData;
  onRemove: (rivalUserId: string) => void;
}) {
  const [animated, setAnimated] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch('/api/rival/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rivalUserId: data.rivalUserId }),
    });
    if (res.ok) onRemove(data.rivalUserId);
    else setRemoving(false);
  }

  // Rank bars: lower number = better. Bar width = bestRank / myRank
  const bothRanks = data.myGlobalRank && data.rivalGlobalRank;
  const myRankBar = bothRanks
    ? Math.min(data.myGlobalRank!, data.rivalGlobalRank!) / data.myGlobalRank! * 100
    : data.myGlobalRank ? 100 : 0;
  const rivalRankBar = bothRanks
    ? Math.min(data.myGlobalRank!, data.rivalGlobalRank!) / data.rivalGlobalRank! * 100
    : data.rivalGlobalRank ? 100 : 0;
  const myRankAhead = data.myGlobalRank && data.rivalGlobalRank && data.myGlobalRank < data.rivalGlobalRank;

  // PP bars: higher = better
  const maxPp = Math.max(data.myPp ?? 0, data.rivalPp ?? 0);
  const myPpBar = maxPp > 0 && data.myPp ? (data.myPp / maxPp) * 100 : 0;
  const rivalPpBar = maxPp > 0 && data.rivalPp ? (data.rivalPp / maxPp) * 100 : 0;
  const myPpAhead = data.myPp && data.rivalPp && data.myPp > data.rivalPp;

  const snipeAhead = data.snipesIGaveThisMonth >= data.snipesTheyGaveThisMonth;

  const mapUrl = data.recentPlay
    ? `https://osu.ppy.sh/beatmapsets/${data.recentPlay.beatmapsetId}#osu/${data.recentPlay.beatmapId}`
    : null;

  return (
    <div className="bg-gray-900/70 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
        <Link
          href={`/profile/${encodeURIComponent(data.rivalUsername)}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <Image
              src={data.rivalAvatarUrl}
              alt={data.rivalUsername}
              width={36}
              height={36}
              className="rounded-full ring-2 ring-pink-500/30 group-hover:ring-pink-500/60 transition-all"
              unoptimized
            />
          </div>
          <div>
            <p className="text-white text-sm font-semibold group-hover:text-pink-300 transition-colors">
              ⚔️ {data.rivalUsername}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {data.rivalCountryCode && (
                <Image
                  src={countryFlagUrl(data.rivalCountryCode)}
                  alt={data.rivalCountryCode}
                  width={14}
                  height={10}
                  className="rounded-sm opacity-70"
                  unoptimized
                />
              )}
              <span className="text-gray-500 text-xs">
                {data.rivalGlobalRank ? `#${data.rivalGlobalRank.toLocaleString()}` : '—'}
                {' · '}
                {data.rivalPp ? `${Math.round(data.rivalPp)}pp` : '—'}
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
            {MODE_LABELS[data.gameMode] ?? data.gameMode}
          </span>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 space-y-4">
        {/* Global Rank */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Global Rank</span>
            <span className={`text-xs font-medium ${myRankAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
              {myRankAhead ? "▲ You're ahead" : data.myGlobalRank && data.rivalGlobalRank ? "▼ They're ahead" : ''}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">You</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-pink-500 transition-all duration-1000 ease-out"
                  style={{ width: animated ? `${myRankBar}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-300 w-16 text-right">
                {data.myGlobalRank ? `#${data.myGlobalRank.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">⚔️</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-1000 ease-out"
                  style={{ width: animated ? `${rivalRankBar}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-300 w-16 text-right">
                {data.rivalGlobalRank ? `#${data.rivalGlobalRank.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Avg PP */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg PP</span>
            <span className={`text-xs font-medium ${myPpAhead ? 'text-emerald-400' : data.myPp && data.rivalPp ? 'text-rose-400' : ''}`}>
              {myPpAhead ? "▲ You're ahead" : data.myPp && data.rivalPp ? "▼ They're ahead" : ''}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">You</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-pink-500 transition-all duration-1000 ease-out"
                  style={{ width: animated ? `${myPpBar}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-300 w-16 text-right">
                {data.myPp ? `${Math.round(data.myPp)}pp` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">⚔️</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-1000 ease-out"
                  style={{ width: animated ? `${rivalPpBar}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-300 w-16 text-right">
                {data.rivalPp ? `${Math.round(data.rivalPp)}pp` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Snipes this month */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Snipes this month</span>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${snipeAhead ? 'text-pink-400' : 'text-gray-400'}`}>
              🎯 {data.snipesIGaveThisMonth}
            </span>
            <span className="text-gray-600 text-xs">vs</span>
            <span className={`text-sm font-bold ${!snipeAhead ? 'text-indigo-400' : 'text-gray-400'}`}>
              🎯 {data.snipesTheyGaveThisMonth}
            </span>
          </div>
        </div>

        {/* Most recent play to snipe */}
        {data.recentPlay && mapUrl && (
          <div className="pt-1 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-1">Latest play to snipe</p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate max-w-[200px]">
                {data.recentPlay.title} <span className="text-gray-500">[{data.recentPlay.version}]</span>
              </span>
              <span className="text-xs text-pink-400 font-semibold shrink-0 ml-2">
                {Math.round(data.recentPlay.pp)}pp ↗
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
