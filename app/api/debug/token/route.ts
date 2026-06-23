import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// TEMPORARY — delete after copying OSU_BOT_ACCESS_TOKEN to Vercel env vars
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  return NextResponse.json({ accessToken: token.accessToken });
}
