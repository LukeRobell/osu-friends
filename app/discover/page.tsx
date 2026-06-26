import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchUsersBatch, fetchFriends } from '@/lib/osu-api';
import { getAccessToken } from '@/lib/auth-server';
import LiveTournaments from './LiveTournaments';
import LiveLobbies from './LiveLobbies';
import DiscoverClient from './DiscoverClient';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);

  let userPp: number | null = null;
  if (session?.user?.osuId) {
    const dbUser = await prisma.user.findFirst({
      where: { osuId: session.user.osuId },
      select: { pp: true },
    });
    userPp = dbUser?.pp ?? null;
  }

  // Fetch all registered users (excluding self) — filtering happens client-side
  const users = await prisma.user.findMany({
    where: {
      isRegistered: true,
      ...(session?.user?.osuId ? { NOT: { osuId: session.user.osuId } } : {}),
    },
    orderBy: { lastSeen: 'desc' },
    take: 500,
  });

  // Fetch osu! friends and live status in parallel (once, on page load)
  const [friendsList, ...batchResults] = await Promise.all([
    session?.user?.osuId
      ? getAccessToken().then(t => t ? fetchFriends(t).catch(() => []) : [])
      : Promise.resolve([]),
    ...Array.from({ length: Math.ceil(users.length / 50) }, (_, i) =>
      fetchUsersBatch(users.map(u => u.osuId).slice(i * 50, (i + 1) * 50)).catch(() => [])
    ),
  ]);

  const friendIds = (friendsList as { id: number }[]).map(f => f.id);

  const liveMap = new Map<number, { isOnline: boolean; lastSeen: Date | null }>();
  for (const batch of batchResults) {
    for (const u of batch as { id: number; is_online: boolean; last_visit: string | null }[]) {
      liveMap.set(u.id, {
        isOnline: u.is_online ?? false,
        lastSeen: u.last_visit ? new Date(u.last_visit) : null,
      });
    }
  }

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

      {/* Filters at top, lobbies slotted in below filters, user grid at bottom */}
      <DiscoverClient
        users={displayUsers}
        userPp={userPp}
        friendIds={friendIds}
        lobbies={
          <>
            <Suspense fallback={null}><LiveTournaments /></Suspense>
            <Suspense fallback={null}>
              <LiveLobbies userPp={userPp} userOsuId={session?.user?.osuId ?? null} mode={null} />
            </Suspense>
          </>
        }
      />
    </main>
  );
}
