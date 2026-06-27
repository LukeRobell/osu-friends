import { prisma } from '@/lib/prisma';
import { fetchActiveRooms, fetchUserAvgTopPp, ppToStars } from '@/lib/osu-api';
import LiveLobbyCard, { ProcessedRoom } from '@/components/LiveLobbyCard';

interface Props {
  userPp: number | null;
  userOsuId: number | null;
  mode: string | null;
}

export default async function LiveLobbies({ userPp, userOsuId, mode }: Props) {
  const rooms = await fetchActiveRooms(50).catch(() => []);
  if (rooms.length === 0) return null;

  // When a mode filter is active, fetch the user's avg top-play pp in that mode
  let effectivePp = userPp;
  if (mode && userOsuId) {
    const modePp = await fetchUserAvgTopPp(userOsuId, mode, 300).catch(() => null);
    if (modePp != null) effectivePp = modePp;
  }

  const targetStars = ppToStars(effectivePp ?? 0);

  // Filter by game mode first
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

  // Fetch each host's avg top-play pp in parallel — same metric as user.pp, apples-to-apples.
  // 5-min cache: host skill doesn't change meaningfully within a session.
  const activeMode = mode ?? 'osu';
  const hostPpMap = new Map<number, number | null>();
  await Promise.all(
    starFiltered.map(async room => {
      const hostId = room.host?.id as number | undefined;
      if (hostId == null) return;
      const pp = await fetchUserAvgTopPp(hostId, activeMode, 300).catch(() => null);
      hostPpMap.set(hostId, pp);
    })
  );

  // Build processed rooms
  const processed: ProcessedRoom[] = starFiltered.map(room => {
    const beatmap = room.current_playlist_item?.beatmap;
    const beatmapset = beatmap?.beatmapset;
    const stars = (beatmap?.difficulty_rating as number | null) ?? null;
    const starDiff = stars != null ? Math.abs(stars - targetStars) : Infinity;

    const participants: any[] = room.recent_participants ?? [];
    const hostId = room.host?.id as number | undefined;
    const hostAvgPp = hostId != null ? (hostPpMap.get(hostId) ?? null) : null;

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
      hostAvgPp,
      starDiff,
    };
  });

  // Sort: hosts within ±15% of user's avg pp bubble to the top (same window as discover/tournaments).
  // Within each bucket, sort by pp proximity then star proximity then player count.
  const ppLo = effectivePp != null ? effectivePp * 0.85 : null;
  const ppHi = effectivePp != null ? effectivePp * 1.15 : null;

  processed.sort((a, b) => {
    const aIn = ppLo != null && a.hostAvgPp != null && a.hostAvgPp >= ppLo && a.hostAvgPp <= ppHi!;
    const bIn = ppLo != null && b.hostAvgPp != null && b.hostAvgPp >= ppLo && b.hostAvgPp <= ppHi!;
    if (aIn !== bIn) return aIn ? -1 : 1;

    if (effectivePp != null) {
      const aDiff = a.hostAvgPp != null ? Math.abs(a.hostAvgPp - effectivePp) : Infinity;
      const bDiff = b.hostAvgPp != null ? Math.abs(b.hostAvgPp - effectivePp) : Infinity;
      if (Math.abs(aDiff - bDiff) > 1) return aDiff - bDiff;
    }
    if (Math.abs(a.starDiff - b.starDiff) > 0.05) return a.starDiff - b.starDiff;
    return (b.participantCount ?? 0) - (a.participantCount ?? 0);
  });

  const display = processed.slice(0, 9);

  return (
    <div className="mb-10" data-star-range={`${(targetStars - 1.0).toFixed(1)}–${(targetStars + 1.0).toFixed(1)}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {display.map(room => (
          <LiveLobbyCard key={room.id} room={room} canSendDm={userOsuId != null} />
        ))}
      </div>
    </div>
  );
}
