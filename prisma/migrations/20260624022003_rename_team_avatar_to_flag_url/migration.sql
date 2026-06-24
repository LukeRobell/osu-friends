/*
  Warnings:

  - You are about to drop the column `teamAvatarUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "teamAvatarUrl",
ADD COLUMN     "teamFlagUrl" TEXT;
