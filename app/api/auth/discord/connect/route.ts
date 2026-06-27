import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.osuId) {
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL!));
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`,
    response_type: 'code',
    scope:         'identify',
    state,
  });

  const res = NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
  res.cookies.set('discord_oauth_state', state, { httpOnly: true, maxAge: 300, path: '/' });
  return res;
}
