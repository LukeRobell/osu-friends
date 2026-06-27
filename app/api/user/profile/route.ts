import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.osuId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { aboutMe, playSchedule, mapStyles, discordUsername, twitchUsername, timezone } = body;

  const update: Record<string, unknown> = {};

  if (aboutMe !== undefined) {
    update.aboutMe = typeof aboutMe === 'string' ? aboutMe.slice(0, 2000) || null : null;
  }
  if (playSchedule !== undefined) {
    update.playSchedule = Array.isArray(playSchedule) ? playSchedule.filter((x: unknown) => typeof x === 'string') : [];
  }
  if (mapStyles !== undefined) {
    update.mapStyles = Array.isArray(mapStyles) ? mapStyles.filter((x: unknown) => typeof x === 'string') : [];
  }
  if (discordUsername !== undefined) {
    update.discordUsername = typeof discordUsername === 'string' ? discordUsername.trim().slice(0, 64) || null : null;
  }
  if (twitchUsername !== undefined) {
    update.twitchUsername = typeof twitchUsername === 'string' ? twitchUsername.trim().toLowerCase().slice(0, 64) || null : null;
  }
  if (timezone !== undefined) {
    update.timezone = typeof timezone === 'string' ? timezone.slice(0, 64) || null : null;
  }

  await prisma.user.update({
    where: { osuId: session.user.osuId },
    data: update,
  });

  return NextResponse.json({ ok: true });
}
