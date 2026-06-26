import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export default async function TeamsPage() {
  const teams = await prisma.teamProfile.findMany({
    orderBy: [{ isRecruiting: 'desc' }, { createdAt: 'desc' }],
  });

  const memberCounts = await prisma.user.groupBy({
    by: ['teamId'],
    where: { teamId: { in: teams.map(t => t.teamOsuId), not: null } },
    _count: { id: true },
  });
  const countMap = Object.fromEntries(
    memberCounts.map(m => [m.teamId as string, m._count.id])
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Finder</h1>
          <p className="text-gray-500 text-sm">
            Find an osu! team that matches your playstyle and skill level.
          </p>
        </div>
        <Link
          href="/teams/manage"
          className="px-5 py-2 border-2 border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-full text-sm font-medium transition-colors"
        >
          List my team
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-14 text-center">
          <p className="text-gray-400 font-medium mb-2">No teams listed yet</p>
          <p className="text-gray-600 text-sm">Be the first to list yours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${encodeURIComponent(team.tag)}`}
              className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 hover:border-pink-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                {team.flagUrl ? (
                  <Image
                    src={team.flagUrl}
                    alt={team.name}
                    width={44}
                    height={30}
                    className="rounded object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-11 h-7 bg-gray-800 rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold group-hover:text-pink-400 transition-colors truncate">
                    {team.name}
                  </p>
                  <p className="text-gray-500 text-xs">[{team.tag}]</p>
                </div>
                {team.isRecruiting && (
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5 shrink-0">
                    Recruiting
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                {team.description}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                {(team.ppMin || team.ppMax) && (
                  <span>{team.ppMin ?? 0}–{team.ppMax ?? '∞'}pp</span>
                )}
                {team.modes.length > 0 && (
                  <span>{team.modes.join(' · ')}</span>
                )}
                <span className="ml-auto">
                  {countMap[team.teamOsuId] ?? 0} on osu!friends
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
