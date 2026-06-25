import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

const COOLDOWN_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ onCooldown: false });
  }

  const targetId = Number(req.nextUrl.searchParams.get('targetId'));
  if (!targetId) {
    return NextResponse.json({ onCooldown: false });
  }

  const recent = await prisma.lobbyDm.findFirst({
    where: {
      senderOsuId: token.osuId as number,
      targetOsuId: targetId,
      sentAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
    },
    orderBy: { sentAt: 'desc' },
  });

  if (!recent) {
    return NextResponse.json({ onCooldown: false });
  }

  const secondsRemaining = Math.ceil((recent.sentAt.getTime() + COOLDOWN_MS - Date.now()) / 1000);
  return NextResponse.json({ onCooldown: true, secondsRemaining });
}
