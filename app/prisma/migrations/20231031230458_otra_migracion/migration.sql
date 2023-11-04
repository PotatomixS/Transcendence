/*
  Warnings:

  - Added the required column `modoDeJuego` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ranked` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "modoDeJuego" TEXT NOT NULL,
ADD COLUMN     "ranked" BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_idUsuarioVictoria_fkey" FOREIGN KEY ("idUsuarioVictoria") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_idUsuarioDerrota_fkey" FOREIGN KEY ("idUsuarioDerrota") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
