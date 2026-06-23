import { prisma } from '@/lib/prisma';
import { fetchActiveRooms, fetchUserProfile, fetchParticipantAccountPp, ppToStars } from '@/lib/osu-api';
import LiveLobbyCard, { ProcessedRoom } from '@/components/LiveLobbyCard';

interface Props {
  userPp: number | null;
  userOsuId: number | null;
}

export default async function LiveLobbies({ userPp, userOsuId }: Props) {
  const rooms = await fetchActiveRooms(50).catch(() => []);
  if (rooms.length === 0) return null;

  const targetStars = ppToStars(userPp ?? 0);

  // Fetch the signed-in user's account pp — needed to compare against participant account pp.
  // Account pp (weighted total) and avg-top-5 pp are different metrics, so we can only do
  // apples-to-apples comparison using account pp from both sides.
  let userAccountPp: number | null = null;
  if (userOsuId) {
    const profile = await fetchUserProfile(userOsuId, 'osu', 300).catch(() => null);
    userAccountPp = profile?.accountPp ?? null;
  }

  // Collect every participant osuId across all rooms for osufriends highlighting
  const allParticipantIds = new Set<number>();
  for (const room of rooms) {
    for (const p of (room.recent_participants ?? [])) {
      allParticipantIds.add(p.id as number);
    }
  }

  const dbUsers = allParticipantIds.size > 0
    ? await prisma.user.findMany({
        where: { osuId: { in: Array.from(allParticipantIds) }, isRegistered: true },
        select: { osuId: true },
      })
    : [];
  const friendIds = new Set(dbUsers.map(u => u.osuId));

  // Star-filter rooms — keep ±1.0★ from user's target; skip rooms with no map selected
  const starFiltered = rooms.filter(room => {
    const stars = room.current_playlist_item?.beatmap?.difficulty_rating as number | null ?? null;
    if (stars == null) return false;
    return Math.abs(stars - targetStars) <= 1.0;
  });

  if (starFiltered.length === 0) return null;

  // Batch-fetch account pp for participants in the star-filtered rooms only
  const filteredParticipantIds = new Set<number>();
  for (const room of starFiltered) {
    for (const p of (room.recent_participants ?? [])) {
      filteredParticipantIds.add(p.id as number);
    }
  }
  const participantPpMap = await fetchParticipantAccountPp(Array.from(filteredParticipantIds)).catch(() => new Map<number, number | null>());

  // Build processed rooms
  const processed: ProcessedRoom[] = starFiltered.map(room => {
    const beatmap = room.current_playlist_item?.beatmap;
    const beatmapset = beatmap?.beatmapset;
    const stars = (beatmap?.difficulty_rating as number | null) ?? null;
    const starDiff = stars != null && targetStars != null ? Math.abs(stars - targetStars) : Infinity;

    const participants: any[] = room.recent_participants ?? [];

    // Compute avg account pp from participants where data is available
    const ppValues = participants
      .map((p: any) => participantPpMap.get(p.id as number) ?? null)
      .filter((v): v is number => v != null);
    const avgAccountPp = ppValues.length > 0
      ? ppValues.reduce((a, b) => a + b, 0) / ppValues.length
      : null;

    const host = room.host
      ? { id: room.host.id as number, username: room.host.username as string }
      : null;

    return {
      id: room.id as number,
      name: room.name as string,
      participantCount: (room.participant_count as number) ?? participants.length,
      host,
      recentParticipants: participants.map((p: any) => ({
        id: p.id as number,
        username: p.username as string,
        avatarUrl: (p.avatar_url as string) ?? '',
        isOsufriend: friendIds.has(p.id as number),
      })),
      currentBeatmap: beatmapset
        ? {
            title: beatmapset.title as string,
            artist: beatmapset.artist as string,
            version: beatmap.version as string,
            stars,
            coverUrl: (beatmapset.covers?.cover ?? beatmapset.covers?.['cover@2x'] ?? '') as string,
          }
        : null,
      avgAccountPp,
      starDiff,
    };
  });

  // Sort: account pp proximity first (when both user and participants have data), else star proximity
  const hasPpData = userAccountPp != null && processed.some(r => r.avgAccountPp != null);

  processed.sort((a, b) => {
    if (hasPpData && userAccountPp != null) {
      const aDiff = a.avgAccountPp != null ? Math.abs(a.avgAccountPp - userAccountPp) : Infinity;
      const bDiff = b.avgAccountPp != null ? Math.abs(b.avgAccountPp - userAccountPp) : Infinity;
      if (Math.abs(aDiff - bDiff) > 1) return aDiff - bDiff;
    }
    // Tie-break (or primary sort if no pp data) by star proximity then player count
    if (Math.abs(a.starDiff - b.starDiff) > 0.05) return a.starDiff - b.starDiff;
    return (b.participantCount ?? 0) - (a.participantCount ?? 0);
  });

  const display = processed.slice(0, 9);

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        Live lobbies
        <span className="text-sm font-normal text-gray-500">near {targetStars.toFixed(1)}★</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {display.map(room => (
          <LiveLobbyCard key={room.id} room={room} canSendDm={userOsuId != null} />
        ))}
      </div>
    </div>
  );
}
