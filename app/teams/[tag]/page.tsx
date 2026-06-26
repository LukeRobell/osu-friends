import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import TeamApplyButton from './TeamApplyButton';

export default async function TeamProfilePage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);

  const team = await prisma.teamProfile.findUnique({
    where: { tag },
    include: { claimedBy: { select: { username: true } } },
  });
  if (!team) return notFound();

  const session = await getServerSession(authOptions);

  const members = await prisma.user.findMany({
    where: { teamId: team.teamOsuId, isRegistered: true },
    select: { osuId: true, username: true, avatarUrl: true, pp: true },
    orderBy: { pp: 'desc' },
    take: 20,
  });

  let existingStatus: string | null = null;
  let userInTeam = false;
  let isOwner = false;

  if (session?.user?.osuId) {
    const dbUser = await prisma.user.findUnique({
      where: { osuId: session.user.osuId },
      select: { id: true, teamId: true },
    });
    if (dbUser) {
      userInTeam = dbUser.teamId === team.teamOsuId;
      isOwner = userInTeam && team.claimedBy.username === session.user.username;
      if (!userInTeam) {
        const app = await prisma.teamApplication.findUnique({
          where: { teamOsuId_userId: { teamOsuId: team.teamOsuId, userId: dbUser.id } },
          select: { status: true },
        });
        existingStatus = app?.status ?? null;
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        {team.flagUrl ? (
          <Image
            src={team.flagUrl}
            alt={team.name}
            width={80}
            height={55}
            className="rounded-lg object-cover mt-1 shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-20 h-14 bg-gray-800 rounded-lg shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            <span className="text-gray-500 text-xl">[{team.tag}]</span>
            {team.isRecruiting && (
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                Recruiting
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Listed by {team.claimedBy.username}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isOwner && (
            <Link
              href="/teams/manage"
              className="text-sm text-gray-400 hover:text-white border border-white/10 rounded-full px-4 py-1.5 transition-colors"
            >
              Edit listing
            </Link>
          )}
          <Link href="/teams" className="text-sm text-gray-500 hover:text-white transition-colors py-1.5">
            ← All teams
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: About + Members */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-3">About</h2>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{team.description}</p>
          </div>

          {members.length > 0 && (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">
                Members on osu!friends
                <span className="text-gray-500 font-normal ml-2 text-sm">({members.length})</span>
              </h2>
              <div className="space-y-1">
                {members.map(m => (
                  <Link
                    key={m.osuId}
                    href={`/profile/${encodeURIComponent(m.username)}`}
                    className="flex items-center gap-3 hover:bg-white/5 rounded-lg px-2 py-2 transition-colors"
                  >
                    <Image
                      src={m.avatarUrl}
                      alt={m.username}
                      width={28}
                      height={28}
                      className="rounded-full"
                      unoptimized
                    />
                    <span className="text-white text-sm">{m.username}</span>
                    {m.pp && (
                      <span className="text-gray-500 text-xs ml-auto">{Math.round(m.pp)}pp</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Requirements + Apply */}
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Requirements</h2>
            <div className="space-y-4 text-sm">
              {(team.ppMin || team.ppMax) && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">PP Range</p>
                  <p className="text-white">{team.ppMin ?? 0} – {team.ppMax ?? '∞'}pp</p>
                </div>
              )}
              {team.modes.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Modes</p>
                  <p className="text-white capitalize">{team.modes.join(', ')}</p>
                </div>
              )}
              {team.discordUrl && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Discord</p>
                  <a
                    href={team.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Join server ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {userInTeam ? (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 text-center">
              <p className="text-green-400 text-sm font-medium">You&apos;re in this team ✓</p>
            </div>
          ) : session ? (
            <TeamApplyButton teamTag={team.tag} existingStatus={existingStatus} />
          ) : (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 text-center">
              <p className="text-gray-500 text-sm">Sign in to apply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
