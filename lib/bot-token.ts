import { prisma } from './prisma';

const TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

export async function getBotToken(): Promise<string | null> {
  const record = await prisma.botToken.findUnique({ where: { id: 'singleton' } });
  if (!record) return null;

  // Refresh if expiring within 5 minutes
  if (record.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    return refreshBotToken(record.refreshToken);
  }

  return record.accessToken;
}

export async function refreshBotToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OSU_CLIENT_ID,
      client_secret: process.env.OSU_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const expiresAt = new Date(Date.now() + (data.expires_in - 300) * 1000);

  await prisma.botToken.upsert({
    where: { id: 'singleton' },
    update: { accessToken: data.access_token, refreshToken: data.refresh_token ?? refreshToken, expiresAt },
    create: { id: 'singleton', accessToken: data.access_token, refreshToken: data.refresh_token ?? refreshToken, expiresAt },
  });

  return data.access_token;
}

export async function storeBotToken(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000);
  await prisma.botToken.upsert({
    where: { id: 'singleton' },
    update: { accessToken, refreshToken, expiresAt },
    create: { id: 'singleton', accessToken, refreshToken, expiresAt },
  });
}
