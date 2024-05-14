/*
  Warnings:

  - You are about to drop the column `userId` on the `InviteList` table. All the data in the column will be lost.
  - Added the required column `token` to the `InviteList` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InviteList" DROP CONSTRAINT "InviteList_userId_fkey";

-- AlterTable
ALTER TABLE "InviteList" DROP COLUMN "userId",
ADD COLUMN     "token" TEXT NOT NULL;
