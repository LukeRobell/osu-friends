import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { targetId, roomName, variant } = body ?? {};
  if (!targetId || !roomName) {
    return NextResponse.json({ error: 'Missing targetId or roomName' }, { status: 400 });
  }

  const message = variant === 'friend'
    ? `Hey! I see you're in "${roomName}" on osu!friends — mind if I hop in?`
    : `Hey! I found your lobby "${roomName}" on osu!friends — mind if I join?`;

  const res = await fetch('https://osu.ppy.sh/api/v2/chat/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_id: targetId, message, is_action: false }),
  });

  if (res.status === 401) {
    return NextResponse.json({ error: 'osu! token expired — please sign out and back in' }, { status: 401 });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json({ error: `osu! API error: ${res.status}`, detail: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
