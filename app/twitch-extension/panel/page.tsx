'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Twitch?: {
      ext: {
        onAuthorized: (cb: (auth: { token: string }) => void) => void;
        configuration: {
          broadcaster?: { version: string; content: string };
          set: (segment: string, version: string, content: string) => void;
          onChanged: (cb: () => void) => void;
        };
      };
    };
  }
}

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
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

function RivalCard({ r }: { r: RivalRow }) {
  const bothRanks = r.myRank && r.rivalRank;
  const myRankBar    = bothRanks ? (Math.min(r.myRank!, r.rivalRank!) / r.myRank!)   * 100 : r.myRank   ? 100 : 0;
  const rivalRankBar = bothRanks ? (Math.min(r.myRank!, r.rivalRank!) / r.rivalRank!) * 100 : r.rivalRank ? 100 : 0;
  const myRankAhead  = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);
  const maxPp        = Math.max(r.myPp ?? 0, r.rivalPp ?? 0);
  const myPpBar      = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
  const rivalPpBar   = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
  const myPpAhead    = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
  const mySnipesAhead = r.mySnipes >= r.theirSnipes;

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.avatarUrl} alt="" width={20} height={20} style={{ borderRadius: 10, flexShrink: 0 }} />
          <div>
            <p style={{ color: '#f3f4f6', fontSize: 11, fontWeight: 600, margin: 0 }}>⚔ {r.username}</p>
            <p style={{ color: '#4b5563', fontSize: 9, margin: 0 }}>
              {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'} · {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 9, padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, color: '#6b7280' }}>
          {MODE_LABELS[r.mode] ?? r.mode}
        </span>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Rank */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6 }}>Rank</span>
            <span style={{ fontSize: 8, color: myRankAhead ? '#34d399' : (bothRanks ? '#f87171' : 'transparent') }}>
              {myRankAhead ? "You're ahead" : "They're ahead"}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8, color: '#6b7280', width: 18 }}>You</span>
              <Bar pct={myRankBar} color="#ec4899" />
              <span style={{ fontSize: 8, color: '#9ca3af', width: 44, textAlign: 'right' }}>
                {r.myRank ? `#${r.myRank.toLocaleString()}` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8, color: '#6b7280', width: 18 }}>⚔</span>
              <Bar pct={rivalRankBar} color="#818cf8" />
              <span style={{ fontSize: 8, color: '#9ca3af', width: 44, textAlign: 'right' }}>
                {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* PP */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6 }}>PP</span>
            <span style={{ fontSize: 8, color: myPpAhead ? '#34d399' : (r.myPp && r.rivalPp ? '#f87171' : 'transparent') }}>
              {myPpAhead ? "You're ahead" : "They're ahead"}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8, color: '#6b7280', width: 18 }}>You</span>
              <Bar pct={myPpBar} color="#ec4899" />
              <span style={{ fontSize: 8, color: '#9ca3af', width: 44, textAlign: 'right' }}>
                {r.myPp ? `${Math.round(r.myPp)}pp` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8, color: '#6b7280', width: 18 }}>⚔</span>
              <Bar pct={rivalPpBar} color="#818cf8" />
              <span style={{ fontSize: 8, color: '#9ca3af', width: 44, textAlign: 'right' }}>
                {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Snipes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 8, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6 }}>Snipes this month</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: mySnipesAhead ? '#ec4899' : '#4b5563' }}>{r.mySnipes}</span>
            <span style={{ fontSize: 8, color: '#1f2937' }}>vs</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: !mySnipesAhead ? '#818cf8' : '#4b5563' }}>{r.theirSnipes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const REFRESH_MS = 5 * 60 * 1000;

export default function TwitchPanel() {
  const [username, setUsername] = useState<string | null>(null);
  const [rivals, setRivals] = useState<RivalRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [configured, setConfigured] = useState(false);

  const readConfig = useCallback(() => {
    const raw = window.Twitch?.ext?.configuration?.broadcaster?.content;
    if (raw) {
      try {
        const { username: u } = JSON.parse(raw);
        if (u) setUsername(u);
      } catch {}
    }
    setConfigured(true);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js';
    script.onload = () => {
      window.Twitch?.ext?.onAuthorized(() => {
        readConfig();
        window.Twitch?.ext?.configuration?.onChanged(readConfig);
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [readConfig]);

  const load = useCallback(async () => {
    if (!username) return;
    setRefreshing(true);
    try {
      const res = await fetch(`https://osufriends.com/api/widget/${encodeURIComponent(username)}/data`);
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
    if (!username) return;
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [username, load]);

  const minutesAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000) : null;

  return (
    <div style={{ backgroundColor: '#0d0d12', minHeight: '100vh', padding: '10px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 298 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#ec4899', fontSize: 12 }}>⚔</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>
              {username ?? 'Rivals'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {refreshing && <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ec4899', display: 'inline-block' }} />}
            {minutesAgo !== null && !refreshing && (
              <span style={{ color: '#374151', fontSize: 8 }}>
                {minutesAgo === 0 ? 'just updated' : `${minutesAgo}m ago`}
              </span>
            )}
          </div>
        </div>

        {!configured || !username ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#4b5563', fontSize: 11 }}>
            {!configured ? 'Loading…' : 'Configure your username in the extension settings.'}
          </div>
        ) : rivals.length === 0 && !refreshing ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#4b5563', fontSize: 11 }}>
            No rivals yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rivals.map(r => <RivalCard key={r.username} r={r} />)}
          </div>
        )}

        <div style={{ marginTop: 8, textAlign: 'center', color: '#1f2937', fontSize: 8 }}>
          osufriends.com
        </div>
      </div>
    </div>
  );
}
