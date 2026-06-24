import { getBotToken } from './bot-token';

export async function sendBotDm(targetOsuId: number, message: string): Promise<boolean> {
  const botToken = await getBotToken();
  if (!botToken) return false;

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
