-- DropIndex
DROP INDEX "Team_leaderId_key";

-- DropIndex
DROP INDEX "TeamMember_userId_key";

-- CreateIndex
CREATE INDEX "Problem_contestId_idx" ON "Problem"("contestId");

-- CreateIndex
CREATE INDEX "Testcase_problemId_idx" ON "Testcase"("problemId");
