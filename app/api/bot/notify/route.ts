import { NextRequest, NextResponse } from 'next/server';
import { getBotToken } from '@/lib/bot-token';

async function sendDm(targetOsuId: number, message: string, botToken: string) {
  const res = await fetch('https://osu.ppy.sh/api/v2/chat/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_id: targetOsuId, message, is_action: false }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const botToken = await getBotToken();
  if (!botToken) return NextResponse.json({ error: 'Bot not configured' }, { status: 503 });

  const { osuId, message } = await req.json();
  if (!osuId || !message) return NextResponse.json({ error: 'Missing osuId or message' }, { status: 400 });

  const ok = await sendDm(osuId, message, botToken);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'osu! API error' }, { status: 502 });
}
