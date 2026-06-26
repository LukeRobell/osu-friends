import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUserBestPlays, fetchUserScoreOnBeatmap } from '@/lib/osu-api';
import { createNotification } from '@/lib/notifications';
import { sendBotDm } from '@/lib/bot-dm';

// Scale notification threshold by rival's avg pp to avoid spamming low-ranked players.
// Lower-ranked players hit "significant" plays on almost every map, so we raise the bar.
function rivalThresholdMultiplier(avgPp: number): number {
  if (avgPp < 100)  return 0.97;
  if (avgPp < 300)  return 0.92;
  if (avgPp < 500)  return 0.85;
  if (avgPp < 1000) return 0.80;
  return 0.75;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const expiryCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let notified = 0;
  let snipesFound = 0;

  // ── Phase 1: detect new rival plays, notify watcher, create SnipeChallenges ──
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

  for (const watcher of watchers) {
    const rival = watcher.rival;
    if (!rival) continue;

    const plays = await fetchUserBestPlays(rival.osuId, 'osu', 50).catch(() => []);
    if (!plays.length) continue;

    const threshold = rival.pp != null ? rival.pp * rivalThresholdMultiplier(rival.pp) : 0;
    const recentSignificant = plays.filter(p => p.pp >= threshold && p.createdAt > cutoff);
    if (!recentSignificant.length) continue;

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

      // Create a snipe challenge — resolved in Phase 2 on future cron runs
      await prisma.snipeChallenge.upsert({
        where: { watcherId_osuScoreId: { watcherId: watcher.id, osuScoreId: play.id } },
        create: {
          watcherId:    watcher.id,
          rivalId:      rival.id,
          osuScoreId:   play.id,
          beatmapId:    String(play.beatmapId),
          beatmapsetId: String(play.beatmapsetId),
          mapTitle:     play.title,
          mapVersion:   play.version,
          targetPp:     play.pp,
        },
        update: {},
      });

      notified++;
    }
  }

  // ── Phase 2: check open challenges — did the watcher beat the score? ──
  const openChallenges = await prisma.snipeChallenge.findMany({
    where: { status: 'OPEN', createdAt: { gte: expiryCutoff } },
    include: {
      watcher: { select: { id: true, osuId: true, username: true } },
      rival:   { select: { id: true, osuId: true, username: true } },
    },
  });

  for (const challenge of openChallenges) {
    const score = await fetchUserScoreOnBeatmap(
      challenge.watcher.osuId,
      challenge.beatmapId
    ).catch(() => null);

    if (!score || score.pp <= challenge.targetPp) continue;

    // Snipe confirmed!
    await prisma.snipeChallenge.update({
      where: { id: challenge.id },
      data: { status: 'SNIPED', snipedAt: new Date() },
    });

    const mapUrl = `https://osu.ppy.sh/beatmapsets/${challenge.beatmapsetId}#osu/${challenge.beatmapId}`;
    const ppStr = `${Math.round(score.pp)}pp`;

    // Notify the watcher: snipe confirmed
    await createNotification({
      userId: challenge.watcher.id,
      type: 'SNIPE',
      title: `Snipe confirmed! 🎯`,
      body: `You beat ${challenge.rival.username}'s score on ${challenge.mapTitle} [${challenge.mapVersion}]`,
      link: mapUrl,
    });

    // Notify the rival: they got sniped
    await createNotification({
      userId: challenge.rival.id,
      type: 'SNIPE',
      title: `${challenge.watcher.username} sniped you!`,
      body: `They beat your ${Math.round(challenge.targetPp)}pp on ${challenge.mapTitle} [${challenge.mapVersion}]`,
      link: mapUrl,
    });

    await sendBotDm(
      challenge.rival.osuId,
      `${challenge.watcher.username} just sniped your ${Math.round(challenge.targetPp)}pp score on ${challenge.mapTitle} [${challenge.mapVersion}]!\n${mapUrl}`
    );

    snipesFound++;
  }

  // ── Phase 3: expire old open challenges ──
  await prisma.snipeChallenge.updateMany({
    where: { status: 'OPEN', createdAt: { lt: expiryCutoff } },
    data: { status: 'EXPIRED' },
  });

  return NextResponse.json({
    ok: true,
    notified,
    snipesFound,
    watchersChecked: watchers.length,
    openChallengesChecked: openChallenges.length,
  });
}
