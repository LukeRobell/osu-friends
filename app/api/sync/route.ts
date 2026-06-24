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

  const teamFlagUrl = profile?.team?.id
    ? await fetchTeamFlagUrl(profile.team.id).catch(() => null)
    : null;

  const data = {
    ...(avgPp != null && { pp: avgPp }),
    ...(profile && {
      globalRank:  profile.globalRank,
      countryRank: profile.countryRank,
      isOnline:    profile.isOnline,
      lastSeen:    profile.lastSeen,
      username:    profile.username,
      avatarUrl:   profile.avatarUrl,
      teamId:      profile.team?.id   ?? null,
      teamName:    profile.team?.name ?? null,
      teamTag:     profile.team?.tag  ?? null,
      teamFlagUrl: teamFlagUrl         ?? null,
    }),
  };

  // upsert so users with a valid JWT but missing DB record get created here
  await prisma.user.upsert({
    where: { osuId },
    update: data,
    create: {
      osuId,
      username:      profile?.username    ?? session.user.username,
      avatarUrl:     profile?.avatarUrl   ?? session.user.avatarUrl ?? '',
      countryCode:   profile?.countryCode ?? session.user.countryCode ?? '',
      preferredModes: ['osu'],
      isRegistered:  true,
      lastSeen:      new Date(),
      ...data,
    },
  });

  return NextResponse.json({ ok: true, pp: avgPp });
}
