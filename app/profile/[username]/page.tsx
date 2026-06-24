import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SyncButton from '@/components/SyncButton';
import TournamentOptIn from '@/components/TournamentOptIn';
import OsuFriends from './OsuFriends';

interface Props {
  params: { username: string };
}

export default async function ProfilePage({ params }: Props) {
  const [user, session] = await Promise.all([
    prisma.user.findFirst({
      where: { username: { equals: params.username, mode: 'insensitive' } },
    }),
    getServerSession(authOptions),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.user?.osuId === user.osuId;

  const modeLabels: Record<string, string> = {
    osu: 'osu!',
    taiko: 'Taiko',
    fruits: 'Catch',
    mania: 'Mania',
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/discover" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← back
          </Link>
          <div className="flex items-center gap-2">
            {isOwnProfile && <SyncButton />}
            <a
              href={`https://osu.ppy.sh/users/${user.osuId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm font-medium transition-colors"
            >
              View osu! profile ↗
            </a>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={96}
              height={96}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-400">{user.countryCode}</p>
                {user.teamTag && (
                  <a
                    href={`https://osu.ppy.sh/teams/${user.teamId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={user.teamName ?? undefined}
                    className="flex items-center gap-1.5 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/30 transition-colors"
                  >
                    {user.teamAvatarUrl && (
                      <Image
                        src={user.teamAvatarUrl}
                        alt={user.teamTag}
                        width={14}
                        height={14}
                        className="rounded-sm"
                      />
                    )}
                    [{user.teamTag}]
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className={`grid gap-4 mb-8 ${user.globalRank != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {user.globalRank != null && (
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Global Rank</p>
                <p className="text-2xl font-bold text-pink-400">
                  #{user.globalRank.toLocaleString()}
                </p>
              </div>
            )}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Average play</p>
              <p className="text-2xl font-bold text-purple-400">
                {user.pp != null ? `${Math.round(user.pp).toLocaleString()}pp` : '—'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Country</p>
              <p className="text-2xl font-bold">{user.countryCode}</p>
            </div>
          </div>

          {user.preferredModes.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Preferred Modes</p>
              <div className="flex gap-2 flex-wrap">
                {user.preferredModes.map((mode: string) => (
                  <span
                    key={mode}
                    className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm font-medium"
                  >
                    {modeLabels[mode] ?? mode}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <>
              <TournamentOptIn initialValue={user.tournamentOptIn} />
              <Suspense fallback={null}>
                <OsuFriends />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
