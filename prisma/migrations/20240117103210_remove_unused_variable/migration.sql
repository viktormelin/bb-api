/*
  Warnings:

  - You are about to drop the column `authorizer_usersId` on the `expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "authorizer_usersId";
