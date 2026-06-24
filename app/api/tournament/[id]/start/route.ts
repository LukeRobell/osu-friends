import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.osuId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { osuId: token.osuId as number } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const participant = await prisma.tournamentParticipant.findFirst({
    where: { tournamentId: params.id, userId: user.id, status: 'ACCEPTED' },
  });
  if (!participant) return NextResponse.json({ error: 'Not an accepted participant' }, { status: 403 });

  await prisma.tournament.update({
    where: { id: params.id },
    data: { status: 'IN_PROGRESS' },
  });

  return NextResponse.json({ ok: true });
}
