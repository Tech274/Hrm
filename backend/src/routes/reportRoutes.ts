import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAdminHR } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAdminHR);

function toCSV(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

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
