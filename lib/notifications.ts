import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}
