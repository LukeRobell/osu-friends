import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

async function getTwitchAppToken(): Promise<string | null> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type:    'client_credentials',
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.access_token ?? null;
}

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId');
  if (!channelId) {
    return NextResponse.json({ error: 'missing_channel_id' }, { status: 400, headers: CORS });
  }

  const token = await getTwitchAppToken();
  if (!token) {
    return NextResponse.json({ error: 'twitch_auth_failed' }, { status: 503, headers: CORS });
  }

  const helix = await fetch(`https://api.twitch.tv/helix/users?id=${channelId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Client-ID': process.env.TWITCH_CLIENT_ID! },
  });
  if (!helix.ok) {
    return NextResponse.json({ error: 'twitch_lookup_failed' }, { status: 503, headers: CORS });
  }

  const { data } = await helix.json();
  const twitchLogin = (data?.[0]?.login as string | undefined)?.toLowerCase();
  if (!twitchLogin) {
    return NextResponse.json({ error: 'channel_not_found' }, { status: 404, headers: CORS });
  }

  const user = await prisma.user.findFirst({
    where: { twitchUsername: { equals: twitchLogin, mode: 'insensitive' } },
    select: { username: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'not_linked' }, { status: 404, headers: CORS });
  }

  return NextResponse.json({ username: user.username }, { headers: CORS });
}
