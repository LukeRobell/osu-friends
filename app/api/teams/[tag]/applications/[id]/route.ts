import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tag: string; id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json(); // 'ACCEPTED' | 'DECLINED'
  if (status !== 'ACCEPTED' && status !== 'DECLINED') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const tag = decodeURIComponent(params.tag);

  // Verify requester owns this team listing
  const dbUser = await prisma.user.findUnique({
    where: { osuId: session.user.osuId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const team = await prisma.teamProfile.findUnique({ where: { tag } });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  if (team.claimedByUserId !== dbUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const application = await prisma.teamApplication.update({
    where: { id: params.id },
    data: { status },
    include: { user: { select: { id: true, username: true } } },
  });

  await createNotification({
    userId: application.userId,
    type: 'TEAM_APPLICATION',
    title: status === 'ACCEPTED'
      ? `Your application to [${tag}] was accepted!`
      : `Your application to [${tag}] was declined`,
    link: `/teams/${encodeURIComponent(tag)}`,
  });

  return NextResponse.json({ ok: true });
}
