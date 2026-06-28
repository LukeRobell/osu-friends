import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBotToken } from '@/lib/bot-token';
import { prisma } from '@/lib/prisma';

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function sendBotDm(botToken: string, targetId: number, message: string): Promise<boolean> {
  const res = await fetch('https://osu.ppy.sh/api/v2/chat/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_id: targetId, message, is_action: false }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { targetId, targetUsername } = body ?? {};
  if (!targetId) {
    return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
  }

  const senderOsuId    = token.osuId as number;
  const senderUsername = token.username as string;

  const [recent, botToken] = await Promise.all([
    prisma.memberDm.findFirst({
      where: {
        senderOsuId,
        targetOsuId: targetId,
        sentAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
      },
      orderBy: { sentAt: 'desc' },
    }),
    getBotToken(),
  ]);

  if (recent) {
    const secondsRemaining = Math.ceil((recent.sentAt.getTime() + COOLDOWN_MS - Date.now()) / 1000);
    return NextResponse.json({ error: 'cooldown', secondsRemaining }, { status: 429 });
  }

  if (!botToken) {
    return NextResponse.json({ error: 'bot_unavailable' }, { status: 503 });
  }

  const name = targetUsername ?? 'there';
  const message =
    `Hey ${name}! ${senderUsername} from osufriends.com wants to be osu! friends!\n` +
    `Check out their profile: https://osu.ppy.sh/users/${senderOsuId}`;

  const ok = await sendBotDm(botToken, targetId, message);
  if (!ok) {
    return NextResponse.json({ error: 'dm_failed', fallback: true }, { status: 502 });
  }

  await prisma.memberDm.create({ data: { senderOsuId, targetOsuId: targetId } });

  return NextResponse.json({ ok: true, secondsRemaining: Math.ceil(COOLDOWN_MS / 1000) });
}
