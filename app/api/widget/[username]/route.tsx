import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Satori rules: every <div> needs display:flex, no % widths, no height:'100%'
const W = 480;
const PAD = 14;
const BAR_W = 180; // fixed pixel width for bar tracks
const HEADER_H = 46;
const CARD_H = 148;
const FOOTER_H = 28;

const MODE_LABELS: Record<string, string> = {
  osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania',
};

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

function bar(pct: number, color: string) {
  const fillW = Math.max(0, Math.round(BAR_W * pct / 100));
  return (
    <div style={{ display: 'flex', width: BAR_W, height: 4, backgroundColor: '#1a1a24', borderRadius: 4 }}>
      <div style={{ display: 'flex', width: fillW, height: 4, backgroundColor: color, borderRadius: 4 }} />
    </div>
  );
}

function rivalCard(r: RivalRow, isLast: boolean) {
  const bothRanks = r.myRank && r.rivalRank;
  const myRankPct = bothRanks
    ? (Math.min(r.myRank!, r.rivalRank!) / r.myRank!) * 100
    : r.myRank ? 100 : 0;
  const rivalRankPct = bothRanks
    ? (Math.min(r.myRank!, r.rivalRank!) / r.rivalRank!) * 100
    : r.rivalRank ? 100 : 0;
  const myRankAhead = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);

  const maxPp = Math.max(r.myPp ?? 0, r.rivalPp ?? 0);
  const myPpPct    = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
  const rivalPpPct = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
  const myPpAhead  = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
  const mySnipesAhead = r.mySnipes >= r.theirSnipes;

  const rankLabel = myRankAhead ? "You're ahead" : bothRanks ? "They're ahead" : '';
  const ppLabel   = myPpAhead   ? "You're ahead" : (r.myPp && r.rivalPp) ? "They're ahead" : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: W, padding: `10px ${PAD}px`, borderBottom: isLast ? 'none' : '1px solid #1c1c28' }}>
      {/* Rival header */}
      <div style={{ display: 'flex', alignItems: 'center', width: W - PAD * 2, marginBottom: 10 }}>
        <img src={r.avatarUrl} width={24} height={24} style={{ borderRadius: 12, marginRight: 8 }} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 8 }}>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 600, color: '#f3f4f6' }}>⚔ {r.username}</div>
          <div style={{ display: 'flex', fontSize: 10, color: '#4b4b62', marginTop: 1 }}>
            {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'} · {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 9, padding: '2px 7px', backgroundColor: '#1a1a24', borderRadius: 99, color: '#6b7080' }}>
          {MODE_LABELS[r.mode] ?? r.mode}
        </div>
      </div>

      {/* Rank */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W - PAD * 2, marginBottom: 3 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#3d3d50' }}>RANK</div>
        <div style={{ display: 'flex', fontSize: 9, color: myRankAhead ? '#34d399' : bothRanks ? '#f87171' : '#3d3d50' }}>{rankLabel}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', width: W - PAD * 2, marginBottom: 4 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#6b7080', width: 22 }}>You</div>
        {bar(myRankPct, '#ec4899')}
        <div style={{ display: 'flex', fontSize: 9, color: '#9ca3af', width: 60, marginLeft: 6 }}>
          {r.myRank ? `#${r.myRank.toLocaleString()}` : '—'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', width: W - PAD * 2, marginBottom: 10 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#6b7080', width: 22 }}>⚔</div>
        {bar(rivalRankPct, '#818cf8')}
        <div style={{ display: 'flex', fontSize: 9, color: '#9ca3af', width: 60, marginLeft: 6 }}>
          {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'}
        </div>
      </div>

      {/* PP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W - PAD * 2, marginBottom: 3 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#3d3d50' }}>PP</div>
        <div style={{ display: 'flex', fontSize: 9, color: myPpAhead ? '#34d399' : (r.myPp && r.rivalPp) ? '#f87171' : '#3d3d50' }}>{ppLabel}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', width: W - PAD * 2, marginBottom: 4 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#6b7080', width: 22 }}>You</div>
        {bar(myPpPct, '#ec4899')}
        <div style={{ display: 'flex', fontSize: 9, color: '#9ca3af', width: 60, marginLeft: 6 }}>
          {r.myPp ? `${Math.round(r.myPp)}pp` : '—'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', width: W - PAD * 2, marginBottom: 10 }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#6b7080', width: 22 }}>⚔</div>
        {bar(rivalPpPct, '#818cf8')}
        <div style={{ display: 'flex', fontSize: 9, color: '#9ca3af', width: 60, marginLeft: 6 }}>
          {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
        </div>
      </div>

      {/* Snipes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: W - PAD * 2, paddingTop: 7, borderTop: '1px solid #1a1a24' }}>
        <div style={{ display: 'flex', fontSize: 9, color: '#3d3d50' }}>SNIPES THIS MONTH</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: mySnipesAhead ? '#ec4899' : '#4b4b62' }}>{r.mySnipes}</div>
          <div style={{ display: 'flex', fontSize: 9, color: '#2e2e3d' }}>vs</div>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: !mySnipesAhead ? '#818cf8' : '#4b4b62' }}>{r.theirSnipes}</div>
        </div>
      </div>
    </div>
  );
}

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const rawHost = req.headers.get('host') ?? 'osufriends.com';
    const host = rawHost.replace(/^www\./, '');
    const proto = host.startsWith('localhost') ? 'http' : 'https';
    const dataUrl = `${proto}://${host}/api/widget/${encodeURIComponent(params.username)}/data`;

    const dataRes = await fetch(dataUrl);
    if (!dataRes.ok) return new NextResponse('Not found', { status: 404 });

    const { username, rivals }: { username: string; rivals: RivalRow[] } = await dataRes.json();
    const height = HEADER_H + (rivals.length > 0 ? rivals.length * CARD_H : 60) + FOOTER_H;

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', width: W, height, backgroundColor: '#0d0d12', fontFamily: 'sans-serif' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: W, height: HEADER_H, padding: `0 ${PAD}px`, borderBottom: '1px solid #1c1c28' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', color: '#ec4899', fontSize: 15 }}>⚔</div>
              <div style={{ display: 'flex', color: '#f3f4f6', fontSize: 13, fontWeight: 600 }}>{username}</div>
              <div style={{ display: 'flex', color: '#3d3d50', fontSize: 11 }}>· Rivals</div>
            </div>
            <div style={{ display: 'flex', color: '#2e2e3d', fontSize: 10 }}>osufriends.com</div>
          </div>

          {rivals.length === 0
            ? <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', color: '#3d3d50', fontSize: 11 }}>No rivals yet — set some up at osufriends.com</div>
              </div>
            : rivals.map((r, i) => rivalCard(r, i === rivals.length - 1))
          }

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: W, height: FOOTER_H, backgroundColor: '#09090e', borderTop: '1px solid #1c1c28' }}>
            <div style={{ display: 'flex', fontSize: 9, color: '#3d3d50' }}>Track your rivals at </div>
            <div style={{ display: 'flex', fontSize: 9, color: '#ec4899', marginLeft: 4 }}>osufriends.com</div>
          </div>
        </div>
      ),
      {
        width: W,
        height,
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      }
    );
  } catch (e) {
    console.error('[widget]', e);
    return new NextResponse(`Widget error: ${e}`, { status: 500 });
  }
}
