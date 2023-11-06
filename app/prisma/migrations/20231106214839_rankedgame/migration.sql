/*
  Warnings:

  - Added the required column `ranked` to the `gameRooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gameRooms" ADD COLUMN     "ranked" BOOLEAN NOT NULL;
