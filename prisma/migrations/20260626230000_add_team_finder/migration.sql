-- AlterEnum: add TEAM_APPLICATION to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_APPLICATION';

-- CreateEnum
CREATE TYPE "TeamApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable: TeamProfile
CREATE TABLE "TeamProfile" (
    "id" TEXT NOT NULL,
    "teamOsuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "flagUrl" TEXT,
    "description" TEXT NOT NULL,
    "isRecruiting" BOOLEAN NOT NULL DEFAULT true,
    "ppMin" DOUBLE PRECISION,
    "ppMax" DOUBLE PRECISION,
    "modes" TEXT[],
    "discordUrl" TEXT,
    "claimedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeamApplication
CREATE TABLE "TeamApplication" (
    "id" TEXT NOT NULL,
    "teamOsuId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "TeamApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamProfile_teamOsuId_key" ON "TeamProfile"("teamOsuId");
CREATE UNIQUE INDEX "TeamProfile_tag_key" ON "TeamProfile"("tag");
CREATE UNIQUE INDEX "TeamProfile_claimedByUserId_key" ON "TeamProfile"("claimedByUserId");
CREATE UNIQUE INDEX "TeamApplication_teamOsuId_userId_key" ON "TeamApplication"("teamOsuId", "userId");

-- AddForeignKey
ALTER TABLE "TeamProfile" ADD CONSTRAINT "TeamProfile_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_teamOsuId_fkey" FOREIGN KEY ("teamOsuId") REFERENCES "TeamProfile"("teamOsuId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
