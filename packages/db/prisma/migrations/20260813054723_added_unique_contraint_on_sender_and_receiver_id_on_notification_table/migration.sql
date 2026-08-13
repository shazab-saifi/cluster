/*
  Warnings:

  - A unique constraint covering the columns `[senderId,receiverId]` on the table `notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notification_senderId_receiverId_key" ON "notification"("senderId", "receiverId");
