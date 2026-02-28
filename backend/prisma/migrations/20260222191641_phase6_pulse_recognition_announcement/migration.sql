-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "currentCtc" DOUBLE PRECISION,
ADD COLUMN     "expectedCtc" DOUBLE PRECISION,
ADD COLUMN     "experienceYears" DOUBLE PRECISION,
ADD COLUMN     "noticePeriodDays" INTEGER,
ADD COLUMN     "presentCompany" TEXT,
ADD COLUMN     "technologies" JSONB;

-- CreateTable
CREATE TABLE "PulseCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "week" DATE NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PulseCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recognition" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PulseCheck_userId_idx" ON "PulseCheck"("userId");

-- CreateIndex
CREATE INDEX "PulseCheck_week_idx" ON "PulseCheck"("week");

-- CreateIndex
CREATE UNIQUE INDEX "PulseCheck_userId_week_key" ON "PulseCheck"("userId", "week");

-- CreateIndex
CREATE INDEX "Recognition_fromUserId_idx" ON "Recognition"("fromUserId");

-- CreateIndex
CREATE INDEX "Recognition_toUserId_idx" ON "Recognition"("toUserId");

-- CreateIndex
CREATE INDEX "Announcement_effectiveFrom_idx" ON "Announcement"("effectiveFrom");

-- CreateIndex
CREATE INDEX "Announcement_effectiveTo_idx" ON "Announcement"("effectiveTo");

-- AddForeignKey
ALTER TABLE "PulseCheck" ADD CONSTRAINT "PulseCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recognition" ADD CONSTRAINT "Recognition_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recognition" ADD CONSTRAINT "Recognition_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
