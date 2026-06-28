import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

const MAX_RIVALS = 3;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetOsuId } = await req.json();
  if (!targetOsuId) return NextResponse.json({ error: 'Missing targetOsuId' }, { status: 400 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true, username: true, _count: { select: { myRivals: true } } },
  });
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (me._count.myRivals >= MAX_RIVALS) {
    return NextResponse.json({ error: 'rival_limit_reached' }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { osuId: targetOsuId, isRegistered: true },
    select: { id: true, username: true },
  });
  if (!target) return NextResponse.json({ error: 'Target not found' }, { status: 404 });
  if (me.id === target.id) return NextResponse.json({ error: 'Cannot rival yourself' }, { status: 400 });

  // Already rivals?
  const alreadyRival = await prisma.userRival.findUnique({
    where: { userId_rivalId: { userId: me.id, rivalId: target.id } },
  });
  if (alreadyRival) return NextResponse.json({ error: 'already_rivals' }, { status: 400 });

  const existing = await prisma.rivalRequest.findFirst({
    where: {
      OR: [
        { fromUserId: me.id, toUserId: target.id, status: 'PENDING' },
        { fromUserId: target.id, toUserId: me.id, status: 'PENDING' },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: 'already_requested' }, { status: 400 });

  const request = await prisma.rivalRequest.create({
    data: { fromUserId: me.id, toUserId: target.id },
  });

  await createNotification({
    userId: target.id,
    type: 'RIVAL_REQUEST',
    title: `${me.username} wants to be your rival!`,
    body: 'Accept their challenge on your profile.',
    link: `/profile/${encodeURIComponent(me.username)}`,
  });

  return NextResponse.json({ ok: true, requestId: request.id });
}
