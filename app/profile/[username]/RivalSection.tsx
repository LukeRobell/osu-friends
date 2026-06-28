import { prisma } from '@/lib/prisma';
import { fetchUserBestPlays } from '@/lib/osu-api';
import RivalsClient from './RivalsClient';
import type { RivalCardData } from './RivalCompareCard';

const MODE_PP   = { osu: 'pp',         taiko: 'taikoPp',        fruits: 'catchPp',        mania: 'maniaPp'        } as const;
const MODE_RANK = { osu: 'globalRank', taiko: 'taikoGlobalRank', fruits: 'catchGlobalRank', mania: 'maniaGlobalRank' } as const;

export default async function RivalSection({ userId }: { userId: string }) {
  try {
    return await RivalSectionInner({ userId });
  } catch (e) {
    console.error('[RivalSection] error:', e);
    return null;
  }
}

async function RivalSectionInner({ userId }: { userId: string }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      globalRank: true, pp: true,
      taikoGlobalRank: true, taikoPp: true,
      catchGlobalRank: true, catchPp: true,
      maniaGlobalRank: true, maniaPp: true,
      myRivals: {
        orderBy: { createdAt: 'asc' },
        include: {
          rival: {
            select: {
              id: true, osuId: true, username: true, avatarUrl: true, countryCode: true,
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

  if (!me) return null;

  const mySnipeRows = await prisma.snipeChallenge.groupBy({
    by: ['rivalId'],
    where: { watcherId: userId, status: 'SNIPED', snipedAt: { gte: startOfMonth } },
    _count: { id: true },
  });
  const mySnipeMap = Object.fromEntries(mySnipeRows.map(r => [r.rivalId, r._count.id]));

  const theirSnipeRows = await prisma.snipeChallenge.groupBy({
    by: ['watcherId'],
    where: { rivalId: userId, status: 'SNIPED', snipedAt: { gte: startOfMonth } },
    _count: { id: true },
  });
  const theirSnipeMap = Object.fromEntries(theirSnipeRows.map(r => [r.watcherId, r._count.id]));

  const rivalPlayMap: Record<string, RivalCardData['recentPlay']> = {};
  await Promise.all(
    me.myRivals.map(async ur => {
      const rival = ur.rival;
      const mode  = ur.gameMode ?? 'osu';
      const plays = await fetchUserBestPlays(rival.osuId, mode, 20).catch(() => []);
      const ppField = MODE_PP[mode as keyof typeof MODE_PP] ?? 'pp';
      const rivalPp = rival[ppField] as number | null;
      const threshold = rivalPp ? rivalPp * 0.75 : 0;
      const recent = plays
        .filter(p => p.pp >= threshold)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
      rivalPlayMap[rival.id] = recent
        ? { title: recent.title, version: recent.version, pp: recent.pp, beatmapId: String(recent.beatmapId), beatmapsetId: String(recent.beatmapsetId) }
        : null;
    })
  );

  const pendingRequests = await prisma.rivalRequest.findMany({
    where: { toUserId: userId, status: 'PENDING' },
    include: {
      fromUser: { select: { id: true, username: true, avatarUrl: true, pp: true, globalRank: true } },
    },
  });

  const rivalCards: RivalCardData[] = me.myRivals.map(ur => {
    const rival    = ur.rival;
    const mode     = ur.gameMode ?? 'osu';
    const ppField  = MODE_PP[mode as keyof typeof MODE_PP]   ?? 'pp';
    const rankField = MODE_RANK[mode as keyof typeof MODE_RANK] ?? 'globalRank';
    return {
      rivalUserId:             rival.id,
      rivalUsername:           rival.username,
      rivalAvatarUrl:          rival.avatarUrl,
      rivalOsuId:              rival.osuId,
      rivalGlobalRank:         rival[rankField] as number | null,
      rivalPp:                 rival[ppField]   as number | null,
      rivalCountryCode:        rival.countryCode,
      myGlobalRank:            me[rankField]    as number | null,
      myPp:                    me[ppField]      as number | null,
      gameMode:                mode,
      snipesIGaveThisMonth:    mySnipeMap[rival.id]    ?? 0,
      snipesTheyGaveThisMonth: theirSnipeMap[rival.id] ?? 0,
      recentPlay:              rivalPlayMap[rival.id]  ?? null,
    };
  });

  if (rivalCards.length === 0 && pendingRequests.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <RivalsClient
        initialCards={rivalCards}
        pendingRequests={pendingRequests.map(r => ({
          id: r.id,
          fromUsername: r.fromUser.username,
          fromAvatarUrl: r.fromUser.avatarUrl,
          fromPp: r.fromUser.pp,
          fromGlobalRank: r.fromUser.globalRank,
        }))}
      />
    </div>
  );
}
