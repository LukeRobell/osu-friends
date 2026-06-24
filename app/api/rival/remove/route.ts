import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true, rivalId: true },
  });
  if (!me || !me.rivalId) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.user.update({ where: { id: me.id }, data: { rivalId: null } }),
    prisma.user.update({ where: { id: me.rivalId }, data: { rivalId: null } }),
  ]);

  return NextResponse.json({ ok: true });
}
