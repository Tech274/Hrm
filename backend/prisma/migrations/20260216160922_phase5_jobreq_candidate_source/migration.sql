-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "jobRequisitionId" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "hiringManagerId" TEXT,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRequisition_status_idx" ON "JobRequisition"("status");

-- CreateIndex
CREATE INDEX "JobRequisition_hiringManagerId_idx" ON "JobRequisition"("hiringManagerId");

-- CreateIndex
CREATE INDEX "Candidate_source_idx" ON "Candidate"("source");

-- CreateIndex
CREATE INDEX "Candidate_jobRequisitionId_idx" ON "Candidate"("jobRequisitionId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobRequisitionId_fkey" FOREIGN KEY ("jobRequisitionId") REFERENCES "JobRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
