import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

const MAX_RIVALS = 3;

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
      select: { id: true, _count: { select: { myRivals: true } } },
    }),
    prisma.user.findFirst({
      where: { osuId: targetOsuId },
      select: { id: true },
    }),
  ]);

  if (!me || !target) return NextResponse.json({ status: 'none' });

  // Already rivals?
  const isRival = await prisma.userRival.findUnique({
    where: { userId_rivalId: { userId: me.id, rivalId: target.id } },
  });
  if (isRival) return NextResponse.json({ status: 'rivals' });

  // At limit?
  if (me._count.myRivals >= MAX_RIVALS) {
    return NextResponse.json({ status: 'rival_limit' });
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
