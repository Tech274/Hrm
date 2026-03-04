-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateAssessmentAnswer" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateAssessmentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentQuestion_sortOrder_idx" ON "AssessmentQuestion"("sortOrder");

-- CreateIndex
CREATE INDEX "CandidateAssessmentAnswer_candidateId_idx" ON "CandidateAssessmentAnswer"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateAssessmentAnswer_questionId_idx" ON "CandidateAssessmentAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAssessmentAnswer_candidateId_questionId_key" ON "CandidateAssessmentAnswer"("candidateId", "questionId");

-- AddForeignKey
ALTER TABLE "CandidateAssessmentAnswer" ADD CONSTRAINT "CandidateAssessmentAnswer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAssessmentAnswer" ADD CONSTRAINT "CandidateAssessmentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
