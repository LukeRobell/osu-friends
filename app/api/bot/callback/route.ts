import { NextRequest, NextResponse } from 'next/server';
import { storeBotToken } from '@/lib/bot-token';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OSU_CLIENT_ID,
      client_secret: process.env.OSU_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/bot/callback`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Token exchange failed', detail: text }, { status: 502 });
  }

  const data = await res.json();
  await storeBotToken(data.access_token, data.refresh_token, data.expires_in);

  return NextResponse.json({ ok: true, message: 'Bot token stored. DM feature is active.' });
}
