import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
