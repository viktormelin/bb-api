/*
  Warnings:

  - You are about to drop the column `money_total` on the `expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "money_total",
ADD COLUMN     "expense_total" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "invite_link" TEXT;
