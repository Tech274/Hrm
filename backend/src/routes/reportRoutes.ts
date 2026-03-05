import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter, requireAdminHR } from '../middleware/rbac';
import { AttendanceRemark } from '@prisma/client';

const router = Router();
router.use(authMiddleware);
router.use(requireRecruiter);

type AttendanceStatus = 'present_in' | 'present_out' | 'absent' | 'on_leave' | 'week_off' | 'auto_clocked_out';

function toCSV(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

// --- HR Attendance Dashboard: live/daily/weekly/monthly (must be before /attendance) ---

async function getAttendanceForDate(
  date: Date,
  department?: string
): Promise<{
  list: Array<{
    userId: string;
    name: string;
    department: string;
    clockIn: string | null;
    clockOut: string | null;
    remark: string;
    status: AttendanceStatus;
  }>;
  summary: Record<AttendanceStatus, number> & { total: number };
}> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const userWhere: { isActive: boolean; department?: string } = { isActive: true };
  if (department) userWhere.department = department;

  const [records, approvedLeaveUserIds] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { date: dayStart, user: userWhere },
      include: { user: { select: { id: true, name: true, department: true } } },
    }),
    prisma.leaveRequest
      .findMany({
        where: {
          status: 'approved',
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
          user: userWhere,
        },
        select: { userId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.userId))),
  ]);

  const activeUsers = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, department: true },
    orderBy: { name: 'asc' },
  });

  const recordByUserId = new Map(records.map((r) => [r.userId, r]));
  const summary: Record<AttendanceStatus, number> & { total: number } = {
    present_in: 0,
    present_out: 0,
    absent: 0,
    on_leave: 0,
    week_off: 0,
    auto_clocked_out: 0,
    total: activeUsers.length,
  };

  const list = activeUsers.map((user) => {
    const rec = recordByUserId.get(user.id);
    const onLeave = approvedLeaveUserIds.has(user.id);
    let status: AttendanceStatus;
    let remark = rec?.remark ?? '';

    if (onLeave && (!rec || rec.remark === AttendanceRemark.OnLeave)) {
      status = 'on_leave';
      remark = 'OnLeave';
    } else if (rec) {
      if (rec.remark === AttendanceRemark.WeekOff) {
        status = 'week_off';
      } else if (rec.remark === AttendanceRemark.AutoClockedOut) {
        status = 'auto_clocked_out';
      } else if (rec.remark === AttendanceRemark.Absent) {
        status = 'absent';
      } else if (rec.clockIn && !rec.clockOut) {
        status = 'present_in';
      } else if (rec.clockOut) {
        status = 'present_out';
      } else {
        status = 'absent';
      }
    } else {
      status = 'absent';
    }

    summary[status] += 1;

    return {
      userId: user.id,
      name: user.name,
      department: user.department,
      clockIn: rec?.clockIn ? rec.clockIn.toISOString() : null,
      clockOut: rec?.clockOut ? rec.clockOut.toISOString() : null,
      remark,
      status,
    };
  });

  return { list, summary };
}

router.get('/attendance/live', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = req.query.department as string | undefined;
    const today = new Date();
    const { list, summary } = await getAttendanceForDate(today, department);
    res.json({ list, summary, date: today.toISOString().slice(0, 10) });
  } catch (e) {
    next(e);
  }
});

router.get('/attendance/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateStr = req.query.date as string;
    const department = req.query.department as string | undefined;
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);
    const { list, summary } = await getAttendanceForDate(date, department);
    res.json({ list, summary, date: date.toISOString().slice(0, 10) });
  } catch (e) {
    next(e);
  }
});

