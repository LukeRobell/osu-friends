import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TeamForm from './TeamForm';
import ApplicationsList from './ApplicationsList';

export default async function ManageTeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  const dbUser = await prisma.user.findUnique({
    where: { osuId: session.user.osuId },
    select: { id: true, teamId: true, teamName: true, teamTag: true, teamFlagUrl: true },
  });

  if (!dbUser?.teamId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🏳️</p>
        <h1 className="text-2xl font-bold text-white mb-3">You&apos;re not in an osu! team</h1>
        <p className="text-gray-500 text-sm">
          Join a team on osu! first, then sync your account from your profile page to pick up the team data.
        </p>
      </div>
    );
  }

  const [existing, applications] = await Promise.all([
    prisma.teamProfile.findUnique({ where: { teamOsuId: dbUser.teamId } }),
    prisma.teamApplication.findMany({
      where: { teamOsuId: dbUser.teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, avatarUrl: true, pp: true, globalRank: true } },
      },
    }),
  ]);

  const pendingCount = applications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">
        {existing ? 'Edit team listing' : 'List your team'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {dbUser.teamName} [{dbUser.teamTag}] — only members of this team can manage this listing.
      </p>
      <TeamForm
        teamOsuId={dbUser.teamId}
        teamName={dbUser.teamName ?? ''}
        teamTag={dbUser.teamTag ?? ''}
        teamFlagUrl={dbUser.teamFlagUrl ?? null}
        existing={existing ? {
          description: existing.description,
          isRecruiting: existing.isRecruiting,
          ppMin: existing.ppMin,
          ppMax: existing.ppMax,
          modes: existing.modes,
          discordUrl: existing.discordUrl,
        } : null}
      />

      {existing && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-1">
            Applications
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-pink-500/20 text-pink-400 text-sm rounded-full border border-pink-500/30">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mb-6">Players who applied to join your team.</p>
          <ApplicationsList
            tag={existing.tag}
            applications={applications.map(a => ({
              id: a.id,
              message: a.message,
              status: a.status,
              createdAt: a.createdAt.toISOString(),
              user: a.user,
            }))}
          />
        </div>
      )}
    </div>
  );
}
