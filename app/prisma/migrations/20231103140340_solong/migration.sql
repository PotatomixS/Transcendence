/*
  Warnings:

  - You are about to drop the column `isProtected` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "isProtected",
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
