/*
  Warnings:

  - Added the required column `money_share_percent` to the `expense_splits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense_splits" ADD COLUMN     "money_share_percent" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "money_share" SET DATA TYPE DOUBLE PRECISION;
