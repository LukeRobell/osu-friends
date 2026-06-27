import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export async function GET() {
  const members = await prisma.user.findMany({
    where: { isRegistered: true },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { username: true, avatarUrl: true, countryCode: true, createdAt: true },
  });

  return NextResponse.json(members.map(m => ({
    username: m.username,
    avatarUrl: m.avatarUrl,
    countryCode: m.countryCode,
    createdAt: m.createdAt.toISOString(),
  })));
}
