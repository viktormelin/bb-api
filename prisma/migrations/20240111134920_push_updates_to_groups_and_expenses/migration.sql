/*
  Warnings:

  - Added the required column `group_usersId` to the `expense_splits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupsId` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expense_splits" DROP CONSTRAINT "expense_splits_authorizer_usersId_fkey";

-- AlterTable
ALTER TABLE "expense_splits" ADD COLUMN     "group_usersId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "groupsId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "user_friends" (
    "id" TEXT NOT NULL,
    "authorizer_usersId" CHAR(36) NOT NULL,

    CONSTRAINT "user_friends_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_friends" ADD CONSTRAINT "user_friends_authorizer_usersId_fkey" FOREIGN KEY ("authorizer_usersId") REFERENCES "authorizer_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_group_usersId_fkey" FOREIGN KEY ("group_usersId") REFERENCES "group_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_groupsId_fkey" FOREIGN KEY ("groupsId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
