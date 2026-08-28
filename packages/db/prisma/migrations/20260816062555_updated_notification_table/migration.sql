/*
  Warnings:

  - The values [ACCEPTED_REQUEST] on the enum `NotificationTypes` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isRead` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[actorId,userId]` on the table `notification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `actorId` to the `notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationTypes_new" AS ENUM ('FRIEND_REQUEST', 'MENTION', 'REACTION');
ALTER TABLE "notification" ALTER COLUMN "type" TYPE "NotificationTypes_new" USING ("type"::text::"NotificationTypes_new");
ALTER TYPE "NotificationTypes" RENAME TO "NotificationTypes_old";
ALTER TYPE "NotificationTypes_new" RENAME TO "NotificationTypes";
DROP TYPE "public"."NotificationTypes_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_senderId_fkey";

-- DropIndex
DROP INDEX "notification_receiverId_idx";

-- DropIndex
DROP INDEX "notification_senderId_idx";

-- DropIndex
DROP INDEX "notification_senderId_receiverId_key";

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "isRead",
DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "actorId" TEXT NOT NULL,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "notification_actorId_idx" ON "notification"("actorId");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_actorId_userId_key" ON "notification"("actorId", "userId");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
