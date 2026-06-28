'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

const MODE_LABELS: Record<string, string> = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };

interface RivalRow {
  username: string;
  avatarUrl: string;
  mode: string;
  rivalRank: number | null;
  rivalPp: number | null;
  myRank: number | null;
  myPp: number | null;
  mySnipes: number;
  theirSnipes: number;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${w}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RivalCard({ r }: { r: RivalRow }) {
  const bothRanks = r.myRank && r.rivalRank;
  const myRankBar = bothRanks
    ? (Math.min(r.myRank!, r.rivalRank!) / r.myRank!) * 100
    : r.myRank ? 100 : 0;
  const rivalRankBar = bothRanks
    ? (Math.min(r.myRank!, r.rivalRank!) / r.rivalRank!) * 100
    : r.rivalRank ? 100 : 0;
  const myRankAhead = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);

  const maxPp = Math.max(r.myPp ?? 0, r.rivalPp ?? 0);
  const myPpBar    = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
  const rivalPpBar = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
  const myPpAhead = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
  const mySnipesAhead = r.mySnipes >= r.theirSnipes;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <img src={r.avatarUrl} alt={r.username} width={22} height={22} className="rounded-full" style={{ flexShrink: 0 }} />
          <span className="text-white text-xs font-semibold">⚔ {r.username}</span>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'} · {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
          </span>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#6b7280' }}>
          {MODE_LABELS[r.mode] ?? r.mode}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Rank */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#374151', fontSize: 9 }}>Rank</span>
            <span className="text-xs" style={{ fontSize: 9, color: myRankAhead ? '#34d399' : (bothRanks ? '#f87171' : 'transparent') }}>
              {myRankAhead ? "You're ahead" : "They're ahead"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs w-5" style={{ color: '#6b7280', fontSize: 9 }}>You</span>
              <Bar pct={myRankBar} color="#ec4899" />
              <span className="text-xs w-12 text-right" style={{ color: '#9ca3af', fontSize: 9 }}>
                {r.myRank ? `#${r.myRank.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-5" style={{ color: '#6b7280', fontSize: 9 }}>⚔</span>
              <Bar pct={rivalRankBar} color="#818cf8" />
              <span className="text-xs w-12 text-right" style={{ color: '#9ca3af', fontSize: 9 }}>
                {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* PP */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#374151', fontSize: 9 }}>PP</span>
            <span className="text-xs" style={{ fontSize: 9, color: myPpAhead ? '#34d399' : (r.myPp && r.rivalPp ? '#f87171' : 'transparent') }}>
              {myPpAhead ? "You're ahead" : "They're ahead"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs w-5" style={{ color: '#6b7280', fontSize: 9 }}>You</span>
              <Bar pct={myPpBar} color="#ec4899" />
              <span className="text-xs w-12 text-right" style={{ color: '#9ca3af', fontSize: 9 }}>
                {r.myPp ? `${Math.round(r.myPp)}pp` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-5" style={{ color: '#6b7280', fontSize: 9 }}>⚔</span>
              <Bar pct={rivalPpBar} color="#818cf8" />
              <span className="text-xs w-12 text-right" style={{ color: '#9ca3af', fontSize: 9 }}>
                {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Snipes */}
        <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="uppercase tracking-wider" style={{ color: '#374151', fontSize: 9 }}>Snipes this month</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: mySnipesAhead ? '#ec4899' : '#4b5563', fontSize: 11 }}>{r.mySnipes}</span>
            <span style={{ color: '#1f2937', fontSize: 9 }}>vs</span>
            <span className="text-xs font-bold" style={{ color: !mySnipesAhead ? '#818cf8' : '#4b5563', fontSize: 11 }}>{r.theirSnipes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const REFRESH_MS = 5 * 60 * 1000;

export default function WidgetPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);

  const [rivals, setRivals] = useState<RivalRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/widget/${encodeURIComponent(username)}/data`);
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setRivals(data.rivals ?? []);
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const minutesAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'transparent', padding: '12px' }}>
      <div style={{ width: 360 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#ec4899', fontSize: 13 }}>⚔</span>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{username}</span>
            <span className="text-xs" style={{ color: '#374151' }}>· rivals</span>
          </div>
          <div className="flex items-center gap-1.5">
            {refreshing && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            )}
            {minutesAgo !== null && !refreshing && (
              <span style={{ color: '#374151', fontSize: 9 }}>
                {minutesAgo === 0 ? 'just updated' : `${minutesAgo}m ago`}
              </span>
            )}
          </div>
        </div>

        {error ? (
          <div className="text-center py-6" style={{ color: '#4b5563', fontSize: 11 }}>
            Could not load rivals
          </div>
        ) : rivals.length === 0 && !refreshing ? (
          <div className="text-center py-6" style={{ color: '#4b5563', fontSize: 11 }}>
            No rivals yet
          </div>
        ) : (
          <div className="space-y-2">
            {rivals.map(r => <RivalCard key={r.username} r={r} />)}
          </div>
        )}

        <div className="mt-2 text-center" style={{ color: '#1f2937', fontSize: 9 }}>
          osufriends.com
        </div>
      </div>
    </div>
  );
}
