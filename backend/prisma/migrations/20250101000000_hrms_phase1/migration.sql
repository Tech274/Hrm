-- CreateEnum
CREATE TYPE "AttendanceRemark" AS ENUM ('Present', 'WeekOff', 'AutoClockedOut', 'OnLeave', 'Absent');

-- CreateEnum
CREATE TYPE "RegularizationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- AlterTable User: add employee fields
ALTER TABLE "User" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "User" ADD COLUMN "managerId" TEXT;
ALTER TABLE "User" ADD COLUMN "designation" TEXT;
ALTER TABLE "User" ADD COLUMN "location" TEXT;
ALTER TABLE "User" ADD COLUMN "joiningDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "birthday" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "organization" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "assignedShiftId" TEXT;

-- CreateTable Shift
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inTime" TEXT NOT NULL,
    "outTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable AttendanceRecord
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "remark" "AttendanceRemark" NOT NULL DEFAULT 'Present',
    "regularizationRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable AttendanceRegularization
CREATE TABLE "AttendanceRegularization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "requestedClockIn" TIMESTAMP(3) NOT NULL,
    "requestedClockOut" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RegularizationStatus" NOT NULL DEFAULT 'pending',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRegularization_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeaveType
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'days',
    "renewsYearly" BOOLEAN NOT NULL DEFAULT true,
    "accrualType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeaveBalance
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "accrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeaveRequest
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'pending',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable Holiday
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
CREATE UNIQUE INDEX "AttendanceRecord_userId_date_key" ON "AttendanceRecord"("userId", "date");
CREATE UNIQUE INDEX "AttendanceRegularization_attendanceRecordId_key" ON "AttendanceRegularization"("attendanceRecordId");
CREATE UNIQUE INDEX "LeaveBalance_userId_leaveTypeId_year_key" ON "LeaveBalance"("userId", "leaveTypeId", "year");

-- Indexes
CREATE INDEX "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");
CREATE INDEX "AttendanceRegularization_userId_idx" ON "AttendanceRegularization"("userId");
CREATE INDEX "LeaveBalance_userId_idx" ON "LeaveBalance"("userId");
CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- AddForeignKey User
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_assignedShiftId_fkey" FOREIGN KEY ("assignedShiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey AttendanceRecord
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AttendanceRegularization
ALTER TABLE "AttendanceRegularization" ADD CONSTRAINT "AttendanceRegularization_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRegularization" ADD CONSTRAINT "AttendanceRegularization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey LeaveBalance
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey LeaveRequest
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
