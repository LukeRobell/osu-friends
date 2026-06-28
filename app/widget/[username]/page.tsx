'use client';

import { useEffect, useState, useCallback } from 'react';

interface RecentPlay { title: string; version: string; pp: number }

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
  recentPlay: RecentPlay | null;
}

const MODE_LABELS: Record<string, string> = {
  osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania',
};

const CYCLE_MS   = 12000;
const FADE_MS    = 400;
const REFRESH_MS = 5 * 60 * 1000;

function Bar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ flex: 1, height: 5, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', borderRadius: 5, backgroundColor: color, transition: 'width 1s ease-out' }} />
    </div>
  );
}

function RivalCard({ r, myName }: { r: RivalRow; myName: string }) {
  const bothRanks    = r.myRank && r.rivalRank;
  const myRankBar    = bothRanks ? (Math.min(r.myRank!, r.rivalRank!) / r.myRank!)    * 100 : r.myRank    ? 100 : 0;
  const rivalRankBar = bothRanks ? (Math.min(r.myRank!, r.rivalRank!) / r.rivalRank!) * 100 : r.rivalRank ? 100 : 0;
  const myRankAhead  = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);
  const maxPp        = Math.max(r.myPp ?? 0, r.rivalPp ?? 0);
  const myPpBar      = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
  const rivalPpBar   = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
  const myPpAhead    = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
  const mySnipesAhead = r.mySnipes >= r.theirSnipes;
  const tag = myName.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Rival header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.avatarUrl} alt="" width={28} height={28} style={{ borderRadius: 14, flexShrink: 0 }} />
          <div>
            <p style={{ color: '#f3f4f6', fontSize: 12, fontWeight: 700, margin: 0 }}>⚔ {r.username}</p>
            <p style={{ color: '#4b5563', fontSize: 10, margin: '2px 0 0' }}>
              {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'} · {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 9, padding: '2px 7px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, color: '#6b7280' }}>
          {MODE_LABELS[r.mode] ?? r.mode}
        </span>
      </div>

      {/* Rank */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: '#374151', fontWeight: 600 }}>RANK</span>
        <span style={{ fontSize: 9, color: myRankAhead ? '#34d399' : bothRanks ? '#f87171' : 'transparent' }}>
          {myRankAhead ? "You're ahead" : "They're ahead"}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#6b7280', width: 22 }}>{tag}</span>
          <Bar pct={myRankBar} color="#ec4899" />
          <span style={{ fontSize: 9, color: '#9ca3af', width: 52, textAlign: 'right' }}>
            {r.myRank ? `#${r.myRank.toLocaleString()}` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#6b7280', width: 22 }}>⚔</span>
          <Bar pct={rivalRankBar} color="#818cf8" />
          <span style={{ fontSize: 9, color: '#9ca3af', width: 52, textAlign: 'right' }}>
            {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>

      {/* PP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: '#374151', fontWeight: 600 }}>PP</span>
        <span style={{ fontSize: 9, color: myPpAhead ? '#34d399' : (r.myPp && r.rivalPp) ? '#f87171' : 'transparent' }}>
          {myPpAhead ? "You're ahead" : "They're ahead"}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#6b7280', width: 22 }}>{tag}</span>
          <Bar pct={myPpBar} color="#ec4899" />
          <span style={{ fontSize: 9, color: '#9ca3af', width: 52, textAlign: 'right' }}>
            {r.myPp ? `${Math.round(r.myPp)}pp` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#6b7280', width: 22 }}>⚔</span>
          <Bar pct={rivalPpBar} color="#818cf8" />
          <span style={{ fontSize: 9, color: '#9ca3af', width: 52, textAlign: 'right' }}>
            {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
          </span>
        </div>
      </div>

      {/* Snipes + recent play */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: '#374151', fontWeight: 600 }}>SNIPES</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: mySnipesAhead ? '#ec4899' : '#4b5563' }}>{r.mySnipes}</span>
          <span style={{ fontSize: 9, color: '#1f2937' }}>vs</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: !mySnipesAhead ? '#818cf8' : '#4b5563' }}>{r.theirSnipes}</span>
        </div>
        {r.recentPlay && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span style={{ fontSize: 9, color: '#4b5563' }}>
              ♪ {r.recentPlay.title.length > 20 ? r.recentPlay.title.slice(0, 20) + '…' : r.recentPlay.title}
            </span>
            <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 700 }}>{r.recentPlay.pp}pp</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Widget({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [rivals, setRivals]           = useState<RivalRow[]>([]);
  const [idx, setIdx]                 = useState(0);
  const [visible, setVisible]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/widget/${encodeURIComponent(username)}/data`);
      if (res.ok) {
        const data = await res.json();
        setRivals(data.rivals ?? []);
        setLastUpdated(new Date());
      }
    } finally {
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Cycle rivals with fade
  useEffect(() => {
    if (rivals.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % rivals.length);
        setVisible(true);
      }, FADE_MS);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [rivals.length]);

  useEffect(() => { setIdx(0); setVisible(true); }, [rivals]);

  const rival = rivals[idx] ?? null;
  const minutesAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000) : null;

  return (
    <div style={{ backgroundColor: 'transparent', padding: 10, fontFamily: 'sans-serif', width: 360 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: '#ec4899', fontSize: 12 }}>⚔</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>{username}</span>
          <span style={{ color: '#374151', fontSize: 10 }}>· rivals</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {refreshing && (
            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ec4899', display: 'inline-block' }} />
          )}
          {minutesAgo !== null && !refreshing && (
            <span style={{ color: '#374151', fontSize: 8 }}>
              {minutesAgo === 0 ? 'just updated' : `${minutesAgo}m ago`}
            </span>
          )}
          {rivals.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {rivals.map((_, i) => (
                <span key={i} style={{
                  width: i === idx ? 14 : 5, height: 5, borderRadius: 3,
                  backgroundColor: i === idx ? '#ec4899' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease', display: 'inline-block',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card with fade */}
      {rival ? (
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '10px 12px',
            opacity: visible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
        >
          <RivalCard r={rival} myName={username} />
        </div>
      ) : (
        <div style={{ color: '#4b5563', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>
          {rivals.length === 0 && !refreshing ? 'No rivals yet' : 'Loading…'}
        </div>
      )}

      <div style={{ marginTop: 6, textAlign: 'center', color: '#374151', fontSize: 8 }}>
        osufriends.com
      </div>
    </div>
  );
}
