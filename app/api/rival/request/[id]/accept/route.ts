import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true, username: true, rivalId: true },
  });
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const request = await prisma.rivalRequest.findUnique({
    where: { id: params.id },
    include: { fromUser: { select: { id: true, username: true, rivalId: true } } },
  });
  if (!request || request.toUserId !== me.id || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.rivalRequest.update({ where: { id: params.id }, data: { status: 'ACCEPTED' } }),
    // Clear any old rivals for both sides, then set new ones
    prisma.user.update({ where: { id: me.id }, data: { rivalId: request.fromUser.id } }),
    prisma.user.update({ where: { id: request.fromUser.id }, data: { rivalId: me.id } }),
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
