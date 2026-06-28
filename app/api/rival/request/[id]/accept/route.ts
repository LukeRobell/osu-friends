import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

const MAX_RIVALS = 3;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true, username: true, _count: { select: { myRivals: true } } },
  });
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (me._count.myRivals >= MAX_RIVALS) {
    return NextResponse.json({ error: 'rival_limit_reached' }, { status: 400 });
  }

  const request = await prisma.rivalRequest.findUnique({
    where: { id: params.id },
    include: {
      fromUser: { select: { id: true, username: true, _count: { select: { myRivals: true } } } },
    },
  });
  if (!request || request.toUserId !== me.id || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const mode = request.gameMode ?? 'osu';

  await prisma.$transaction([
    prisma.rivalRequest.update({ where: { id: params.id }, data: { status: 'ACCEPTED' } }),
    // Mutual: both become rivals of each other, both track the same mode
    prisma.userRival.upsert({
      where: { userId_rivalId: { userId: me.id, rivalId: request.fromUser.id } },
      create: { userId: me.id, rivalId: request.fromUser.id, gameMode: mode },
      update: {},
    }),
    prisma.userRival.upsert({
      where: { userId_rivalId: { userId: request.fromUser.id, rivalId: me.id } },
      create: { userId: request.fromUser.id, rivalId: me.id, gameMode: mode },
      update: {},
    }),
  ]);

  await createNotification({
    userId: request.fromUser.id,
    type: 'RIVAL_REQUEST',
    title: `${me.username} accepted your rival challenge! ⚔️`,
    body: 'The rivalry begins. Check their profile.',
    link: `/profile/${encodeURIComponent(me.username)}`,
  });

  return NextResponse.json({ ok: true });
}
