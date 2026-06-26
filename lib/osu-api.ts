// Converts a 2-letter country code to osu!'s flag SVG URL.
// e.g. "US" → "https://osu.ppy.sh/assets/images/flags/1f1fa-1f1f8.svg"
export function countryFlagUrl(code: string): string {
  const pts = code.toUpperCase().split('').map(c => (c.charCodeAt(0) + 127397).toString(16));
  return `https://osu.ppy.sh/assets/images/flags/${pts.join('-')}.svg`;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getClientToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OSU_CLIENT_ID,
      client_secret: process.env.OSU_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'public',
    }),
  });
  if (!res.ok) throw new Error('Failed to get osu! client credentials token');
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000 };
  return cachedToken.token;
}

// Returns the average pp of a player's top 5 best plays — the skill metric stored in DB
export async function fetchUserAvgTopPp(osuId: number, mode: string, revalidate?: number): Promise<number | null> {
  const token = await getClientToken();
  const cacheOpt = revalidate != null
    ? { next: { revalidate } }
    : { cache: 'no-store' as const };
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/users/${osuId}/scores/best?mode=${mode}&limit=5`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, ...cacheOpt }
  );
  if (!res.ok) return null;
  const scores = await res.json();
  if (!Array.isArray(scores) || scores.length === 0) return null;
  const ppValues = scores.map((s: any) => s.pp as number).filter(Boolean);
  if (ppValues.length === 0) return null;
  return ppValues.reduce((a, b) => a + b, 0) / ppValues.length;
}

// Full profile for a single user.
// Pass revalidate (seconds) for cached contexts (e.g. LiveLobbies account pp lookup).
// Omit for contexts that need fresh data (sync button, sign-in).
export async function fetchUserProfile(osuId: number, mode = 'osu', revalidate?: number) {
  const token = await getClientToken();
  const cacheOpt = revalidate != null
    ? { next: { revalidate } }
    : { cache: 'no-store' as const };
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/users/${osuId}/${mode}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, ...cacheOpt }
  );
  if (!res.ok) return null;
  const u = await res.json();
  return {
    username: u.username as string,
    avatarUrl: u.avatar_url as string,
    countryCode: u.country_code as string,
    globalRank: (u.statistics?.global_rank ?? null) as number | null,
    countryRank: (u.statistics?.country_rank ?? null) as number | null,
    accountPp: (u.statistics?.pp ?? null) as number | null,
    isOnline: (u.is_online ?? false) as boolean,
    lastSeen: u.last_visit ? new Date(u.last_visit as string) : null,
    team: u.team
      ? {
          id: String(u.team.id),
          name: u.team.name as string,
          tag: u.team.short_name as string,
          avatarUrl: (u.team.avatar_url as string | null) ?? null,
        }
      : null,
  };
}

// Converts avg top-5 pp to an approximate star rating for lobby difficulty matching.
// Calibrated: ~30pp→2.8★  ~100pp→3.7★  ~200pp→4.3★  ~332pp→5.0★  ~500pp→5.7★
export function ppToStars(pp: number): number {
  if (pp < 100) return 2.5 + pp * 0.012;
  if (pp < 200) return 3.7 + (pp - 100) * 0.008;
  return 4.5 + (pp - 200) * 0.004;
}

// Active real-time multiplayer rooms — used for the Live Lobbies section in discover
export async function fetchActiveRooms(limit = 50): Promise<any[]> {
  const token = await getClientToken();
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/rooms?type_group=realtime&mode=active&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate: 30 }, // rooms change slowly; 30s cache avoids hammering the API
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.rooms ?? data.data ?? []);
}

// Batch-fetch account pp for a set of osu! user IDs — used to sort lobby rooms by skill proximity.
// Returns a map of osuId → account pp (null if statistics not returned by the API).
export async function fetchParticipantAccountPp(osuIds: number[]): Promise<Map<number, number | null>> {
  if (osuIds.length === 0) return new Map();
  const token = await getClientToken();
  const result = new Map<number, number | null>();

  for (let i = 0; i < osuIds.length; i += 50) {
    const batch = osuIds.slice(i, i + 50);
    const params = new URLSearchParams();
    batch.forEach(id => params.append('ids[]', String(id)));
    const res = await fetch(
      `https://osu.ppy.sh/api/v2/users?${params}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, next: { revalidate: 30 } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    const users: any[] = (Array.isArray(data) ? data : data.users) ?? [];
    for (const u of users) {
      const pp = u.statistics?.pp ?? u.statistics_rulesets?.osu?.pp ?? null;
      result.set(u.id as number, pp as number | null);
    }
  }

  return result;
}

// Fetch the authenticated user's osu! friends list using their OAuth token.
// Requires the friends.read scope.
export async function fetchFriends(accessToken: string): Promise<{ id: number; username: string; avatarUrl: string }[]> {
  const res = await fetch('https://osu.ppy.sh/api/v2/friends', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: u.id as number,
    username: u.username as string,
    avatarUrl: (u.avatar_url as string) ?? '',
  }));
}

// Batch lookup for up to 50 users — used in discover for live online status
export async function fetchUsersBatch(osuIds: number[]): Promise<{
  id: number;
  is_online: boolean;
  last_visit: string | null;
}[]> {
  if (osuIds.length === 0) return [];
  const token = await getClientToken();
  const params = new URLSearchParams();
  osuIds.forEach(id => params.append('ids[]', String(id)));
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/users?${params}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : data.users) ?? [];
}

export interface BestPlay {
  id: string;
  pp: number;
  title: string;
  version: string;
  beatmapId: number;
  beatmapsetId: number;
  createdAt: Date;
}

export async function fetchUserBestPlays(osuId: number, mode = 'osu', limit = 20, revalidate?: number): Promise<BestPlay[]> {
  const token = await getClientToken();
  const cacheOpt = revalidate != null ? { next: { revalidate } } : { cache: 'no-store' as const };
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/users/${osuId}/scores/best?mode=${mode}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, ...cacheOpt }
  );
  if (!res.ok) return [];
  const scores = await res.json();
  if (!Array.isArray(scores)) return [];
  return scores
    .filter((s: any) => s.pp != null)
    .map((s: any) => ({
      id: String(s.id),
      pp: s.pp as number,
      title: (s.beatmapset?.title ?? 'Unknown') as string,
      version: (s.beatmap?.version ?? '') as string,
      beatmapId: (s.beatmap?.id ?? 0) as number,
      beatmapsetId: (s.beatmap?.beatmapset_id ?? 0) as number,
      createdAt: new Date(s.created_at as string),
    }));
}

// Fetch a user's best score on a specific beatmap — used to detect snipes.
// Returns null if the user has no score on that map (404) or API error.
export async function fetchUserScoreOnBeatmap(osuUserId: number, beatmapId: string): Promise<{ pp: number } | null> {
  const token = await getClientToken();
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores/users/${osuUserId}?ruleset=osu`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const pp = data.score?.pp ?? null;
  return pp != null ? { pp } : null;
}

// Fetch the flag image URL for an osu! team.
// The flag URL is content-addressed and can't be guessed from the team ID alone.
export async function fetchTeamFlagUrl(teamId: string): Promise<string | null> {
  const token = await getClientToken();
  const res = await fetch(
    `https://osu.ppy.sh/api/v2/teams/${teamId}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const t = await res.json();
  return (t.flag_url ?? t.banner_url ?? t.logo_url ?? null) as string | null;
}
