-- CreateIndex
CREATE INDEX "notification_senderId_idx" ON "notification"("senderId");

-- CreateIndex
CREATE INDEX "notification_receiverId_idx" ON "notification"("receiverId");
