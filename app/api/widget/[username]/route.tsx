import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MODE_PP   = { osu: 'pp', taiko: 'taikoPp', fruits: 'catchPp', mania: 'maniaPp' } as const;
const MODE_RANK = { osu: 'globalRank', taiko: 'taikoGlobalRank', fruits: 'catchGlobalRank', mania: 'maniaGlobalRank' } as const;
const MODE_LABELS: Record<string, string> = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };

const W = 480;
const HEADER_H = 46;
const CARD_H = 152;
const FOOTER_H = 30;

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = decodeURIComponent(params.username);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const me = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: {
        id: true, username: true,
        globalRank: true, pp: true,
        taikoGlobalRank: true, taikoPp: true,
        catchGlobalRank: true, catchPp: true,
        maniaGlobalRank: true, maniaPp: true,
        myRivals: {
          orderBy: { createdAt: 'asc' },
          include: {
            rival: {
              select: {
                id: true, username: true, avatarUrl: true,
                globalRank: true, pp: true,
                taikoGlobalRank: true, taikoPp: true,
                catchGlobalRank: true, catchPp: true,
                maniaGlobalRank: true, maniaPp: true,
              },
            },
          },
        },
      },
    });

    if (!me) {
      return new NextResponse('Not found', { status: 404 });
    }

    const mySnipeRows = await prisma.snipeChallenge.groupBy({
      by: ['rivalId'],
      where: { watcherId: me.id, status: 'SNIPED', snipedAt: { gte: startOfMonth } },
      _count: { id: true },
    });
    const mySnipeMap = Object.fromEntries(mySnipeRows.map(r => [r.rivalId, r._count.id]));

    const theirSnipeRows = await prisma.snipeChallenge.groupBy({
      by: ['watcherId'],
      where: { rivalId: me.id, status: 'SNIPED', snipedAt: { gte: startOfMonth } },
      _count: { id: true },
    });
    const theirSnipeMap = Object.fromEntries(theirSnipeRows.map(r => [r.watcherId, r._count.id]));

    const rivals = me.myRivals.map(ur => {
      const rival = ur.rival;
      const mode = (ur.gameMode ?? 'osu') as keyof typeof MODE_PP;
      const ppField = MODE_PP[mode] ?? 'pp';
      const rankField = MODE_RANK[mode] ?? 'globalRank';
      return {
        username: rival.username,
        avatarUrl: rival.avatarUrl,
        rivalId: rival.id,
        mode,
        rivalRank: rival[rankField] as number | null,
        rivalPp: rival[ppField] as number | null,
        myRank: me[rankField] as number | null,
        myPp: me[ppField] as number | null,
        mySnipes: mySnipeMap[rival.id] ?? 0,
        theirSnipes: theirSnipeMap[rival.id] ?? 0,
      };
    });

    const height = HEADER_H + (rivals.length > 0 ? rivals.length * CARD_H : 72) + FOOTER_H;

    const img = new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', width: W, height, backgroundColor: '#0d0d12', fontFamily: 'sans-serif' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: HEADER_H, borderBottom: '1px solid #1c1c28' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#ec4899', fontSize: 15, lineHeight: 1 }}>⚔</span>
              <span style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>{me.username}</span>
              <span style={{ color: '#3d3d50', fontSize: 11 }}>· Rivals</span>
            </div>
            <span style={{ color: '#2e2e3d', fontSize: 10, letterSpacing: 0.5 }}>osufriends.com</span>
          </div>

          {/* Rival cards */}
          {rivals.length === 0 ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#3d3d50', fontSize: 11 }}>No rivals yet — set some up at osufriends.com</span>
            </div>
          ) : (
            rivals.map((r, i) => {
              const bothRanks = r.myRank && r.rivalRank;
              const myRankBar = bothRanks
                ? (Math.min(r.myRank!, r.rivalRank!) / r.myRank!) * 100
                : r.myRank ? 100 : 0;
              const rivalRankBar = bothRanks
                ? (Math.min(r.myRank!, r.rivalRank!) / r.rivalRank!) * 100
                : r.rivalRank ? 100 : 0;
              const myRankAhead = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);

              const maxPp = Math.max(r.myPp ?? 0, r.rivalPp ?? 0);
              const myPpBar = maxPp > 0 && r.myPp ? (r.myPp / maxPp) * 100 : 0;
              const rivalPpBar = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
              const myPpAhead = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
              const mySnipesAhead = r.mySnipes >= r.theirSnipes;

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px 10px', height: CARD_H, borderBottom: i < rivals.length - 1 ? '1px solid #1c1c28' : 'none' }}>
                  {/* Rival header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.avatarUrl} width={26} height={26} style={{ borderRadius: 13 }} alt="" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#f3f4f6', fontSize: 11, fontWeight: 600 }}>⚔ {r.username}</span>
                      <span style={{ color: '#4b4b62', fontSize: 10, marginTop: 1 }}>
                        {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'} · {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
                      </span>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 7px', backgroundColor: '#1a1a24', borderRadius: 99, color: '#6b7080' }}>
                      {MODE_LABELS[r.mode] ?? r.mode}
                    </div>
                  </div>

                  {/* Rank */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: '#3d3d50', textTransform: 'uppercase', letterSpacing: 0.8 }}>Rank</span>
                    <span style={{ fontSize: 9, color: myRankAhead ? '#34d399' : (bothRanks ? '#f87171' : '#3d3d50') }}>
                      {myRankAhead ? "You're ahead" : (bothRanks ? "They're ahead" : '')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: '#6b7080', width: 22 }}>You</span>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#1a1a24', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${myRankBar}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#9ca3af', width: 54, textAlign: 'right' }}>
                      {r.myRank ? `#${r.myRank.toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: '#6b7080', width: 22 }}>⚔</span>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#1a1a24', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${rivalRankBar}%`, height: '100%', backgroundColor: '#818cf8', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#9ca3af', width: 54, textAlign: 'right' }}>
                      {r.rivalRank ? `#${r.rivalRank.toLocaleString()}` : '—'}
                    </span>
                  </div>

                  {/* PP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: '#3d3d50', textTransform: 'uppercase', letterSpacing: 0.8 }}>PP</span>
                    <span style={{ fontSize: 9, color: myPpAhead ? '#34d399' : (r.myPp && r.rivalPp ? '#f87171' : '#3d3d50') }}>
                      {myPpAhead ? "You're ahead" : (r.myPp && r.rivalPp ? "They're ahead" : '')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: '#6b7080', width: 22 }}>You</span>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#1a1a24', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${myPpBar}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#9ca3af', width: 54, textAlign: 'right' }}>
                      {r.myPp ? `${Math.round(r.myPp)}pp` : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: '#6b7080', width: 22 }}>⚔</span>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#1a1a24', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${rivalPpBar}%`, height: '100%', backgroundColor: '#818cf8', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#9ca3af', width: 54, textAlign: 'right' }}>
                      {r.rivalPp ? `${Math.round(r.rivalPp)}pp` : '—'}
                    </span>
                  </div>

                  {/* Snipes */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid #1a1a24' }}>
                    <span style={{ fontSize: 9, color: '#3d3d50', textTransform: 'uppercase', letterSpacing: 0.8 }}>Snipes this month</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: mySnipesAhead ? '#ec4899' : '#4b4b62' }}>{r.mySnipes} snipes</span>
                      <span style={{ fontSize: 9, color: '#2e2e3d' }}>vs</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: !mySnipesAhead ? '#818cf8' : '#4b4b62' }}>{r.theirSnipes}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: FOOTER_H, backgroundColor: '#09090e', borderTop: '1px solid #1c1c28' }}>
            <span style={{ fontSize: 9, color: '#3d3d50', letterSpacing: 0.8 }}>Track your rivals at </span>
            <span style={{ fontSize: 9, color: '#ec4899', marginLeft: 4, letterSpacing: 0.8 }}>osufriends.com</span>
          </div>
        </div>
      ),
      { width: W, height }
    );

    img.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return img;
  } catch (e) {
    console.error('[widget]', e);
    return new NextResponse('Error generating widget', { status: 500 });
  }
}
