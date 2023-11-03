/*
  Warnings:

  - Changed the type of `Password` on the `Channel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "Password",
ADD COLUMN     "Password" BYTEA NOT NULL;