router.get('/attendance/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fromStr = req.query.from as string;
    const toStr = req.query.to as string;
    let from: Date;
    let to: Date;
    if (fromStr && toStr) {
      from = new Date(fromStr);
      to = new Date(toStr);
    } else {
      const now = new Date();
      const day = now.getDay();
      const monOffset = day === 0 ? -6 : 1 - day;
      from = new Date(now);
      from.setDate(from.getDate() + monOffset);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const department = req.query.department as string | undefined;
    const userWhere: { isActive: boolean; department?: string } = { isActive: true };
    if (department) userWhere.department = department;

    const [records, leaveRequests] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { date: { gte: from, lte: to }, user: userWhere },
        include: { user: { select: { id: true, name: true, department: true } } },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status: 'approved',
          startDate: { lte: to },
          endDate: { gte: from },
          user: userWhere,
        },
        select: { userId: true, startDate: true, endDate: true },
      }),
    ]);

    const activeUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, department: true },
      orderBy: { name: 'asc' },
    });

    const daysInRange: { date: Date; present: number; absent: number; on_leave: number; week_off: number }[] = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayRecords = records.filter(
        (r) => r.date >= dayStart && r.date <= dayEnd && r.clockIn && r.clockOut && r.remark === AttendanceRemark.Present
      );
      const onLeaveCount = new Set(
        leaveRequests
          .filter((lr) => lr.startDate <= dayEnd && lr.endDate >= dayStart && activeUsers.some((u) => u.id === lr.userId))
          .map((lr) => lr.userId)
      ).size;
      const weekOffCount = records.filter(
        (r) => r.date >= dayStart && r.date <= dayEnd && r.remark === AttendanceRemark.WeekOff
      ).length;
      daysInRange.push({
        date: new Date(d),
        present: dayRecords.length,
        on_leave: onLeaveCount,
        week_off: weekOffCount,
        absent: Math.max(0, activeUsers.length - dayRecords.length - onLeaveCount - weekOffCount),
      });
    }

    const perEmployee = activeUsers.map((user) => {
      const userRecords = records.filter((r) => r.userId === user.id);
      const presentDays = userRecords.filter(
        (r) => r.clockIn && r.clockOut && r.remark === AttendanceRemark.Present
      ).length;
      const weekOffDays = userRecords.filter((r) => r.remark === AttendanceRemark.WeekOff).length;
      const leaveDays = leaveRequests
        .filter((lr) => lr.userId === user.id)
        .reduce((sum, lr) => {
          const start = lr.startDate < from ? from : lr.startDate;
          const end = lr.endDate > to ? to : lr.endDate;
          return sum + Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        }, 0);
      const workingDays = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      return {
        userId: user.id,
        name: user.name,
        department: user.department,
        daysPresent: presentDays,
        daysOnLeave: leaveDays,
        daysWeekOff: weekOffDays,
        daysAbsent: Math.max(0, workingDays - presentDays - leaveDays - weekOffDays),
      };
    });

    res.json({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      byDay: daysInRange.map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        present: d.present,
        absent: d.absent,
        on_leave: d.on_leave,
        week_off: d.week_off,
      })),
      byEmployee: perEmployee,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/attendance/monthly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const department = req.query.department as string | undefined;

    const userWhere: { isActive: boolean; department?: string } = { isActive: true };
    if (department) userWhere.department = department;

    const [records, leaveRequests] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { date: { gte: start, lte: end }, user: userWhere },
        include: { user: { select: { id: true, name: true, department: true } } },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status: 'approved',
          startDate: { lte: end },
          endDate: { gte: start },
          user: userWhere,
        },
        select: { userId: true, startDate: true, endDate: true },
      }),
    ]);

    const activeUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, department: true },
      orderBy: { name: 'asc' },
    });

    const totalDays = end.getDate();

    const byEmployee = activeUsers.map((user) => {
      const userRecords = records.filter((r) => r.userId === user.id);
      const daysPresent = userRecords.filter(
        (r) => r.clockIn && r.clockOut && r.remark === AttendanceRemark.Present
      ).length;
      const daysWeekOff = userRecords.filter((r) => r.remark === AttendanceRemark.WeekOff).length;
      const daysOnLeave = leaveRequests
        .filter((lr) => lr.userId === user.id)
        .reduce((sum, lr) => {
          const rangeStart = lr.startDate < start ? start : lr.startDate;
          const rangeEnd = lr.endDate > end ? end : lr.endDate;
          return sum + Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        }, 0);
      const daysAbsent = Math.max(0, totalDays - daysPresent - daysWeekOff - daysOnLeave);
      return {
        userId: user.id,
        name: user.name,
        department: user.department,
        daysPresent,
        daysAbsent,
        daysOnLeave,
        daysWeekOff,
      };
    });

    const totals = byEmployee.reduce(
      (acc, e) => ({
        daysPresent: acc.daysPresent + e.daysPresent,
        daysAbsent: acc.daysAbsent + e.daysAbsent,
        daysOnLeave: acc.daysOnLeave + e.daysOnLeave,
        daysWeekOff: acc.daysWeekOff + e.daysWeekOff,
      }),
      { daysPresent: 0, daysAbsent: 0, daysOnLeave: 0, daysWeekOff: 0 }
    );

    res.json({
      month,
      year,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      totalEmployees: activeUsers.length,
      totals,
      byEmployee,
    });
  } catch (e) {
    next(e);
  }
});

