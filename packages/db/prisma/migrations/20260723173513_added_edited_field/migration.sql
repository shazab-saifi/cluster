/*
  Warnings:

  - Made the column `timestamp` on table `message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "message" ADD COLUMN     "edited" BOOLEAN DEFAULT false,
ALTER COLUMN "timestamp" SET NOT NULL;
