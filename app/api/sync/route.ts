import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchUserAvgTopPp, fetchUserProfile, fetchTeamFlagUrl } from '@/lib/osu-api';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.osuId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { osuId } = session.user;

  const dbUser = await prisma.user.findFirst({
    where: { osuId },
    select: { preferredModes: true },
  });
  const mode = dbUser?.preferredModes[0] ?? 'osu';

  const [profile, avgPp] = await Promise.all([
    fetchUserProfile(osuId, mode),
    fetchUserAvgTopPp(osuId, mode),
  ]);

  // Fetch team flag URL separately since it requires a dedicated teams API call
  const teamFlagUrl = profile?.team?.id
    ? await fetchTeamFlagUrl(profile.team.id).catch(() => null)
    : null;

  await prisma.user.update({
    where: { osuId },
    data: {
      ...(avgPp != null && { pp: avgPp }),
      ...(profile && {
        globalRank: profile.globalRank,
        isOnline: profile.isOnline,
        lastSeen: profile.lastSeen,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        teamId:      profile.team?.id   ?? null,
        teamName:    profile.team?.name ?? null,
        teamTag:     profile.team?.tag  ?? null,
        teamFlagUrl: teamFlagUrl         ?? null,
      }),
    },
  });

  return NextResponse.json({ ok: true, pp: avgPp });
}
