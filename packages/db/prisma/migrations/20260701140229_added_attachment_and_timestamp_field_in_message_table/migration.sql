-- DropForeignKey
ALTER TABLE "dm_conversation" DROP CONSTRAINT "dm_conversation_userOneId_fkey";

-- DropForeignKey
ALTER TABLE "dm_conversation" DROP CONSTRAINT "dm_conversation_userTwoId_fkey";

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "attachment" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "dm_conversation" ADD CONSTRAINT "dm_conversation_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_conversation" ADD CONSTRAINT "dm_conversation_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
