-- AlterTable
ALTER TABLE "gameRooms" ADD COLUMN     "modoDeJuego" TEXT NOT NULL DEFAULT 'normal';

-- AlterTable
ALTER TABLE "matches" ALTER COLUMN "modoDeJuego" SET DEFAULT 'normal';
