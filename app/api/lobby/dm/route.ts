import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Use the server-side bot token — chat.write is restricted to the app owner's account.
  // OSU_BOT_ACCESS_TOKEN is Luke's OAuth access token stored in Vercel env vars.
  const botToken = process.env.OSU_BOT_ACCESS_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'DM service not configured' }, { status: 503 });
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

  if (res.status === 401) {
    return NextResponse.json({ error: 'Bot token expired — contact admin' }, { status: 401 });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json({ error: `osu! API error: ${res.status}`, detail: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
