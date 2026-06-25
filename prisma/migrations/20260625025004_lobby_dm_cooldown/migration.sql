-- CreateTable
CREATE TABLE "LobbyDm" (
    "id" TEXT NOT NULL,
    "senderOsuId" INTEGER NOT NULL,
    "targetOsuId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyDm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LobbyDm_senderOsuId_targetOsuId_idx" ON "LobbyDm"("senderOsuId", "targetOsuId");
