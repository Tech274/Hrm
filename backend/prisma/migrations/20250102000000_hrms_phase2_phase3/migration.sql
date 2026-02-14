-- CreateEnum Phase 2 & 3
CREATE TYPE "TaskStatus" AS ENUM ('not_started', 'on_going', 'done');
CREATE TYPE "OneOnOneStatus" AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE "PerformanceReviewStatus" AS ENUM ('draft', 'submitted', 'completed');
CREATE TYPE "ExitProcessStatus" AS ENUM ('initiated', 'in_progress', 'completed');

-- CreateTable Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'not_started',
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable OneOnOne
CREATE TABLE "OneOnOne" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "OneOnOneStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneOnOne_pkey" PRIMARY KEY ("id")
);

-- CreateTable PerformanceUpdate
CREATE TABLE "PerformanceUpdate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable PerformanceReview
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "PerformanceReviewStatus" NOT NULL DEFAULT 'draft',
    "ratings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExitProcess
CREATE TABLE "ExitProcess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resignationDate" DATE NOT NULL,
    "lastWorkingDate" DATE NOT NULL,
    "status" "ExitProcessStatus" NOT NULL DEFAULT 'initiated',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExitProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExitProcess_userId_key" ON "ExitProcess"("userId");
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "OneOnOne_userId_idx" ON "OneOnOne"("userId");
CREATE INDEX "OneOnOne_managerId_idx" ON "OneOnOne"("managerId");
CREATE INDEX "PerformanceUpdate_userId_idx" ON "PerformanceUpdate"("userId");
CREATE INDEX "PerformanceReview_userId_idx" ON "PerformanceReview"("userId");
CREATE INDEX "ExitProcess_userId_idx" ON "ExitProcess"("userId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OneOnOne" ADD CONSTRAINT "OneOnOne_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OneOnOne" ADD CONSTRAINT "OneOnOne_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceUpdate" ADD CONSTRAINT "PerformanceUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExitProcess" ADD CONSTRAINT "ExitProcess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
