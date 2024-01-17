/*
  Warnings:

  - You are about to drop the column `money_share_percent` on the `expense_splits` table. All the data in the column will be lost.
  - Added the required column `money_split` to the `expense_splits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorizer_usersId` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group_usersId` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense_splits" DROP COLUMN "money_share_percent",
ADD COLUMN     "money_split" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "authorizer_usersId" CHAR(36) NOT NULL,
ADD COLUMN     "group_usersId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_usersId_fkey" FOREIGN KEY ("group_usersId") REFERENCES "group_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
