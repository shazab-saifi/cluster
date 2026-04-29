-- CreateEnum
CREATE TYPE "NetworkRole" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "role" "NetworkRole" NOT NULL,
    "type" "NetworkType" NOT NULL DEFAULT 'PUBLIC',

    CONSTRAINT "network_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "network_name_key" ON "network"("name");

-- CreateIndex
CREATE INDEX "network_name_idx" ON "network"("name");

-- CreateIndex
CREATE UNIQUE INDEX "network_members_userId_networkId_key" ON "network_members"("userId", "networkId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_networkId_name_key" ON "channel"("networkId", "name");

-- CreateIndex
CREATE INDEX "message_message_idx" ON "message"("message");

-- CreateIndex
CREATE INDEX "user_name_idx" ON "user"("name");

-- AddForeignKey
ALTER TABLE "network_members" ADD CONSTRAINT "network_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_members" ADD CONSTRAINT "network_members_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
