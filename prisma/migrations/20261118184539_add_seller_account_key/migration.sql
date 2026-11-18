/*
  Warnings:

  - A unique constraint covering the columns `[account_key]` on the table `sellers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "account_key" TEXT NOT NULL DEFAULT 'owner';

-- CreateIndex
CREATE UNIQUE INDEX "sellers_account_key_key" ON "sellers"("account_key");
