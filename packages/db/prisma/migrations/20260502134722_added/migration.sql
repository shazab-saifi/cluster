/*
  Warnings:

  - A unique constraint covering the columns `[id,ownerId]` on the table `network` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "network_id_ownerId_key" ON "network"("id", "ownerId");
