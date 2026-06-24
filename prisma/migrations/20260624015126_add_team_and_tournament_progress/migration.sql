-- AlterEnum
ALTER TYPE "TournamentStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "teamName" TEXT,
ADD COLUMN     "teamTag" TEXT;
