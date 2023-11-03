/*
  Warnings:

  - You are about to drop the `BlockedChannel` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "channelRol" TEXT NOT NULL DEFAULT 'user';

-- DropTable
DROP TABLE "BlockedChannel";

-- CreateTable
CREATE TABLE "UserMutedChannel" (
    "id" SERIAL NOT NULL,
    "idUser" TEXT NOT NULL,
    "idChannel" TEXT NOT NULL,
    "dateAllowedIn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMutedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersBannedChannel" (
    "id" SERIAL NOT NULL,
    "idUser" TEXT NOT NULL,
    "idChannel" TEXT NOT NULL,

    CONSTRAINT "UsersBannedChannel_pkey" PRIMARY KEY ("id")
);
