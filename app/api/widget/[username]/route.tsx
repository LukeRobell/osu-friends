import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

let _nunitoFont: ArrayBuffer | null = null;
async function getNunitoFont(): Promise<ArrayBuffer> {
  if (_nunitoFont) return _nunitoFont;
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@700&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
  ).then(r => r.text());
  const url = css.match(/url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error('Could not parse Nunito font URL');
  _nunitoFont = await fetch(url).then(r => r.arrayBuffer());
  return _nunitoFont;
}

const W     = 600;
const H     = 390;
const PAD   = 20;
const BAR_W = 248;
const BAR_H = 6;
const INNER = W - PAD * 2;

const MODE_LABELS: Record<string, string> = {
  osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania',
};

interface RecentPlay { title: string; version: string; pp: number }
interface SingleRival {
  username: string; avatarUrl: string; mode: string;
  rivalRank: number | null; rivalPp: number | null;
  myRank: number | null; myPp: number | null;
  mySnipes: number; theirSnipes: number;
  recentPlay: RecentPlay | null;
}

function bar(fillPx: number, color: string) {
  const fill = Math.max(0, Math.min(fillPx, BAR_W));
  return (
    <div style={{ display: 'flex', width: BAR_W, height: BAR_H, backgroundColor: '#1e1e2e', borderRadius: BAR_H }}>
      <div style={{ display: 'flex', width: fill, height: BAR_H, backgroundColor: color, borderRadius: BAR_H }} />
    </div>
  );
}

