import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findFirst({
    where: { osuId: token.osuId as number },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const request = await prisma.rivalRequest.findUnique({ where: { id: params.id } });
  if (!request || request.toUserId !== me.id || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await prisma.rivalRequest.update({ where: { id: params.id }, data: { status: 'DECLINED' } });

  return NextResponse.json({ ok: true });
}
