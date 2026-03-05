import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/org-tree', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const people = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        location: true,
        managerId: true,
      },
      orderBy: { name: 'asc' },
    });
    const byManager = new Map<string | null, typeof people>([]);
    for (const p of people) {
      const key = p.managerId ?? 'root';
      if (!byManager.has(key)) byManager.set(key, []);
      byManager.get(key)!.push(p);
    }
    function buildTree(managerId: string | null): Array<typeof people[0] & { children: ReturnType<typeof buildTree> }> {
      const key = managerId ?? 'root';
      const reports = byManager.get(key) ?? [];
      return reports.map((p) => ({ ...p, children: buildTree(p.id) }));
    }
    const tree = buildTree(null);
    res.json({ tree, flat: people });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/360', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = req.user!.id;
    const targetId = req.params.id;
    const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { id: true, role: true, managerId: true } });
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, email: true, designation: true, department: true, location: true, managerId: true, manager: { select: { name: true } } },
    });
    if (!viewer || !target) {
      throw new AppError('User not found', 404);
    }
    const reports = await prisma.user.findMany({ where: { managerId: viewerId }, select: { id: true } });
    const isReport = reports.some((r) => r.id === targetId);
    const canView =
      targetId === viewerId ||
      isReport ||
      viewer.role === 'admin' ||
      viewer.role === 'admin_hr';
    if (!canView) {
      throw new AppError('Access denied', 403);
    }
    const year = new Date().getFullYear();
    const [attendanceSummary, leaveBalances, tasks, recognitions] = await Promise.all([
      prisma.attendanceRecord.aggregate({
        where: { userId: targetId, date: { gte: new Date(year, 0, 1), lte: new Date() } },
        _count: true,
        _sum: { totalMinutes: true },
      }),
      prisma.leaveBalance.findMany({
        where: { userId: targetId, year },
        include: { leaveType: true },
      }),
      prisma.task.findMany({
        where: { userId: targetId },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.recognition.findMany({
        where: { toUserId: targetId },
        include: { fromUser: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    const oneOnOnes = await prisma.oneOnOne.findMany({
      where: { userId: targetId },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
    });
    res.json({
      profile: target,
      attendanceSummary: {
        totalDays: attendanceSummary._count,
        totalMinutes: attendanceSummary._sum.totalMinutes ?? 0,
      },
      leaveBalances,
      tasks,
      recognitions,
      oneOnOnes,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, department, location } = req.query;
    const where: { isActive?: boolean; department?: string; location?: string | null; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' }; employeeId?: { contains: string; mode: 'insensitive' } }> } = { isActive: true };
    if (typeof department === 'string' && department) where.department = department;
    if (typeof location === 'string' && location) where.location = location;
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const people = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        location: true,
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
    res.json(people);
  } catch (e) {
    next(e);
  }
});

export default router;