function pct2px(pct: number) { return Math.round(BAR_W * pct / 100); }

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const rawHost = req.headers.get('host') ?? 'osufriends.com';
    const host  = rawHost.replace(/^www\./, '');
    const proto = host.startsWith('localhost') ? 'http' : 'https';
    const url   = `${proto}://${host}/api/widget/${encodeURIComponent(params.username)}/data?single=1`;

    const dataRes = await fetch(url);
    if (!dataRes.ok) return new NextResponse('Not found', { status: 404 });

    const { username, rivalCount, rival }: {
      username: string; rivalCount: number; rival: SingleRival | null;
    } = await dataRes.json();

    const bothRanks    = rival && rival.myRank && rival.rivalRank;
    const myRankPct    = bothRanks ? (Math.min(rival!.myRank!, rival!.rivalRank!) / rival!.myRank!)    * 100 : (rival?.myRank    ? 100 : 0);
    const rivalRankPct = bothRanks ? (Math.min(rival!.myRank!, rival!.rivalRank!) / rival!.rivalRank!) * 100 : (rival?.rivalRank ? 100 : 0);
    const myRankAhead  = !!(rival?.myRank && rival?.rivalRank && rival.myRank < rival.rivalRank);
    const maxPp        = Math.max(rival?.myPp ?? 0, rival?.rivalPp ?? 0);
    const myPpPct      = maxPp > 0 && rival?.myPp    ? (rival.myPp    / maxPp) * 100 : 0;
    const rivalPpPct   = maxPp > 0 && rival?.rivalPp ? (rival.rivalPp / maxPp) * 100 : 0;
    const myPpAhead    = !!(rival?.myPp && rival?.rivalPp && rival.myPp > rival.rivalPp);
    const mySnipesAhead = (rival?.mySnipes ?? 0) >= (rival?.theirSnipes ?? 0);
    const nunitoFont = await getNunitoFont();

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', width: W, height: H, backgroundColor: '#0d0d12', fontFamily: 'Nunito' }}>

          {/* ── Brand header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: W, height: 72, backgroundColor: '#0a0a0f', borderBottom: '1px solid #1c1c28', gap: 10 }}>
            <img src={`${proto}://${rawHost}/favicon-96x96.png`} width={38} height={38} alt="" style={{ borderRadius: 19 }} />
            <div style={{ display: 'flex', color: '#ec4899', fontSize: 22, fontWeight: 700 }}>osufriends.com</div>
          </div>

          {/* ── Player row ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: W, padding: `10px ${PAD}px`, borderBottom: '1px solid #1c1c28' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ display: 'flex', fontSize: 13, color: '#6b7080' }}>rivals for</div>
              <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: '#ec4899' }}>{username}</div>
              {rivalCount > 1 && (
                <div style={{ display: 'flex', fontSize: 12, color: '#2e2e3d' }}>({rivalCount} total)</div>
              )}
            </div>
            {rival && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <img src={rival.avatarUrl} width={26} height={26} style={{ borderRadius: 13 }} alt="" />
                <div style={{ display: 'flex', fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>⚔ {rival.username}</div>
                <div style={{ display: 'flex', fontSize: 12, padding: '2px 8px', backgroundColor: '#1a1a24', borderRadius: 99, color: '#6b7080' }}>
                  {MODE_LABELS[rival.mode] ?? rival.mode}
                </div>
              </div>
            )}
          </div>

          {!rival ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', fontSize: 14, color: '#3d3d50' }}>No rivals yet — add one at osufriends.com</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', width: W, padding: `12px ${PAD}px 0` }}>

              {/* ── Rank ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: INNER, marginBottom: 5 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#3d3d50', fontWeight: 600 }}>RANK</div>
                <div style={{ display: 'flex', fontSize: 12, color: myRankAhead ? '#34d399' : bothRanks ? '#f87171' : '#3d3d50' }}>
                  {myRankAhead ? "You're ahead" : bothRanks ? "They're ahead" : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: INNER, marginBottom: 5 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#6b7080', width: 32 }}>You</div>
                {bar(pct2px(myRankPct), '#ec4899')}
                <div style={{ display: 'flex', fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                  {rival.myRank ? `#${rival.myRank.toLocaleString()}` : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: INNER, marginBottom: 13 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#6b7080', width: 32 }}>⚔</div>
                {bar(pct2px(rivalRankPct), '#818cf8')}
                <div style={{ display: 'flex', fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                  {rival.rivalRank ? `#${rival.rivalRank.toLocaleString()}` : '—'}
                </div>
              </div>

              {/* ── PP ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: INNER, marginBottom: 5 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#3d3d50', fontWeight: 600 }}>PP</div>
                <div style={{ display: 'flex', fontSize: 12, color: myPpAhead ? '#34d399' : (rival.myPp && rival.rivalPp) ? '#f87171' : '#3d3d50' }}>
                  {myPpAhead ? "You're ahead" : (rival.myPp && rival.rivalPp) ? "They're ahead" : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: INNER, marginBottom: 5 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#6b7080', width: 32 }}>You</div>
                {bar(pct2px(myPpPct), '#ec4899')}
                <div style={{ display: 'flex', fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                  {rival.myPp ? `${Math.round(rival.myPp)}pp` : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: INNER, marginBottom: 13 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#6b7080', width: 32 }}>⚔</div>
                {bar(pct2px(rivalPpPct), '#818cf8')}
                <div style={{ display: 'flex', fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                  {rival.rivalPp ? `${Math.round(rival.rivalPp)}pp` : '—'}
                </div>
              </div>

              {/* ── Snipes + recent play ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: INNER, paddingTop: 10, borderTop: '1px solid #1a1a24' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', fontSize: 12, color: '#3d3d50', fontWeight: 600 }}>SNIPES</div>
                  <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, color: mySnipesAhead ? '#ec4899' : '#4b4b62' }}>{rival.mySnipes}</div>
                  <div style={{ display: 'flex', fontSize: 12, color: '#2e2e3d' }}>vs</div>
                  <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, color: !mySnipesAhead ? '#818cf8' : '#4b4b62' }}>{rival.theirSnipes}</div>
                </div>
                {rival.recentPlay && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', fontSize: 12, color: '#6b7080' }}>
                        {rival.recentPlay.title.length > 24 ? rival.recentPlay.title.slice(0, 24) + '…' : rival.recentPlay.title}
                      </div>
                      <div style={{ display: 'flex', fontSize: 13, color: '#818cf8', fontWeight: 700, marginTop: 2 }}>
                        {rival.recentPlay.pp}pp
                      </div>
                    </div>
                    <div style={{ display: 'flex', fontSize: 16, color: '#3d3d50' }}>♪</div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: W, height: 34, marginTop: 'auto', backgroundColor: '#09090e', borderTop: '1px solid #1c1c28' }}>
            <div style={{ display: 'flex', fontSize: 11, color: '#3d3d50' }}>meet friends · challenge rivals · opt-in for tournaments</div>
          </div>

        </div>
      ),
      {
        width: W,
        height: H,
        fonts: [{ name: 'Nunito', data: nunitoFont, style: 'normal', weight: 700 }],
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      }
    );
  } catch (e) {
    return new NextResponse(`Widget error: ${String(e)}`, { status: 500 });
  }
}
