/*
  Warnings:

  - You are about to drop the column `money_share` on the `expense_splits` table. All the data in the column will be lost.
  - You are about to drop the column `money_split` on the `expense_splits` table. All the data in the column will be lost.
  - You are about to drop the column `money_total` on the `expense_splits` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `group_users` table. All the data in the column will be lost.
  - Added the required column `amount` to the `expense_splits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percentage` to the `expense_splits` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expense_splits" DROP CONSTRAINT "expense_splits_group_usersId_fkey";

-- DropForeignKey
ALTER TABLE "group_users" DROP CONSTRAINT "group_users_authorizer_usersId_fkey";

-- DropForeignKey
ALTER TABLE "group_users" DROP CONSTRAINT "group_users_groupsId_fkey";

-- AlterTable
ALTER TABLE "expense_splits" DROP COLUMN "money_share",
DROP COLUMN "money_split",
DROP COLUMN "money_total",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "percentage" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "group_users" DROP COLUMN "role",
ADD COLUMN     "group_role" TEXT NOT NULL DEFAULT 'user';

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_group_usersId_fkey" FOREIGN KEY ("group_usersId") REFERENCES "group_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_authorizer_usersId_fkey" FOREIGN KEY ("authorizer_usersId") REFERENCES "authorizer_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_groupsId_fkey" FOREIGN KEY ("groupsId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
