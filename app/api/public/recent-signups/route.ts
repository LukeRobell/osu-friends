import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 15;

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        osuId:       true,
        username:    true,
        avatarUrl:   true,
        countryCode: true,
        pp:          true,
        globalRank:  true,
        createdAt:   true,
      },
    });
    return NextResponse.json(users, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
