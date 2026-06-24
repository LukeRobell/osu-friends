import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

type TournamentUser = Prisma.UserGetPayload<Record<string, never>>;

export default async function LiveTournaments() {
  const since = new Date(Date.now() - 3 * 60 * 60 * 1000); // active within last 3h

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: 'IN_PROGRESS',
      createdAt: { gte: since },
    },
    include: {
      participants: {
        where: { status: 'ACCEPTED' },
        include: { user: true },
        orderBy: { user: { pp: 'desc' } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  if (tournaments.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
        </span>
        osu!friends matches live now
      </h2>

      <div className="flex flex-col gap-3">
        {tournaments.map(t => {
          const players = t.participants.map(p => p.user);

          // Detect teams: group players by teamId if at least 2 teams of 4 exist
          const teamGroups = new Map<string, TournamentUser[]>();
          for (const p of players) {
            if (!p.teamId) continue;
            const g = teamGroups.get(p.teamId) ?? [];
            g.push(p);
            teamGroups.set(p.teamId, g);
          }

          const teamArray = Array.from(teamGroups.values()).filter(g => g.length >= 2);
          const isTeamMatch = teamArray.length >= 2;

          // Split players: teams if available, otherwise top 4 vs bottom 4
          const sideA = isTeamMatch ? teamArray[0] : players.slice(0, 4);
          const sideB = isTeamMatch ? teamArray[1] : players.slice(4, 8);

          const labelA = isTeamMatch && sideA[0]?.teamName
            ? `${sideA[0].teamName} [${sideA[0].teamTag}]`
            : null;
          const labelB = isTeamMatch && sideB[0]?.teamName
            ? `${sideB[0].teamName} [${sideB[0].teamTag}]`
            : null;

          return (
            <div key={t.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {/* Team / Side A */}
                <div className="flex-1 min-w-0">
                  {labelA && (
                    <p className="text-xs font-semibold text-pink-300 mb-1.5 truncate">{labelA}</p>
                  )}
                  <div className="flex -space-x-1.5">
                    {sideA.slice(0, 4).map(u => (
                      <div key={u.id} title={u.username} className="rounded-full ring-2 ring-gray-800">
                        <Image src={u.avatarUrl} alt={u.username} width={28} height={28} className="rounded-full" />
                      </div>
                    ))}
                  </div>
                  {!labelA && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {sideA.map(u => u.username).join(', ')}
                    </p>
                  )}
                </div>

                {/* VS */}
                <span className="text-sm font-bold text-gray-500 flex-shrink-0">vs</span>

                {/* Team / Side B */}
                <div className="flex-1 min-w-0 text-right">
                  {labelB && (
                    <p className="text-xs font-semibold text-blue-300 mb-1.5 truncate">{labelB}</p>
                  )}
                  <div className="flex -space-x-1.5 justify-end">
                    {sideB.slice(0, 4).map(u => (
                      <div key={u.id} title={u.username} className="rounded-full ring-2 ring-gray-800">
                        <Image src={u.avatarUrl} alt={u.username} width={28} height={28} className="rounded-full" />
                      </div>
                    ))}
                  </div>
                  {!labelB && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {sideB.map(u => u.username).join(', ')}
                    </p>
                  )}
                </div>

                <Link
                  href={`/tournament/${t.id}`}
                  className="ml-3 flex-shrink-0 text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
