import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { countryToTimezone, tonightAt8pm, timezoneLabel } from '@/lib/timezone';

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://www.osufriends.com';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.osuId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { availability } = await req.json(); // "now" | "tonight"
  if (!['now', 'tonight'].includes(availability)) {
    return NextResponse.json({ error: 'Invalid availability' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { osuId: token.osuId as number } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const participant = await prisma.tournamentParticipant.findFirst({
    where: { tournamentId: params.id, userId: user.id },
  });
  if (!participant) return NextResponse.json({ error: 'Not in this tournament' }, { status: 403 });

  // Don't update if already voted
  if (participant.status === 'ACCEPTED') return NextResponse.json({ ok: true });

  await prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: { status: 'ACCEPTED', availability },
  });

  const all = await prisma.tournamentParticipant.findMany({
    where: { tournamentId: params.id },
    include: { user: true },
  });

  const accepted = all.filter(p => p.status === 'ACCEPTED');
  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });

  // Only lock once (guard against race conditions)
  if (accepted.length >= 6 && tournament?.status === 'PENDING_VOTES') {
    const nowVotes = accepted.filter(p => p.availability === 'now').length;
    const tonightVotes = accepted.filter(p => p.availability === 'tonight').length;
    const winning = nowVotes >= tonightVotes ? 'now' : 'tonight';

    let scheduledFor: Date;
    let timeLabel: string;

    if (winning === 'now') {
      scheduledFor = new Date(Date.now() + 30 * 60 * 1000);
      timeLabel = 'in 30 minutes';
    } else {
      // Pick timezone from majority country of accepted participants
      const countryCounts = new Map<string, number>();
      for (const p of accepted) {
        const c = p.user.countryCode;
        countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
      }
      const majorityCountry = Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
      const tz = countryToTimezone(majorityCountry);
      scheduledFor = tonightAt8pm(tz);
      const tzLabel = timezoneLabel(tz);
      timeLabel = `tonight at 8pm ${tzLabel}`;
    }

    await prisma.tournament.update({
      where: { id: params.id },
      data: { status: 'SCHEDULED', scheduledFor },
    });

    const msg = `Your osu!friends 4v4 is on! Starting ${timeLabel}.\nCoordinate here: ${SITE_URL}/tournament/${params.id}`;
    for (const p of accepted) {
      await fetch(`${SITE_URL}/api/bot/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osuId: p.user.osuId, message: msg }),
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true });
}
