import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchUsersBatch, fetchFriends } from '@/lib/osu-api';
import { getAccessToken } from '@/lib/auth-server';
import UserCard from '@/components/UserCard';
import DiscoverFilters from './DiscoverFilters';
import LiveLobbies from './LiveLobbies';

interface Props {
  searchParams: { mode?: string };
}

export default async function DiscoverPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const mode = searchParams.mode;

  let userPp: number | null = null;
  if (session?.user?.osuId) {
    const dbUser = await prisma.user.findFirst({
      where: { osuId: session.user.osuId },
      select: { pp: true },
    });
    userPp = dbUser?.pp ?? null;
  }

  const ppWindow = userPp != null ? Math.max(20, Math.round(userPp * 0.15)) : null;
  const ppMin = userPp != null ? userPp - ppWindow! : null;
  const ppMax = userPp != null ? userPp + ppWindow! : null;

  const users = await prisma.user.findMany({
    where: {
      isRegistered: true,
      ...(session?.user?.osuId ? { NOT: { osuId: session.user.osuId } } : {}),
      ...(mode ? { preferredModes: { has: mode } } : {}),
      ...(ppMin != null && ppMax != null ? { pp: { gte: ppMin, lte: ppMax } } : {}),
    },
    orderBy: { lastSeen: 'desc' },
    take: 200,
  });

  // Fetch osu! friends and live status in parallel
  const [friendsList, ...batchResults] = await Promise.all([
    session?.user?.osuId
      ? getAccessToken().then(t => t ? fetchFriends(t).catch(() => []) : [])
      : Promise.resolve([]),
    ...Array.from({ length: Math.ceil(users.length / 50) }, (_, i) =>
      fetchUsersBatch(users.map(u => u.osuId).slice(i * 50, (i + 1) * 50)).catch(() => [])
    ),
  ]);

  const friendIds = new Set((friendsList as { id: number }[]).map(f => f.id));

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
      <p className="text-gray-400 mb-8">
        osu!friends members near your skill level
        {displayUsers.length > 0 && (
          <span className="ml-2 text-gray-500 text-sm">— {displayUsers.length} players</span>
        )}
      </p>

      <Suspense>
        <DiscoverFilters />
      </Suspense>

      {/* Live lobbies stream in independently so they don't delay the player grid */}
      <Suspense fallback={null}>
        <LiveLobbies userPp={userPp} userOsuId={session?.user?.osuId ?? null} mode={mode ?? null} />
      </Suspense>

      {displayUsers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No players found at your skill level yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            {userPp == null
              ? 'Sign in with osu! to find players near your level.'
              : 'Share osu!friends with players at your level to grow the community here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayUsers.map((user) => (
            <UserCard key={user.id} user={user} isOsuFriend={friendIds.has(user.osuId)} />
          ))}
        </div>
      )}
    </main>
  );
}
