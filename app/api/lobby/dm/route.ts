import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBotToken } from '@/lib/bot-token';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { targetId, roomName, variant } = body ?? {};
  if (!targetId || !roomName) {
    return NextResponse.json({ error: 'Missing targetId or roomName' }, { status: 400 });
  }

  const senderUsername = token.username as string;
  const senderOsuId = token.osuId as number;

  const message = variant === 'friend'
    ? `Hey! ${senderUsername} from osu!friends wants to join you in "${roomName}"!\nInvite them: /invite ${senderUsername}\nProfile: https://osu.ppy.sh/users/${senderOsuId}`
    : `${senderUsername} from osu!friends wants to join your lobby "${roomName}"!\nInvite them: /invite ${senderUsername}\nProfile: https://osu.ppy.sh/users/${senderOsuId}`;

  const botToken = await getBotToken();
  if (!botToken) {
    return NextResponse.json({ error: 'bot_unavailable' }, { status: 503 });
  }

  const res = await fetch('https://osu.ppy.sh/api/v2/chat/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_id: targetId, message, is_action: false }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'dm_failed', fallback: true }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
