import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ status: 'not_logged_in' });

  const targetOsuId = Number(req.nextUrl.searchParams.get('targetOsuId'));
  if (!targetOsuId) return NextResponse.json({ error: 'Missing targetOsuId' }, { status: 400 });

  if ((token.osuId as number) === targetOsuId) {
    return NextResponse.json({ status: 'self' });
  }

  const [me, target] = await Promise.all([
    prisma.user.findFirst({
      where: { osuId: token.osuId as number },
      select: { id: true, rivalId: true },
    }),
    prisma.user.findFirst({
      where: { osuId: targetOsuId },
      select: { id: true },
    }),
  ]);

  if (!me || !target) return NextResponse.json({ status: 'none' });

  if (me.rivalId === target.id) return NextResponse.json({ status: 'rivals' });
  if (me.rivalId && me.rivalId !== target.id) {
    return NextResponse.json({ status: 'have_rival' });
  }

  const pending = await prisma.rivalRequest.findFirst({
    where: {
      OR: [
        { fromUserId: me.id, toUserId: target.id, status: 'PENDING' },
        { fromUserId: target.id, toUserId: me.id, status: 'PENDING' },
      ],
    },
  });

  if (!pending) return NextResponse.json({ status: 'none' });
  if (pending.fromUserId === me.id) return NextResponse.json({ status: 'pending_sent', requestId: pending.id });
  return NextResponse.json({ status: 'pending_received', requestId: pending.id });
}
