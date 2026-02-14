import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const [myLeave, teamLeave, holidays, teamIds] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { userId, status: 'approved', startDate: { lte: end }, endDate: { gte: start } },
        include: { leaveType: { select: { name: true } } },
      }),
      (async () => {
        const me = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
        const reportIds = me?.managerId
          ? (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map((r) => r.id)
          : [];
        if (reportIds.length === 0) return [];
        return prisma.leaveRequest.findMany({
          where: { userId: { in: reportIds }, status: 'approved', startDate: { lte: end }, endDate: { gte: start } },
          include: { user: { select: { name: true } }, leaveType: { select: { name: true } } },
        });
      })(),
      prisma.holiday.findMany({ where: { date: { gte: start, lte: end } }, orderBy: { date: 'asc' } }),
      prisma.user.findMany({ where: { managerId: userId }, select: { id: true } }).then((r) => r.map((x) => x.id)),
    ]);

    const events: { date: string; type: string; title: string; meta?: unknown }[] = [];
    myLeave.forEach((l) => {
      const d = new Date(l.startDate);
      const e = new Date(l.endDate);
      while (d <= e) {
        if (d >= start && d <= end) events.push({ date: d.toISOString().slice(0, 10), type: 'my_leave', title: l.leaveType.name, meta: l });
        d.setDate(d.getDate() + 1);
      }
    });
    teamLeave.forEach((l) => {
      const d = new Date(l.startDate);
      const e = new Date(l.endDate);
      while (d <= e) {
        if (d >= start && d <= end) events.push({ date: d.toISOString().slice(0, 10), type: 'team_leave', title: `${l.user.name}: ${l.leaveType.name}`, meta: l });
        d.setDate(d.getDate() + 1);
      }
    });
    holidays.forEach((h) => {
      events.push({ date: h.date.toISOString().slice(0, 10), type: 'holiday', title: h.name, meta: h });
    });
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day === 0 || day === 6) events.push({ date: d.toISOString().slice(0, 10), type: 'week_off', title: 'Week off', meta: null });
    }

    res.json({ events, month, year });
  } catch (e) {
    next(e);
  }
});

export default router;
