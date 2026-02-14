import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();

router.use(authMiddleware);
router.use(requireAnyAuth);

const getBusinessDays = (start: Date, end: Date) => {
  let count = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

router.get('/types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (e) {
    next(e);
  }
});

router.get('/balances', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: true },
    });

    if (balances.length === 0) {
      const types = await prisma.leaveType.findMany();
      const created = await Promise.all(
        types.map((t) =>
          prisma.leaveBalance.upsert({
            where: {
              userId_leaveTypeId_year: { userId, leaveTypeId: t.id, year },
            },
            create: {
              userId,
              leaveTypeId: t.id,
              year,
              accrued: t.name === 'Casual Leave' ? 6 : t.name === 'Sick Leave' ? 6 : t.name === 'Privilege Leave' ? 32 : t.name === 'Bereavement Leave' ? 3 : 0,
              used: 0,
              requested: 0,
              balance: t.name === 'Casual Leave' ? 6 : t.name === 'Sick Leave' ? 6 : t.name === 'Privilege Leave' ? 32 : t.name === 'Bereavement Leave' ? 3 : 0,
            },
            update: {},
          })
        )
      );
      return res.json(
        created.map((b) => ({ ...b, leaveType: types.find((t) => t.id === b.leaveTypeId)! }))
      );
    }

    res.json(balances);
  } catch (e) {
    next(e);
  }
});

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (e) {
    next(e);
  }
});

router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      res.status(400).json({ error: 'leaveTypeId, startDate, endDate required' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      res.status(400).json({ error: 'endDate must be >= startDate' });
      return;
    }

    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) {
      res.status(404).json({ error: 'Leave type not found' });
      return;
    }

    const year = new Date().getFullYear();
    const days = getBusinessDays(start, end);

    const balance = await prisma.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
    });

    if (balance && balance.balance < days) {
      res.status(400).json({ error: `Insufficient balance. Available: ${balance.balance}` });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        days,
        reason: reason || null,
        status: 'pending',
      },
      include: { leaveType: true },
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
        data: { requested: { increment: days } },
      });
    }

    res.status(201).json(leaveRequest);
  } catch (e) {
    next(e);
  }
});

router.get('/holidays', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '90';
    const days = parseInt(period) || 90;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + days);

    const holidays = await prisma.holiday.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });

    res.json(holidays);
  } catch (e) {
    next(e);
  }
});

// Manager: pending leave requests from direct reports
router.get('/pending-approvals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const reportIds = await prisma.user.findMany({ where: { managerId }, select: { id: true } }).then((r) => r.map((x) => x.id));
    if (reportIds.length === 0) return res.json([]);

    const requests = await prisma.leaveRequest.findMany({
      where: { userId: { in: reportIds }, status: 'pending' },
      include: { leaveType: true, user: { select: { id: true, name: true, email: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Manager: approve or reject leave request
router.patch('/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approverId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'status must be approved or rejected' });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id }, include: { user: true, leaveType: true } });
    if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });
    if (leaveRequest.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    const reporter = await prisma.user.findFirst({ where: { id: leaveRequest.userId }, select: { managerId: true } });
    if (reporter?.managerId !== approverId && req.user!.role !== 'admin' && req.user!.role !== 'admin_hr') {
      return res.status(403).json({ error: 'Only the report’s manager or admin can approve' });
    }

    const year = new Date(leaveRequest.startDate).getFullYear();
    if (status === 'approved') {
      await prisma.leaveBalance.updateMany({
        where: { userId: leaveRequest.userId, leaveTypeId: leaveRequest.leaveTypeId, year },
        data: { used: { increment: leaveRequest.days }, requested: { decrement: leaveRequest.days }, balance: { decrement: leaveRequest.days } },
      });
    } else {
      await prisma.leaveBalance.updateMany({
        where: { userId: leaveRequest.userId, leaveTypeId: leaveRequest.leaveTypeId, year },
        data: { requested: { decrement: leaveRequest.days } },
      });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: status as 'approved' | 'rejected', approverId, approvedAt: new Date() },
      include: { leaveType: true, user: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
