import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUserBestPlays } from '@/lib/osu-api';

const MODE_PP   = { osu: 'pp', taiko: 'taikoPp', fruits: 'catchPp', mania: 'maniaPp' } as const;
const MODE_RANK = { osu: 'globalRank', taiko: 'taikoGlobalRank', fruits: 'catchGlobalRank', mania: 'maniaGlobalRank' } as const;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};
const CACHE = 'public, s-maxage=300, stale-while-revalidate=60';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

const RIVAL_SELECT = {
  id: true, osuId: true, username: true, avatarUrl: true,
  globalRank: true, pp: true,
  taikoGlobalRank: true, taikoPp: true,
  catchGlobalRank: true, catchPp: true,
  maniaGlobalRank: true, maniaPp: true,
} as const;

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const single = req.nextUrl.searchParams.get('single') === '1';
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
        include: { rival: { select: RIVAL_SELECT } },
      },
    },
  });

  if (!me) return NextResponse.json({ error: 'not_found' }, { status: 404 });

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

  // ?single=1 — one rival (rotates hourly) + recent snipeable play, for the PNG image widget
  if (single) {
    if (me.myRivals.length === 0) {
      return NextResponse.json(
        { username: me.username, rival: null, rivalCount: 0 },
        { headers: { ...CORS, 'Cache-Control': CACHE } }
      );
    }

    const idx = Math.floor(Date.now() / (1000 * 60 * 60)) % me.myRivals.length;
    const ur = me.myRivals[idx];
    const rival = ur.rival;
    const mode = (ur.gameMode ?? 'osu') as keyof typeof MODE_PP;
    const ppField   = MODE_PP[mode]  ?? 'pp';
    const rankField = MODE_RANK[mode] ?? 'globalRank';
    const rivalPp   = rival[ppField] as number | null;

    const plays = await fetchUserBestPlays(rival.osuId, mode, 20, 300).catch(() => []);
    const threshold = rivalPp ? rivalPp * 0.75 : 0;
    const recentPlay = plays
      .filter(p => p.pp >= threshold)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

    return NextResponse.json(
      {
        username: me.username,
        rivalCount: me.myRivals.length,
        rival: {
          username: rival.username,
          avatarUrl: rival.avatarUrl,
          mode,
          rivalRank: rival[rankField] as number | null,
          rivalPp:   rival[ppField]   as number | null,
          myRank:    me[rankField]    as number | null,
          myPp:      me[ppField]      as number | null,
          mySnipes:    mySnipeMap[rival.id]    ?? 0,
          theirSnipes: theirSnipeMap[rival.id] ?? 0,
          recentPlay: recentPlay
            ? { title: recentPlay.title, version: recentPlay.version, pp: Math.round(recentPlay.pp) }
            : null,
        },
      },
      { headers: { ...CORS, 'Cache-Control': CACHE } }
    );
  }

  // Default — all rivals (used by OBS widget and Twitch extension)
  const rivals = me.myRivals.map(ur => {
    const rival = ur.rival;
    const mode = (ur.gameMode ?? 'osu') as keyof typeof MODE_PP;
    const ppField   = MODE_PP[mode]  ?? 'pp';
    const rankField = MODE_RANK[mode] ?? 'globalRank';
    return {
      username: rival.username,
      avatarUrl: rival.avatarUrl,
      mode,
      rivalRank: rival[rankField] as number | null,
      rivalPp:   rival[ppField]   as number | null,
      myRank:    me[rankField]    as number | null,
      myPp:      me[ppField]      as number | null,
      mySnipes:    mySnipeMap[rival.id]    ?? 0,
      theirSnipes: theirSnipeMap[rival.id] ?? 0,
    };
  });

  return NextResponse.json(
    { username: me.username, rivals },
    { headers: { ...CORS, 'Cache-Control': CACHE } }
  );
}
