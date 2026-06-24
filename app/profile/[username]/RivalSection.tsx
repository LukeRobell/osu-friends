import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fetchUserBestPlays, countryFlagUrl } from '@/lib/osu-api';
import RemoveRivalButton from './RemoveRivalButton';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / (86400 * 7))}w ago`;
}

export default async function RivalSection({ userId }: { userId: string }) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      rivalId: true,
      rival: {
        select: {
          id: true,
          osuId: true,
          username: true,
          avatarUrl: true,
          countryCode: true,
          globalRank: true,
          countryRank: true,
          pp: true,
          isOnline: true,
        },
      },
    },
  });

  // Show pending incoming requests even if no rival set yet
  const pendingRequest = !me?.rivalId
    ? await prisma.rivalRequest.findFirst({
        where: { toUserId: userId, status: 'PENDING' },
        include: { fromUser: { select: { osuId: true, username: true, avatarUrl: true, pp: true, globalRank: true } } },
      })
    : null;

  if (!me?.rival && !pendingRequest) return null;

  if (pendingRequest && !me?.rival) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-gray-400 text-sm mb-3">⚔️ Rival challenge</p>
        <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
          <Image src={pendingRequest.fromUser.avatarUrl} alt={pendingRequest.fromUser.username} width={48} height={48} className="rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{pendingRequest.fromUser.username}</p>
            <p className="text-sm text-gray-400">
              {pendingRequest.fromUser.globalRank != null && `#${pendingRequest.fromUser.globalRank.toLocaleString()} · `}
              {pendingRequest.fromUser.pp != null ? `${Math.round(pendingRequest.fromUser.pp)}pp` : '—'}
            </p>
            <p className="text-xs text-yellow-400 mt-0.5">wants to be your rival</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <form action={`/api/rival/request/${pendingRequest.id}/accept`} method="post">
              <button className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-xs font-medium transition-colors">Accept ⚔️</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const rival = me!.rival!;

  const allPlays = await fetchUserBestPlays(rival.osuId, 'osu', 50, 300).catch(() => []);
  const threshold = rival.pp != null ? rival.pp * 0.75 : 0;
  const significantPlays = allPlays
    .filter(p => p.pp >= threshold)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">⚔️ Your rival</p>
        <RemoveRivalButton />
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        {/* Rival header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <Image src={rival.avatarUrl} alt={rival.username} width={48} height={48} className="rounded-full" />
            {rival.isOnline && (
              <span className="absolute bottom-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-gray-800" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${encodeURIComponent(rival.username)}`} className="font-semibold hover:text-pink-400 transition-colors">
                {rival.username}
              </Link>
              {rival.isOnline
                ? <span className="text-xs text-green-400">Online now</span>
                : <span className="text-xs text-gray-500">Offline</span>
              }
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={countryFlagUrl(rival.countryCode)} alt={rival.countryCode} width={16} height={11} className="rounded-sm" />
              {rival.globalRank != null && <span>#{rival.globalRank.toLocaleString()}</span>}
              {rival.pp != null && <span>· {Math.round(rival.pp).toLocaleString()}pp avg</span>}
            </div>
          </div>
        </div>

        {/* Recent top plays */}
        {significantPlays.length > 0 ? (
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Recent top plays</p>
            <div className="flex flex-col gap-1.5">
              {significantPlays.map(play => (
                <a
                  key={play.id}
                  href={`https://osu.ppy.sh/beatmapsets/${play.beatmapsetId}#osu/${play.beatmapId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-900/60 hover:bg-gray-700/60 rounded-lg px-3 py-2 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate group-hover:text-pink-300 transition-colors">
                      {play.title}
                    </p>
                    <p className="text-xs text-gray-500">[{play.version}] · {timeAgo(play.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-pink-400 ml-3 flex-shrink-0">
                    {Math.round(play.pp)}pp
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">No recent top plays yet</p>
        )}
      </div>
    </div>
  );
}
