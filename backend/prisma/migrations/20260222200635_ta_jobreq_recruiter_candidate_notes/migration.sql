-- AlterTable
ALTER TABLE "JobRequisition" ADD COLUMN     "recruiterId" TEXT,
ADD COLUMN     "targetHireDate" DATE;

-- CreateTable
CREATE TABLE "CandidateNote" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");

-- CreateIndex
CREATE INDEX "JobRequisition_recruiterId_idx" ON "JobRequisition"("recruiterId");

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
