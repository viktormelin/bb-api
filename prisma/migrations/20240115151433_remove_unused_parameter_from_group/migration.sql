/*
  Warnings:

  - You are about to drop the column `authorizer_usersId` on the `expense_splits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expense_splits" DROP COLUMN "authorizer_usersId";
