-- DropForeignKey
ALTER TABLE "InviteList" DROP CONSTRAINT "InviteList_roomId_fkey";

-- AddForeignKey
ALTER TABLE "InviteList" ADD CONSTRAINT "InviteList_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
