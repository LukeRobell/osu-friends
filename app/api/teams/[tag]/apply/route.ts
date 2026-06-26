import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { tag: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const tag = decodeURIComponent(params.tag);
  const team = await prisma.teamProfile.findUnique({ where: { tag } });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  if (!team.isRecruiting) return NextResponse.json({ error: 'Team is not recruiting' }, { status: 400 });

  const dbUser = await prisma.user.findUnique({
    where: { osuId: session.user.osuId },
    select: { id: true, teamId: true },
  });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (dbUser.teamId === team.teamOsuId) {
    return NextResponse.json({ error: 'Already in this team' }, { status: 400 });
  }

  try {
    await prisma.teamApplication.create({
      data: { teamOsuId: team.teamOsuId, userId: dbUser.id, message: message.trim() },
    });

    await createNotification({
      userId: team.claimedByUserId,
      type: 'TEAM_APPLICATION',
      title: `${session.user.username} applied to [${team.tag}]`,
      body: message.trim().slice(0, 120),
      link: `/teams/${encodeURIComponent(team.tag)}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Already applied' }, { status: 409 });
  }
}
