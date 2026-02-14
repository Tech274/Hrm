import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
import { AttendanceRemark } from '@prisma/client';

const router = Router();

router.use(authMiddleware);
router.use(requireAnyAuth);

const parseTime = (s: string) => {
  const [h, m = 0, sec = 0] = s.split(':').map(Number);
  return h * 3600 + m * 60 + sec;
};

const formatSeconds = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

router.post('/clock-in', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing?.clockIn) {
      res.status(400).json({ error: 'Already clocked in today' });
      return;
    }

    const now = new Date();
    const record = await prisma.attendanceRecord.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        clockIn: now,
        remark: AttendanceRemark.Present,
      },
      update: { clockIn: now, remark: AttendanceRemark.Present },
    });

    res.json(record);
  } catch (e) {
    next(e);
  }
});

router.post('/clock-out', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!record?.clockIn) {
      res.status(400).json({ error: 'Not clocked in today' });
      return;
    }

    if (record.clockOut) {
      res.status(400).json({ error: 'Already clocked out today' });
      return;
    }

    const now = new Date();
    const breakMin = record.breakMinutes || 0;
    const totalSec = Math.floor((now.getTime() - record.clockIn.getTime()) / 1000) - breakMin * 60;
    const totalMinutes = Math.max(0, Math.floor(totalSec / 60));

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        clockOut: now,
        totalMinutes,
        remark: AttendanceRemark.Present,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'desc' },
    });

    const daysWithData = records.filter((r) => r.clockIn && r.clockOut);
    const totalWorkMin = daysWithData.reduce((s, r) => s + r.totalMinutes, 0);
    const avgWorkMin = daysWithData.length > 0 ? totalWorkMin / daysWithData.length : 0;
    const avgInTime =
      daysWithData.length > 0
        ? daysWithData.reduce((s, r) => s + (r.clockIn ? parseTime(r.clockIn.toTimeString().slice(0, 8)) : 0), 0) /
          daysWithData.length
        : 0;
    const avgOutTime =
      daysWithData.length > 0
        ? daysWithData.reduce((s, r) => s + (r.clockOut ? parseTime(r.clockOut.toTimeString().slice(0, 8)) : 0), 0) /
          daysWithData.length
        : 0;
    const avgBreak =
      daysWithData.length > 0
        ? daysWithData.reduce((s, r) => s + (r.breakMinutes || 0), 0) / daysWithData.length
        : 0;
    const paidDays = records.filter(
      (r) => r.remark === AttendanceRemark.Present && r.clockIn && r.clockOut
    ).length;

    const summary = {
      avgWorkingHours: formatSeconds(avgWorkMin * 60),
      avgInTime: avgInTime > 0 ? new Date(avgInTime * 1000).toLocaleTimeString('en-US', { hour12: true }) : '-',
      avgOutTime: avgOutTime > 0 ? new Date(avgOutTime * 1000).toLocaleTimeString('en-US', { hour12: true }) : '-',
      avgBreakTime: formatSeconds(avgBreak * 60),
      paidDays,
    };

    res.json({ records, summary });
  } catch (e) {
    next(e);
  }
});

router.post('/regularize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { attendanceRecordId, requestedClockIn, requestedClockOut, reason } = req.body;

    if (!attendanceRecordId || !requestedClockIn || !requestedClockOut || !reason) {
      res.status(400).json({ error: 'attendanceRecordId, requestedClockIn, requestedClockOut, reason required' });
      return;
    }

    const record = await prisma.attendanceRecord.findFirst({
      where: { id: attendanceRecordId, userId },
    });

    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    const existingReg = await prisma.attendanceRegularization.findUnique({
      where: { attendanceRecordId },
    });
    if (existingReg && existingReg.status === 'pending') {
      res.status(400).json({ error: 'Regularization request already pending' });
      return;
    }

    const reg = await prisma.attendanceRegularization.create({
      data: {
        userId,
        attendanceRecordId,
        requestedClockIn: new Date(requestedClockIn),
        requestedClockOut: new Date(requestedClockOut),
        reason,
      },
    });

    await prisma.attendanceRecord.update({
      where: { id: attendanceRecordId },
      data: { regularizationRequested: true },
    });

    res.json(reg);
  } catch (e) {
    next(e);
  }
});

router.get('/regularize-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.attendanceRegularization.findMany({
      where: { userId },
      include: { attendanceRecord: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (e) {
    next(e);
  }
});

router.get('/shifts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } });
    res.json(shifts);
  } catch (e) {
    next(e);
  }
});

// Manager: pending regularization requests from direct reports
router.get('/regularize-pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const reportIds = await prisma.user.findMany({ where: { managerId }, select: { id: true } }).then((r) => r.map((x) => x.id));
    if (reportIds.length === 0) return res.json([]);

    const requests = await prisma.attendanceRegularization.findMany({
      where: { userId: { in: reportIds }, status: 'pending' },
      include: {
        attendanceRecord: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Manager or admin: approve or reject regularization
router.patch('/regularize/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approverId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'status must be approved or rejected' });
      return;
    }

    const reg = await prisma.attendanceRegularization.findUnique({
      where: { id },
      include: { user: true, attendanceRecord: true },
    });
    if (!reg) return res.status(404).json({ error: 'Regularization request not found' });
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    const reporter = await prisma.user.findFirst({ where: { id: reg.userId }, select: { managerId: true } });
    if (reporter?.managerId !== approverId && req.user!.role !== 'admin' && req.user!.role !== 'admin_hr') {
      return res.status(403).json({ error: 'Only the report’s manager or admin can approve' });
    }

    const updated = await prisma.attendanceRegularization.update({
      where: { id },
      data: { status: status as 'approved' | 'rejected', approverId: approverId, approvedAt: new Date() },
      include: { attendanceRecord: true, user: { select: { id: true, name: true } } },
    });

    if (status === 'approved') {
      await prisma.attendanceRecord.update({
        where: { id: reg.attendanceRecordId },
        data: {
          clockIn: reg.requestedClockIn,
          clockOut: reg.requestedClockOut,
          totalMinutes: Math.max(0, Math.floor((reg.requestedClockOut.getTime() - reg.requestedClockIn.getTime()) / 60000) - (reg.attendanceRecord?.breakMinutes || 0)),
        },
      });
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
