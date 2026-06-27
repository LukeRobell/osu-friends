import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBotToken } from '@/lib/bot-token';
import { prisma } from '@/lib/prisma';

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

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
  const { targetId, targetUsername, roomName, roomId, isPrivate, variant } = body ?? {};
  if (!targetId || !roomName) {
    return NextResponse.json({ error: 'Missing targetId or roomName' }, { status: 400 });
  }

  const senderOsuId  = token.osuId as number;
  const senderUsername = token.username as string;

  // Enforce cooldown — one DM per host per 10 minutes
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

  const botToken = await getBotToken();
  if (!botToken) {
    return NextResponse.json({ error: 'bot_unavailable' }, { status: 503 });
  }

  // Message to the HOST — no /invite (doesn't work in lazer), just a profile link to click
  const hostMessage = variant === 'friend'
    ? `Hey! ${senderUsername} from osufriends.com wants to join you in "${roomName}"!\nOpen their profile to message them an invite: https://osu.ppy.sh/users/${senderOsuId}`
    : `${senderUsername} from osufriends.com wants to join your lobby "${roomName}"!\nOpen their profile to message them an invite: https://osu.ppy.sh/users/${senderOsuId}`;

  const hostOk = await sendBotDm(botToken, targetId, hostMessage);
  if (!hostOk) {
    return NextResponse.json({ error: 'dm_failed', fallback: true }, { status: 502 });
  }

  // Record the send so the cooldown persists across refreshes
  await prisma.lobbyDm.create({ data: { senderOsuId, targetOsuId: targetId } });

  // Message to the REQUESTER — confirmation + host profile + room link if public
  const hostName = targetUsername ?? 'the host';
  let requesterMessage =
    `[osufriends.com] Your join request was sent to ${hostName}! They may reach out soon.\n` +
    `You can also message them first: https://osu.ppy.sh/users/${targetId}`;

  if (!isPrivate && roomId) {
    requesterMessage += `\nOr join their lobby directly: https://osu.ppy.sh/multiplayer/rooms/${roomId}`;
  }

  // Fire-and-forget — don't fail the request if this DM doesn't go through
  sendBotDm(botToken, senderOsuId, requesterMessage).catch(() => {});

  return NextResponse.json({ ok: true, secondsRemaining: Math.ceil(COOLDOWN_MS / 1000) });
}
