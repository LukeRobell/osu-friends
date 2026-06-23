import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const ownerOsuId = process.env.OSU_OWNER_ID ? Number(process.env.OSU_OWNER_ID) : null;

  if (!token?.osuId || token.osuId !== ownerOsuId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = new URLSearchParams({
    client_id: process.env.OSU_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/bot/callback`,
    response_type: 'code',
    scope: 'chat.write',
  });

  return NextResponse.redirect(`https://osu.ppy.sh/oauth/authorize?${params}`);
}
