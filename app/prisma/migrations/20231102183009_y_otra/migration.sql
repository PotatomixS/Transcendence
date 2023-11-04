/*
  Warnings:

  - Changed the type of `idUser1` on the `Friends` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `idUser2` on the `Friends` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Friends" DROP COLUMN "idUser1",
ADD COLUMN     "idUser1" INTEGER NOT NULL,
DROP COLUMN "idUser2",
ADD COLUMN     "idUser2" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_idUser1_fkey" FOREIGN KEY ("idUser1") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_idUser2_fkey" FOREIGN KEY ("idUser2") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
