import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TeamForm from './TeamForm';
import ApplicationsList from './ApplicationsList';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { tab?: string };
}

export default async function ManageTeamPage({ searchParams }: Props) {
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

  const existing = await prisma.teamProfile.findUnique({
    where: { teamOsuId: dbUser.teamId },
  });

  const isOwner = existing?.claimedByUserId === dbUser.id;

  // Non-owners who aren't the creator can't manage
  if (existing && !isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-white mb-3">Not your listing</h1>
        <p className="text-gray-500 text-sm">
          Only the member who created this listing can edit it or manage applications.
        </p>
      </div>
    );
  }

  const tab = searchParams.tab ?? 'listing';

  const applications = tab === 'applications' || existing
    ? await prisma.teamApplication.findMany({
        where: { teamOsuId: dbUser.teamId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, avatarUrl: true, pp: true, globalRank: true } },
        },
      })
    : [];

  const pendingCount = applications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">
        {existing ? 'Manage team listing' : 'List your team'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {dbUser.teamName} [{dbUser.teamTag}]
      </p>

      {/* Tabs — only shown when a listing exists */}
      {existing && (
        <div className="flex gap-1 mb-8 bg-gray-900/60 border border-white/10 rounded-xl p-1 w-fit">
          <Link
            href="/teams/manage?tab=listing"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'listing' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Edit Listing
          </Link>
          <Link
            href="/teams/manage?tab=applications"
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'applications' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Applications
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full px-1">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      )}

      {tab === 'listing' && (
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
      )}

      {tab === 'applications' && existing && (
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
      )}
    </div>
  );
}
