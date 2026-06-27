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
  const storedState = req.cookies.get('discord_oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${profileUrl}?error=discord`);
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  `${base}/api/auth/discord/callback`,
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(`${profileUrl}?error=discord`);
  const { access_token } = await tokenRes.json();

  // Fetch Discord user identity
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return NextResponse.redirect(`${profileUrl}?error=discord`);
  const u = await userRes.json();

  // New Discord dropped discriminators (shows "0") — use just the username in that case
  const discordUsername = u.discriminator && u.discriminator !== '0'
    ? `${u.username}#${u.discriminator}`
    : (u.username as string);

  await prisma.user.update({
    where: { osuId: session.user.osuId },
    data:  { discordUsername },
  });

  const res = NextResponse.redirect(`${profileUrl}?linked=discord`);
  res.cookies.delete('discord_oauth_state');
  return res;
}
