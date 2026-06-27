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

  // Fetch osu! standard profile + all 4 mode stats in parallel
  const [osuProfile, taikoProfile, catchProfile, maniaProfile,
         osuPp, taikoPp, catchPp, maniaPp] = await Promise.all([
    fetchUserProfile(osuId, 'osu'),
    fetchUserProfile(osuId, 'taiko').catch(() => null),
    fetchUserProfile(osuId, 'fruits').catch(() => null),
    fetchUserProfile(osuId, 'mania').catch(() => null),
    fetchUserAvgTopPp(osuId, 'osu').catch(() => null),
    fetchUserAvgTopPp(osuId, 'taiko').catch(() => null),
    fetchUserAvgTopPp(osuId, 'fruits').catch(() => null),
    fetchUserAvgTopPp(osuId, 'mania').catch(() => null),
  ]);

  const teamFlagUrl = osuProfile?.team?.id
    ? await fetchTeamFlagUrl(osuProfile.team.id).catch(() => null)
    : null;

  const data = {
    // osu! standard — primary stats
    ...(osuPp != null && { pp: osuPp }),
    ...(osuProfile && {
      globalRank:     osuProfile.globalRank,
      countryRank:    osuProfile.countryRank,
      isOnline:       osuProfile.isOnline,
      lastSeen:       osuProfile.lastSeen,
      osuJoinDate:    osuProfile.joinDate,
      username:       osuProfile.username,
      avatarUrl:      osuProfile.avatarUrl,
      preferredModes: [osuProfile.playmode],
      teamId:         osuProfile.team?.id   ?? null,
      teamName:       osuProfile.team?.name ?? null,
      teamTag:        osuProfile.team?.tag  ?? null,
      teamFlagUrl:    teamFlagUrl            ?? null,
    }),
    // mode-specific stats
    taikoPp:         taikoPp ?? null,
    taikoGlobalRank: taikoProfile?.globalRank ?? null,
    catchPp:         catchPp ?? null,
    catchGlobalRank: catchProfile?.globalRank ?? null,
    maniaPp:         maniaPp ?? null,
    maniaGlobalRank: maniaProfile?.globalRank ?? null,
  };

  await prisma.user.upsert({
    where: { osuId },
    update: data,
    create: {
      osuId,
      username:      osuProfile?.username    ?? session.user.username,
      avatarUrl:     osuProfile?.avatarUrl   ?? session.user.avatarUrl ?? '',
      countryCode:   osuProfile?.countryCode ?? session.user.countryCode ?? '',
      preferredModes: ['osu'],
      isRegistered:  true,
      lastSeen:      new Date(),
      ...data,
    },
  });

  return NextResponse.json({ ok: true, pp: osuPp });
}
