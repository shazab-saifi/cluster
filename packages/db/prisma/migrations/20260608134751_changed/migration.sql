/*
  Warnings:

  - The `memberCount` column on the `network` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "network" DROP COLUMN "memberCount",
ADD COLUMN     "memberCount" INTEGER DEFAULT 1;
