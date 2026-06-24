import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://www.osufriends.com';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in35min = new Date(now.getTime() + 35 * 60 * 1000);
  const in25min = new Date(now.getTime() + 25 * 60 * 1000);

  // Find SCHEDULED tournaments starting within the next 25–35 min that haven't been reminded yet
  const upcoming = await prisma.tournament.findMany({
    where: {
      status: 'SCHEDULED',
      reminderSent: false,
      scheduledFor: { gte: in25min, lte: in35min },
    },
    include: {
      participants: {
        where: { status: 'ACCEPTED' },
        include: { user: true },
      },
    },
  });

  let reminded = 0;
  for (const t of upcoming) {
    const msg = `Your osu!friends 4v4 starts in 30 minutes! Time to make the lobby.\nCoordinate: ${SITE_URL}/tournament/${t.id}`;

    for (const p of t.participants) {
      await fetch(`${SITE_URL}/api/bot/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osuId: p.user.osuId, message: msg }),
      }).catch(() => null);
    }

    await prisma.tournament.update({
      where: { id: t.id },
      data: { reminderSent: true },
    });

    reminded++;
  }

  return NextResponse.json({ ok: true, reminded });
}
