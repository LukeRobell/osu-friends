import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.osuId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { languages } = await req.json();
  if (!Array.isArray(languages)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await prisma.user.update({
    where: { osuId: token.osuId as number },
    data: { languages: languages.filter((l: unknown) => typeof l === 'string').slice(0, 10) },
  });

  return NextResponse.json({ ok: true });
}
