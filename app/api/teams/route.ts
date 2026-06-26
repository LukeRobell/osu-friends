import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { teamOsuId, teamName, teamTag, teamFlagUrl, description, isRecruiting, ppMin, ppMax, modes, discordUrl } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { osuId: session.user.osuId },
    select: { id: true, teamId: true },
  });

  if (!dbUser || dbUser.teamId !== teamOsuId) {
    return NextResponse.json({ error: 'You must be a member of this team' }, { status: 403 });
  }

  // On update, only the original creator may edit
  const existing = await prisma.teamProfile.findUnique({ where: { teamOsuId }, select: { claimedByUserId: true } });
  if (existing && existing.claimedByUserId !== dbUser.id) {
    return NextResponse.json({ error: 'Only the listing owner can edit this' }, { status: 403 });
  }

  const profile = await prisma.teamProfile.upsert({
    where: { teamOsuId },
    create: {
      teamOsuId,
      name: teamName,
      tag: teamTag,
      flagUrl: teamFlagUrl ?? null,
      description: description.trim(),
      isRecruiting: isRecruiting ?? true,
      ppMin: ppMin ?? null,
      ppMax: ppMax ?? null,
      modes: modes ?? [],
      discordUrl: discordUrl ?? null,
      claimedByUserId: dbUser.id,
    },
    update: {
      name: teamName,
      tag: teamTag,
      flagUrl: teamFlagUrl ?? null,
      description: description.trim(),
      isRecruiting: isRecruiting ?? true,
      ppMin: ppMin ?? null,
      ppMax: ppMax ?? null,
      modes: modes ?? [],
      discordUrl: discordUrl ?? null,
    },
  });

  return NextResponse.json({ ok: true, tag: profile.tag });
}
