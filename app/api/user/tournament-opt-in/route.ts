import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.osuId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { optIn } = await req.json();
  await prisma.user.update({
    where: { osuId: token.osuId as number },
    data: { tournamentOptIn: Boolean(optIn) },
  });

  return NextResponse.json({ ok: true });
}
