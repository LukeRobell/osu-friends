import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUserBestPlays } from '@/lib/osu-api';
import { createNotification } from '@/lib/notifications';
import { sendBotDm } from '@/lib/bot-dm';

// Scale notification threshold by rival's avg pp to avoid spamming low-ranked players.
// Lower-ranked players hit "significant" plays on almost every map, so we raise the bar.
function rivalThresholdMultiplier(avgPp: number): number {
  if (avgPp < 100)  return 0.97; // must be near their personal best
  if (avgPp < 300)  return 0.92;
  if (avgPp < 500)  return 0.85;
  if (avgPp < 1000) return 0.80;
  return 0.75;                   // 500pp+ players: original threshold
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all users who have a rival set
  const watchers = await prisma.user.findMany({
    where: { rivalId: { not: null }, isRegistered: true },
    select: {
      id: true,
      osuId: true,
      username: true,
      rivalId: true,
      rival: { select: { id: true, osuId: true, username: true, pp: true } },
    },
  });

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  let notified = 0;

  for (const watcher of watchers) {
    const rival = watcher.rival;
    if (!rival) continue;

    const plays = await fetchUserBestPlays(rival.osuId, 'osu', 50).catch(() => []);
    if (!plays.length) continue;

    const threshold = rival.pp != null ? rival.pp * rivalThresholdMultiplier(rival.pp) : 0;
    const recentSignificant = plays.filter(p => p.pp >= threshold && p.createdAt > cutoff);
    if (!recentSignificant.length) continue;

    // Find which ones we haven't notified about yet
    const knownIds = await prisma.rivalNotifiedPlay.findMany({
      where: { userId: watcher.id, osuScoreId: { in: recentSignificant.map(p => p.id) } },
      select: { osuScoreId: true },
    });
    const knownSet = new Set(knownIds.map(k => k.osuScoreId));
    const newPlays = recentSignificant.filter(p => !knownSet.has(p.id));

    for (const play of newPlays) {
      const mapUrl = `https://osu.ppy.sh/beatmapsets/${play.beatmapsetId}#osu/${play.beatmapId}`;
      const ppStr = `${Math.round(play.pp)}pp`;

      await createNotification({
        userId: watcher.id,
        type: 'RIVAL_PLAY',
        title: `${rival.username} hit a ${ppStr} play!`,
        body: `${play.title} [${play.version}] — Want to snipe it?`,
        link: mapUrl,
      });

      await sendBotDm(
        watcher.osuId,
        `Your rival ${rival.username} just set a ${ppStr} play on ${play.title} [${play.version}]!\nWant to snipe their score?\n${mapUrl}`
      );

      await prisma.rivalNotifiedPlay.create({
        data: { userId: watcher.id, osuScoreId: play.id },
      });

      notified++;
    }
  }

  return NextResponse.json({ ok: true, notified, watchersChecked: watchers.length });
}
