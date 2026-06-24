-- CreateEnum
CREATE TYPE "RivalRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RIVAL_REQUEST', 'RIVAL_PLAY', 'TOURNAMENT_INVITE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rivalId" TEXT;

-- CreateTable
CREATE TABLE "RivalRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "RivalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RivalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RivalNotifiedPlay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "osuScoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RivalNotifiedPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RivalRequest_fromUserId_toUserId_key" ON "RivalRequest"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RivalNotifiedPlay_userId_osuScoreId_key" ON "RivalNotifiedPlay"("userId", "osuScoreId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rivalId_fkey" FOREIGN KEY ("rivalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RivalRequest" ADD CONSTRAINT "RivalRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RivalRequest" ADD CONSTRAINT "RivalRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RivalNotifiedPlay" ADD CONSTRAINT "RivalNotifiedPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
