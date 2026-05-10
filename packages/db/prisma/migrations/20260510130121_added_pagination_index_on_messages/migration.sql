-- CreateIndex
CREATE INDEX "message_channelId_createdAt_idx" ON "message"("channelId", "createdAt" DESC);
