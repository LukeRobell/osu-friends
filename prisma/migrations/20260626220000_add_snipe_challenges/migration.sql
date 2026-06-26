-- AlterEnum: add SNIPE to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'SNIPE';

-- CreateEnum
CREATE TYPE "SnipeChallengeStatus" AS ENUM ('OPEN', 'SNIPED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SnipeChallenge" (
    "id" TEXT NOT NULL,
    "watcherId" TEXT NOT NULL,
    "rivalId" TEXT NOT NULL,
    "osuScoreId" TEXT NOT NULL,
    "beatmapId" TEXT NOT NULL,
    "beatmapsetId" TEXT NOT NULL,
    "mapTitle" TEXT NOT NULL,
    "mapVersion" TEXT NOT NULL,
    "targetPp" DOUBLE PRECISION NOT NULL,
    "status" "SnipeChallengeStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snipedAt" TIMESTAMP(3),

    CONSTRAINT "SnipeChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SnipeChallenge_watcherId_osuScoreId_key" ON "SnipeChallenge"("watcherId", "osuScoreId");

-- AddForeignKey
ALTER TABLE "SnipeChallenge" ADD CONSTRAINT "SnipeChallenge_watcherId_fkey" FOREIGN KEY ("watcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnipeChallenge" ADD CONSTRAINT "SnipeChallenge_rivalId_fkey" FOREIGN KEY ("rivalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
