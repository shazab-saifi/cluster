/*
  Warnings:

  - You are about to drop the column `conversationId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the `dm_conversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dm_conversation" DROP CONSTRAINT "dm_conversation_userOneId_fkey";

-- DropForeignKey
ALTER TABLE "dm_conversation" DROP CONSTRAINT "dm_conversation_userTwoId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_conversationId_fkey";

-- DropIndex
DROP INDEX "message_conversationId_createdAt_idx";

-- AlterTable
ALTER TABLE "message" DROP COLUMN "conversationId",
ADD COLUMN     "friendshipId" TEXT;

-- DropTable
DROP TABLE "dm_conversation";

-- CreateIndex
CREATE INDEX "message_friendshipId_createdAt_idx" ON "message"("friendshipId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
