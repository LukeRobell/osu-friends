import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const base = process.env.NEXTAUTH_URL!;

  if (!session?.user?.osuId || !session?.user?.username) {
    return NextResponse.redirect(new URL('/', base));
  }

  const profileUrl = `${base}/profile/${session.user.username}`;
  const { searchParams } = new URL(req.url);
  const code        = searchParams.get('code');
  const state       = searchParams.get('state');
  const storedState = req.cookies.get('twitch_oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${profileUrl}?error=twitch`);
  }

  // Exchange code for user access token
  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  `${base}/api/auth/twitch/callback`,
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(`${profileUrl}?error=twitch`);
  const { access_token } = await tokenRes.json();

  // Fetch Twitch user identity
  const userRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Client-ID':   process.env.TWITCH_CLIENT_ID!,
    },
  });
  if (!userRes.ok) return NextResponse.redirect(`${profileUrl}?error=twitch`);
  const { data } = await userRes.json();
  const twitchUsername = (data?.[0]?.login as string) ?? null;

  if (!twitchUsername) return NextResponse.redirect(`${profileUrl}?error=twitch`);

  await prisma.user.update({
    where: { osuId: session.user.osuId },
    data:  { twitchUsername },
  });

  const res = NextResponse.redirect(`${profileUrl}?linked=twitch`);
  res.cookies.delete('twitch_oauth_state');
  return res;
}
