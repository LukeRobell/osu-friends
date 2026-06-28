import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MODE_PP   = { osu: 'pp', taiko: 'taikoPp', fruits: 'catchPp', mania: 'maniaPp' } as const;
const MODE_RANK = { osu: 'globalRank', taiko: 'taikoGlobalRank', fruits: 'catchGlobalRank', mania: 'maniaGlobalRank' } as const;

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
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

  const rivals = me.myRivals.map(ur => {
    const rival = ur.rival;
    const mode = (ur.gameMode ?? 'osu') as keyof typeof MODE_PP;
    const ppField = MODE_PP[mode] ?? 'pp';
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
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
  );
}
