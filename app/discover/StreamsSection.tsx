import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { fetchLiveStreams } from '@/lib/twitch';

export default async function StreamsSection() {
  const twitchUsers = await prisma.user.findMany({
    where: { twitchUsername: { not: null }, isRegistered: true },
    select: { username: true, avatarUrl: true, twitchUsername: true },
  });

  if (twitchUsers.length === 0) return null;

  const liveStreams = await fetchLiveStreams(twitchUsers.map(u => u.twitchUsername!));
  if (liveStreams.length === 0) return null;

  const userMap = new Map(twitchUsers.map(u => [u.twitchUsername!.toLowerCase(), u]));
  const cards = liveStreams
    .map(s => ({ stream: s, user: userMap.get(s.userLogin.toLowerCase()) }))
    .filter((x): x is typeof x & { user: NonNullable<typeof x['user']> } => x.user != null);

  if (cards.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
          </span>
          Streams
          <span className="text-sm font-normal text-gray-500">
            — {cards.length} live
          </span>
        </h2>
        <p className="text-xs text-gray-600 mt-0.5 ml-5">osu!friends members streaming right now</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(({ stream, user }) => (
          <a
            key={stream.userLogin}
            href={`https://twitch.tv/${stream.userLogin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 hover:bg-gray-800 rounded-xl overflow-hidden transition-colors block group"
          >
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stream.thumbnailUrl}
                alt={stream.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                LIVE
              </span>
              <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                {stream.viewerCount.toLocaleString()} viewers
              </span>
            </div>
            <div className="p-3 flex items-center gap-3">
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={36}
                height={36}
                className="rounded-full flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm group-hover:text-purple-300 transition-colors">{user.username}</p>
                <p className="text-gray-500 text-xs truncate">{stream.title || stream.gameName}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
