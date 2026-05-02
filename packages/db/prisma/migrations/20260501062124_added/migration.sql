/*
  Warnings:

  - Added the required column `ownerId` to the `network` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "network" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "network" ADD CONSTRAINT "network_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
