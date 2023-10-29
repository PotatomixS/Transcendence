/*
  Warnings:

  - Added the required column `idChannel` to the `JoinedChannels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `JoinedChannels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JoinedChannels" ADD COLUMN     "idChannel" TEXT NOT NULL,
ADD COLUMN     "idUser" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Password" TEXT NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocked" (
    "id" SERIAL NOT NULL,
    "idUser" TEXT NOT NULL,
    "idChannel" TEXT NOT NULL,

    CONSTRAINT "Blocked_pkey" PRIMARY KEY ("id")
);
