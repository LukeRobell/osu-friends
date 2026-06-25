import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBotToken } from '@/lib/bot-token';
import { prisma } from '@/lib/prisma';

const COOLDOWN_MS = 7 * 60 * 1000; // 7 minutes

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

  const senderOsuId = token.osuId as number;
  const senderUsername = token.username as string;

  // Enforce cooldown — one DM per host per 7 minutes
  const recent = await prisma.lobbyDm.findFirst({
    where: {
      senderOsuId,
      targetOsuId: targetId,
      sentAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
    },
    orderBy: { sentAt: 'desc' },
  });

  if (recent) {
    const secondsRemaining = Math.ceil((recent.sentAt.getTime() + COOLDOWN_MS - Date.now()) / 1000);
    return NextResponse.json({ error: 'cooldown', secondsRemaining }, { status: 429 });
  }

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

  // Record the send so the cooldown persists across refreshes
  await prisma.lobbyDm.create({ data: { senderOsuId, targetOsuId: targetId } });

  return NextResponse.json({ ok: true, secondsRemaining: Math.ceil(COOLDOWN_MS / 1000) });
}
