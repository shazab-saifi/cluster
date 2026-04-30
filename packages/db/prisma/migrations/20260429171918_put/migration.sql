/*
  Warnings:

  - You are about to drop the column `type` on the `network_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "network" ADD COLUMN     "type" "NetworkType" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "network_members" DROP COLUMN "type";
