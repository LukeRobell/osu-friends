import { prisma } from '@/lib/prisma';
import { fetchActiveRooms, fetchUserAvgTopPp, fetchUserProfile, fetchParticipantAccountPp, ppToStars } from '@/lib/osu-api';
import LiveLobbyCard, { ProcessedRoom } from '@/components/LiveLobbyCard';

interface Props {
  userPp: number | null;
  userOsuId: number | null;
  mode: string | null;
}

export default async function LiveLobbies({ userPp, userOsuId, mode }: Props) {
  const rooms = await fetchActiveRooms(50).catch(() => []);
  if (rooms.length === 0) return null;

  // When a mode filter is active, fetch the user's top-play pp in that mode so the
  // star target reflects their skill in the selected mode, not their primary mode.
  let effectivePp = userPp;
  if (mode && userOsuId) {
    const modePp = await fetchUserAvgTopPp(userOsuId, mode, 300).catch(() => null);
    if (modePp != null) effectivePp = modePp;
  }

  const targetStars = ppToStars(effectivePp ?? 0);

  // Fetch the signed-in user's account pp — needed to compare against participant account pp.
  // Account pp (weighted total) and avg-top-5 pp are different metrics, so we can only do
  // apples-to-apples comparison using account pp from both sides.
  let userAccountPp: number | null = null;
  if (userOsuId) {
    const activeMode = mode ?? 'osu';
    const profile = await fetchUserProfile(userOsuId, activeMode, 300).catch(() => null);
    userAccountPp = profile?.accountPp ?? null;
  }

  // Filter by game mode first so participant lookup only covers relevant rooms
  const modeFiltered = mode
    ? rooms.filter(room => room.current_playlist_item?.beatmap?.mode === mode)
    : rooms;

  // Collect participant osuIds for osufriends highlighting
  const allParticipantIds = new Set<number>();
  for (const room of modeFiltered) {
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

  const starFiltered = modeFiltered.filter(room => {
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

  // Skill filter: require at least 2 participants with known pp to be within 0.5×–2.0× of the
  // user's account pp. This catches lobbies where high-ranked players are farming easy maps —
  // the star filter passes them but the participants would be way out of range.
  // Fail open: if fewer than 2 participants have known pp data, don't exclude the room.
  const skillFiltered = userAccountPp != null
    ? processed.filter(room => {
        const knownPps = room.recentParticipants
          .map(p => participantPpMap.get(p.id) ?? null)
          .filter((v): v is number => v != null);
        if (knownPps.length < 2) return true;
        const lo = userAccountPp * 0.5;
        const hi = userAccountPp * 2.0;
        return knownPps.filter(pp => pp >= lo && pp <= hi).length >= 2;
      })
    : processed;

  // Sort: account pp proximity first (when both user and participants have data), else star proximity
  const hasPpData = userAccountPp != null && skillFiltered.some(r => r.avgAccountPp != null);

  skillFiltered.sort((a, b) => {
    if (hasPpData && userAccountPp != null) {
      const aDiff = a.avgAccountPp != null ? Math.abs(a.avgAccountPp - userAccountPp) : Infinity;
      const bDiff = b.avgAccountPp != null ? Math.abs(b.avgAccountPp - userAccountPp) : Infinity;
      if (Math.abs(aDiff - bDiff) > 1) return aDiff - bDiff;
    }
    // Tie-break (or primary sort if no pp data) by star proximity then player count
    if (Math.abs(a.starDiff - b.starDiff) > 0.05) return a.starDiff - b.starDiff;
    return (b.participantCount ?? 0) - (a.participantCount ?? 0);
  });

  const display = skillFiltered.slice(0, 9);

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
