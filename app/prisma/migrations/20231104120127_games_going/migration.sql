/*
  Warnings:

  - You are about to drop the column `playerLeft` on the `gameRooms` table. All the data in the column will be lost.
  - You are about to drop the column `playerRight` on the `gameRooms` table. All the data in the column will be lost.
  - Added the required column `idPlayerLeft` to the `gameRooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idPlayerRight` to the `gameRooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `waiting` to the `gameRooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gameRooms" DROP COLUMN "playerLeft",
DROP COLUMN "playerRight",
ADD COLUMN     "idPlayerLeft" INTEGER NOT NULL,
ADD COLUMN     "idPlayerRight" INTEGER NOT NULL,
ADD COLUMN     "waiting" BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE "gameRooms" ADD CONSTRAINT "gameRooms_idPlayerLeft_fkey" FOREIGN KEY ("idPlayerLeft") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameRooms" ADD CONSTRAINT "gameRooms_idPlayerRight_fkey" FOREIGN KEY ("idPlayerRight") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
