import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
import { AttendanceRemark } from '@prisma/client';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        manager: { select: { id: true, name: true, email: true, designation: true, department: true } },
        directReports: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            location: true,
            employeeId: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      manager: user.manager,
      directReports: user.directReports,
      hierarchy: user.directReports.length
        ? await Promise.all(
            user.directReports.map(async (r) => ({
              ...r,
              directReportsCount: await prisma.user.count({ where: { managerId: r.id } }),
            }))
          )
        : [],
    });
  } catch (e) {
    next(e);
  }
});

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reports = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } });
    const reportIds = reports.map((r) => r.id);
    const teamSize = reportIds.length;

    if (teamSize === 0) {
      return res.json({ teamSize: 0, attendancePercent: 0, avgWorkingHours: '0:00' });
    }

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId: { in: reportIds },
        date: { gte: thisMonthStart },
        remark: AttendanceRemark.Present,
      },
    });
    const withClockOut = records.filter((r) => r.clockIn && r.clockOut);
    const totalMinutes = withClockOut.reduce((s, r) => s + r.totalMinutes, 0);
    const workingDays = Math.ceil((new Date().getDate() + 1) / 1) || 1;
    const expectedDays = Math.min(workingDays, 22);
    const attendancePercent = expectedDays > 0 ? Math.round((withClockOut.length / (teamSize * expectedDays)) * 100) : 0;
    const avgMin = teamSize > 0 && withClockOut.length > 0 ? totalMinutes / withClockOut.length : 0;
    const avgHours = `${Math.floor(avgMin / 60)}:${String(Math.floor(avgMin % 60)).padStart(2, '0')}`;

    res.json({ teamSize, attendancePercent, avgWorkingHours: avgHours });
  } catch (e) {
    next(e);
  }
});

router.get('/manager-dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reports = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } });
    const reportIds = reports.map((r) => r.id);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      attendanceRecords,
      pendingLeave,
      pendingRegularization,
      openTasks,
      openReqs,
    ] = await Promise.all([
      reportIds.length > 0
        ? prisma.attendanceRecord.findMany({
            where: {
              userId: { in: reportIds },
              date: { gte: thisMonthStart, lte: today },
            },
            include: { user: { select: { id: true, name: true } } },
          })
        : [],
      reportIds.length > 0
        ? prisma.leaveRequest.findMany({
            where: { userId: { in: reportIds }, status: 'pending' },
            include: { user: { select: { name: true } }, leaveType: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
      reportIds.length > 0
        ? prisma.attendanceRegularization.findMany({
            where: { userId: { in: reportIds }, status: 'pending' },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
      reportIds.length > 0
        ? prisma.task.findMany({
            where: { userId: { in: reportIds }, status: { in: ['not_started', 'on_going'] } },
            include: { user: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 15,
          })
        : [],
      prisma.jobRequisition.count({ where: { hiringManagerId: userId, status: 'open' } }),
    ]);

    const attendanceByUser: Record<string, { present: number; total: number }> = {};
    for (const r of attendanceRecords as { userId: string; remark: string }[]) {
      if (!attendanceByUser[r.userId]) attendanceByUser[r.userId] = { present: 0, total: 0 };
      attendanceByUser[r.userId].total++;
      if (r.remark === 'Present' || r.remark === 'OnLeave') attendanceByUser[r.userId].present++;
    }

    res.json({
      teamSize: reportIds.length,
      attendanceSummary: attendanceByUser,
      pendingLeave,
      pendingRegularization,
      openTasks,
      openRequisitions: openReqs,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { department, designation, status } = req.query;
    const where: { managerId: string; department?: string; designation?: string | null; isActive?: boolean } = { managerId: userId };
    if (typeof department === 'string' && department) where.department = department;
    if (typeof designation === 'string' && designation) where.designation = designation;
    if (typeof status === 'string' && status === 'active') where.isActive = true;
    if (typeof status === 'string' && status === 'inactive') where.isActive = false;

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        location: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(members);
  } catch (e) {
    next(e);
  }
});

export default router;
