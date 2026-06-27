import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchUsersBatch, fetchFriends, fetchActiveRooms } from '@/lib/osu-api';
import { starRange } from '@/lib/stars';
import { getAccessToken } from '@/lib/auth-server';
import { ProcessedRoom } from '@/components/LiveLobbyCard';
import LiveTournaments from './LiveTournaments';
import StreamsSection from './StreamsSection';
import DiscoverClient from './DiscoverClient';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);

  let userPp: number | null = null;
  let modePp = { osu: null as number|null, taiko: null as number|null, fruits: null as number|null, mania: null as number|null };
  if (session?.user?.osuId) {
    const dbUser = await prisma.user.findFirst({
      where: { osuId: session.user.osuId },
      select: { pp: true, taikoPp: true, catchPp: true, maniaPp: true },
    });
    userPp = dbUser?.pp ?? null;
    modePp = {
      osu:    dbUser?.pp      ?? null,
      taiko:  dbUser?.taikoPp ?? null,
      fruits: dbUser?.catchPp ?? null,
      mania:  dbUser?.maniaPp ?? null,
    };
  }

  // Fetch all registered users + all rooms in parallel
  const [users, rawRooms] = await Promise.all([
    prisma.user.findMany({
      where: {
        isRegistered: true,
        ...(session?.user?.osuId ? { NOT: { osuId: session.user.osuId } } : {}),
      },
      orderBy: { lastSeen: 'desc' },
      take: 500,
    }),
    fetchActiveRooms(200).catch(() => []),
  ]);

  // Collect all participant IDs for friend highlighting
  const allParticipantIds = new Set<number>();
  for (const room of rawRooms) {
    for (const p of (room.recent_participants ?? [])) {
      allParticipantIds.add(p.id as number);
    }
  }

  // Fetch osu! friends, live status, and DB participants in parallel
  const [friendsList, dbParticipants, ...batchResults] = await Promise.all([
    session?.user?.osuId
      ? getAccessToken().then(t => t ? fetchFriends(t).catch(() => []) : [])
      : Promise.resolve([]),
    allParticipantIds.size > 0
      ? prisma.user.findMany({
          where: { osuId: { in: Array.from(allParticipantIds) }, isRegistered: true },
          select: { osuId: true },
        })
      : Promise.resolve([]),
    ...Array.from({ length: Math.ceil(users.length / 50) }, (_, i) =>
      fetchUsersBatch(users.map(u => u.osuId).slice(i * 50, (i + 1) * 50)).catch(() => [])
    ),
  ]);

  const friendIds = (friendsList as { id: number }[]).map(f => f.id);
  const osufriendIds = new Set((dbParticipants as { osuId: number }[]).map(u => u.osuId));

  const liveMap = new Map<number, { isOnline: boolean; lastSeen: Date | null }>();
  for (const batch of batchResults) {
    for (const u of batch as { id: number; is_online: boolean; last_visit: string | null }[]) {
      liveMap.set(u.id, {
        isOnline: u.is_online ?? false,
        lastSeen: u.last_visit ? new Date(u.last_visit) : null,
      });
    }
  }

  // Process all rooms into a serializable shape for the client
  const allRooms: ProcessedRoom[] = rawRooms.flatMap((room: any) => {
    const beatmap = room.current_playlist_item?.beatmap;
    const beatmapset = beatmap?.beatmapset;
    const stars = (beatmap?.difficulty_rating as number | null) ?? null;
    const mode = (beatmap?.mode as string | null) ?? 'osu';
    if (stars == null) return [];

    const participants: any[] = room.recent_participants ?? [];
    const host = room.host
      ? { id: room.host.id as number, username: room.host.username as string }
      : null;

    return [{
      id: room.id as number,
      name: room.name as string,
      mode,
      participantCount: (room.participant_count as number) ?? participants.length,
      host,
      recentParticipants: participants.map((p: any) => ({
        id: p.id as number,
        username: p.username as string,
        avatarUrl: (p.avatar_url as string) ?? '',
        isOsufriend: osufriendIds.has(p.id as number),
      })),
      currentBeatmap: beatmapset ? {
        title: beatmapset.title as string,
        artist: beatmapset.artist as string,
        version: beatmap.version as string,
        stars,
        coverUrl: (beatmapset.covers?.cover ?? beatmapset.covers?.['cover@2x'] ?? '') as string,
      } : null,
      hostAvgPp: null,
      starDiff: 0,
    }];
  });

  // Merge live status and sort: online first, then by lastSeen
  const displayUsers = users
    .map(u => {
      const live = liveMap.get(u.osuId);
      return live ? { ...u, isOnline: live.isOnline, lastSeen: live.lastSeen ?? u.lastSeen } : u;
    })
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0);
    });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Discover</h1>

      <Suspense fallback={null}>
        <StreamsSection />
      </Suspense>
      <DiscoverClient
        users={displayUsers}
        userPp={userPp}
        modePp={modePp}
        friendIds={friendIds}
        allRooms={allRooms}
        lobbyExtras={
          <Suspense fallback={null}><LiveTournaments /></Suspense>
        }
        canSendDm={!!session?.user?.osuId}
        defaultStarRange={starRange(userPp ?? 0)}
      />
    </main>
  );
}
