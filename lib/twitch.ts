export interface LiveStream {
  userLogin: string;
  userName: string;
  title: string;
  viewerCount: number;
  gameName: string;
  thumbnailUrl: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST', cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { token: data.access_token as string, expiresAt: Date.now() + (data.expires_in as number - 300) * 1000 };
  return cachedToken.token;
}

export async function fetchLiveStreams(userLogins: string[]): Promise<LiveStream[]> {
  if (userLogins.length === 0) return [];
  const token = await getAppToken();
  if (!token) return [];

  const params = new URLSearchParams();
  userLogins.forEach(login => params.append('user_login', login));
  params.set('first', '20');

  const res = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID!,
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();

  return ((data.data ?? []) as Record<string, unknown>[]).map(s => ({
    userLogin: s.user_login as string,
    userName: s.user_name as string,
    title: s.title as string,
    viewerCount: s.viewer_count as number,
    gameName: s.game_name as string,
    thumbnailUrl: (s.thumbnail_url as string).replace('{width}', '440').replace('{height}', '248'),
  }));
}
