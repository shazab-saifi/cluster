-- AlterTable
ALTER TABLE "message" ADD COLUMN     "conversationId" TEXT,
ALTER COLUMN "channelId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "dm_conversation" (
    "id" TEXT NOT NULL,
    "userOneId" TEXT NOT NULL,
    "userTwoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_conversation_userOneId_userTwoId_key" ON "dm_conversation"("userOneId", "userTwoId");

-- CreateIndex
CREATE INDEX "message_conversationId_createdAt_idx" ON "message"("conversationId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "dm_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_conversation" ADD CONSTRAINT "dm_conversation_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_conversation" ADD CONSTRAINT "dm_conversation_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
