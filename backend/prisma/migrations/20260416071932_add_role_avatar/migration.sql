-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");
