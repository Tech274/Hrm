-- CreateEnum
CREATE TYPE "Role" AS ENUM ('recruiter', 'interviewer', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('active', 'rejected', 'offered', 'hired');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('pending', 'submitted');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('strong_hire', 'hire', 'hold', 'reject');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('locked', 'ready', 'released');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "roleApplied" TEXT NOT NULL,
    "stage" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'active',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "feedbackStatus" "FeedbackStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "scoreTechnical" INTEGER NOT NULL,
    "scoreCommunication" INTEGER NOT NULL,
    "scoreProblemSolving" INTEGER NOT NULL,
    "scoreCultureFit" INTEGER NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT NOT NULL,
    "concerns" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "recommendation" "Recommendation" NOT NULL,
    "signedOff" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'locked',
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");

-- CreateIndex
CREATE INDEX "Candidate_createdById_idx" ON "Candidate"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_candidateId_interviewerId_roundName_key" ON "Interview"("candidateId", "interviewerId", "roundName");

-- CreateIndex
CREATE INDEX "Interview_candidateId_idx" ON "Interview"("candidateId");

-- CreateIndex
CREATE INDEX "Interview_interviewerId_idx" ON "Interview"("interviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_interviewId_key" ON "Feedback"("interviewId");

-- CreateIndex
CREATE INDEX "Feedback_interviewId_idx" ON "Feedback"("interviewId");

-- CreateIndex
CREATE INDEX "Approval_candidateId_idx" ON "Approval"("candidateId");

-- CreateIndex
CREATE INDEX "Approval_managerId_idx" ON "Approval"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_candidateId_key" ON "Offer"("candidateId");

-- CreateIndex
CREATE INDEX "Offer_candidateId_idx" ON "Offer"("candidateId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
