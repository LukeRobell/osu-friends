import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SyncButton from '@/components/SyncButton';
import TournamentOptIn from '@/components/TournamentOptIn';
import TeamBadge from '@/components/TeamBadge';
import RivalButton from '@/components/RivalButton';
import OsuFriends from './OsuFriends';
import RivalSection from './RivalSection';
import { countryFlagUrl } from '@/lib/osu-api';

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
  const isLoggedIn = !!session?.user;

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
          <div className="flex items-start gap-6 mb-8">
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={96}
              height={96}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={countryFlagUrl(user.countryCode)} alt={user.countryCode} width={20} height={14} className="rounded-sm" />
                  <span className="text-gray-400 text-sm">{user.countryCode}</span>
                </div>
                {user.teamId && user.teamTag && user.teamName && (
                  <TeamBadge
                    teamId={user.teamId}
                    teamTag={user.teamTag}
                    teamName={user.teamName}
                    teamFlagUrl={user.teamFlagUrl ?? null}
                  />
                )}
              </div>
              {!isOwnProfile && isLoggedIn && (
                <div className="mt-3">
                  <RivalButton targetOsuId={user.osuId} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Global Rank</p>
              <p className="text-2xl font-bold text-pink-400">
                {user.globalRank != null ? `#${user.globalRank.toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Country Rank</p>
              <div className="flex items-center gap-2 mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={countryFlagUrl(user.countryCode)} alt={user.countryCode} width={24} height={17} className="rounded-sm flex-shrink-0" />
                <p className="text-2xl font-bold text-purple-400">
                  {user.countryRank != null ? `#${user.countryRank.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Average Play</p>
              <p className="text-2xl font-bold text-white">
                {user.pp != null ? `${Math.round(user.pp).toLocaleString()}pp` : '—'}
              </p>
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
                <RivalSection userId={user.id} />
              </Suspense>
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
