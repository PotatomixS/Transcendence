/*
  Warnings:

  - A unique constraint covering the columns `[Name]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idUser]` on the table `JoinedChannels` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Channel_Name_key" ON "Channel"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "JoinedChannels_idUser_key" ON "JoinedChannels"("idUser");
