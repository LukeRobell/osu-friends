import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VoteButtons from './VoteButtons';
import StartButton from './StartButton';

interface Props {
  params: { id: string };
}

export const revalidate = 0;

export default async function TournamentPage({ params }: Props) {
  const [tournament, session] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: { user: true },
          orderBy: { user: { pp: 'desc' } },
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!tournament) notFound();

  const me = tournament.participants.find(p => p.user.osuId === session?.user?.osuId);
  const hasVoted = me?.status === 'ACCEPTED';

  const nowVotes = tournament.participants.filter(p => p.availability === 'now').length;
  const tonightVotes = tournament.participants.filter(p => p.availability === 'tonight').length;
  const acceptedCount = tournament.participants.filter(p => p.status === 'ACCEPTED').length;

  const statusLabel: Record<string, string> = {
    PENDING_VOTES: 'Waiting for votes',
    SCHEDULED: 'Locked in!',
    IN_PROGRESS: 'Live now',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link href="/discover" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← back
          </Link>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-bold">4v4 Match Found!</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${
                tournament.status === 'IN_PROGRESS' ? 'bg-pink-500/20 text-pink-300' :
                tournament.status === 'SCHEDULED' ? 'bg-green-500/20 text-green-300' :
                tournament.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                'bg-yellow-500/20 text-yellow-300'
              }`}>
                {statusLabel[tournament.status] ?? tournament.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {acceptedCount}/8 players voted
            </p>
            {tournament.status === 'SCHEDULED' && tournament.scheduledFor && (
              <p className="text-green-400 text-sm mt-1 font-medium">
                Starting: {new Date(tournament.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Player grid */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {tournament.participants.map(p => (
              <a
                key={p.id}
                href={`https://osu.ppy.sh/users/${p.user.osuId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative">
                  <Image
                    src={p.user.avatarUrl}
                    alt={p.user.username}
                    width={56}
                    height={56}
                    className="rounded-full group-hover:ring-2 ring-pink-500 transition"
                  />
                  {p.status === 'ACCEPTED' && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                      p.availability === 'now' ? 'bg-green-400' : 'bg-blue-400'
                    }`} />
                  )}
                </div>
                <span className="text-xs text-center text-gray-300 truncate w-full text-center leading-tight">
                  {p.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {p.user.pp != null ? `${Math.round(p.user.pp)}pp` : '—'}
                </span>
              </a>
            ))}
          </div>

          {/* Vote tally */}
          {acceptedCount > 0 && (
            <div className="flex gap-4 mb-6 text-sm text-gray-400">
              <span>⚡ Right now: <strong className="text-white">{nowVotes}</strong></span>
              <span>🌙 Tonight: <strong className="text-white">{tonightVotes}</strong></span>
            </div>
          )}

          {me && tournament.status === 'PENDING_VOTES' && (
            <VoteButtons tournamentId={params.id} hasVoted={hasVoted} />
          )}

          {me?.status === 'ACCEPTED' && tournament.status === 'SCHEDULED' && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-green-300 font-medium">Match is on!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your lobby on osu! and invite the other players.
                </p>
              </div>
              <StartButton tournamentId={params.id} />
            </div>
          )}

          {tournament.status === 'IN_PROGRESS' && (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-center">
              <p className="text-pink-300 font-medium">Match in progress!</p>
              <p className="text-gray-400 text-sm mt-1">Good luck!</p>
            </div>
          )}

          {tournament.status === 'CANCELLED' && (
            <p className="text-gray-400 text-sm text-center">
              Not enough players responded. You&apos;ll be matched again tomorrow.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