// --- End HR Attendance Dashboard ---

router.get('/employees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'json';
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        employeeId: true,
        designation: true,
        location: true,
        joiningDate: true,
        birthday: true,
        organization: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    if (format === 'csv') {
      const header = ['Name', 'Email', 'Role', 'Department', 'Employee ID', 'Designation', 'Location', 'Joining Date', 'Birthday', 'Organization', 'Active', 'Created'];
      const rows = users.map((u) => [
        u.name,
        u.email,
        u.role,
        u.department,
        u.employeeId ?? '',
        u.designation ?? '',
        u.location ?? '',
        u.joiningDate ? new Date(u.joiningDate).toISOString().slice(0, 10) : '',
        u.birthday ? new Date(u.birthday).toISOString().slice(0, 10) : '',
        u.organization ?? '',
        u.isActive ? 'Yes' : 'No',
        u.createdAt ? new Date(u.createdAt).toISOString() : '',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      return res.send(toCSV([header, ...rows]));
    }
    res.json({ data: users });
  } catch (e) {
    next(e);
  }
});

router.get('/candidates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'json';
    const candidates = await prisma.candidate.findMany({
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const header = ['First Name', 'Last Name', 'Email', 'Phone', 'Role Applied', 'Stage', 'Status', 'Source', 'Created By', 'Created At'];
      const rows = candidates.map((c) => [
        c.firstName,
        c.lastName,
        c.email,
        c.phone ?? '',
        c.roleApplied,
        c.stage ?? '',
        c.status,
        (c as { source?: string }).source ?? '',
        c.createdBy.name,
        c.createdAt ? new Date(c.createdAt).toISOString() : '',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
      return res.send(toCSV([header, ...rows]));
    }
    res.json({ data: candidates });
  } catch (e) {
    next(e);
  }
});

router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'json';
    const month = req.query.month as string;
    const year = req.query.year as string;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) - 1 : new Date().getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const records = await prisma.attendanceRecord.findMany({
      where: { date: { gte: start, lte: end } },
      include: { user: { select: { name: true, email: true, employeeId: true } } },
      orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }],
    });

    if (format === 'csv') {
      const header = ['Date', 'Employee', 'Email', 'Employee ID', 'Clock In', 'Clock Out', 'Total Minutes', 'Remark'];
      const rows = records.map((r) => [
        r.date ? new Date(r.date).toISOString().slice(0, 10) : '',
        r.user.name,
        r.user.email,
        r.user.employeeId ?? '',
        r.clockIn ? new Date(r.clockIn).toISOString() : '',
        r.clockOut ? new Date(r.clockOut).toISOString() : '',
        String(r.totalMinutes ?? 0),
        r.remark ?? '',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${y}-${m + 1}.csv`);
      return res.send(toCSV([header, ...rows]));
    }
    res.json({ data: records });
  } catch (e) {
    next(e);
  }
});

router.get('/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'json';
    const year = (req.query.year as string) || String(new Date().getFullYear());
    const y = parseInt(year, 10);

    const balances = await prisma.leaveBalance.findMany({
      where: { year: y },
      include: {
        user: { select: { name: true, email: true, employeeId: true } },
        leaveType: true,
      },
      orderBy: [{ user: { name: 'asc' } }, { leaveType: { name: 'asc' } }],
    });

    if (format === 'csv') {
      const header = ['Year', 'Employee', 'Email', 'Employee ID', 'Leave Type', 'Accrued', 'Used', 'Requested', 'Balance'];
      const rows = balances.map((b) => [
        String(y),
        b.user.name,
        b.user.email,
        b.user.employeeId ?? '',
        b.leaveType.name,
        String(b.accrued),
        String(b.used),
        String(b.requested),
        String(b.balance),
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=leave-${y}.csv`);
      return res.send(toCSV([header, ...rows]));
    }
    res.json({ data: balances });
  } catch (e) {
    next(e);
  }
});

export default router;
