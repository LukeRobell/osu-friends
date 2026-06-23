import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://www.osufriends.com';

export async function GET(req: NextRequest) {
  // Vercel cron passes Authorization header with CRON_SECRET
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find opted-in users with no active tournament invite today
  const alreadyInvitedToday = await prisma.tournamentParticipant.findMany({
    where: { tournament: { createdAt: { gte: today } } },
    select: { userId: true },
  });
  const excludeIds = new Set(alreadyInvitedToday.map(p => p.userId));

  const candidates = await prisma.user.findMany({
    where: {
      tournamentOptIn: true,
      isRegistered: true,
      pp: { not: null },
      id: { notIn: Array.from(excludeIds) },
    },
    orderBy: { pp: 'asc' },
  });

  const grouped: typeof candidates[] = [];
  const used = new Set<string>();

  for (const anchor of candidates) {
    if (used.has(anchor.id) || anchor.pp == null) continue;
    const window = Math.max(20, anchor.pp * 0.15);
    const group = candidates.filter(
      u => !used.has(u.id) && u.pp != null && Math.abs(u.pp - anchor.pp!) <= window
    );
    if (group.length >= 8) {
      // Take the 8 closest to anchor by pp distance
      const eight = group
        .sort((a, b) => Math.abs(a.pp! - anchor.pp!) - Math.abs(b.pp! - anchor.pp!))
        .slice(0, 8);
      grouped.push(eight);
      eight.forEach(u => used.add(u.id));
    }
  }

  let created = 0;
  for (const group of grouped) {
    const tournament = await prisma.tournament.create({
      data: {
        participants: {
          create: group.map(u => ({ userId: u.id })),
        },
      },
      include: { participants: { include: { user: true } } },
    });

    // DM each participant
    const msg = `osu!friends found a 4v4 group at your level! Ready to play?\nVote now: ${SITE_URL}/tournament/${tournament.id}`;
    for (const p of tournament.participants) {
      await fetch(`${SITE_URL}/api/bot/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osuId: p.user.osuId, message: msg }),
      }).catch(() => null);
    }

    created++;
  }

  return NextResponse.json({ ok: true, tournamentsCreated: created, candidatesFound: candidates.length });
}
