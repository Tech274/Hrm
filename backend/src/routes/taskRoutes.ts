import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

function getWeekRange(week?: string) {
  const base = week ? new Date(week) : new Date();
  const day = base.getDay();
  const diff = base.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(base);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { week, view } = req.query;
    const { start, end } = getWeekRange(week as string);

    const tasks = await prisma.task.findMany({
      where: { userId, dueDate: { gte: start, lte: end } },
      include: { assignedBy: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    if (view === 'status') {
      const byStatus = { not_started: [] as typeof tasks, on_going: [] as typeof tasks, done: [] as typeof tasks };
      const validStatuses = ['not_started', 'on_going', 'done'] as const;
      tasks.forEach((t) => {
        const key = validStatuses.includes(t.status as (typeof validStatuses)[number]) ? t.status : 'not_started';
        byStatus[key].push(t);
      });
      return res.json({ tasks: byStatus, weekStart: start, weekEnd: end });
    }
    res.json({ tasks, weekStart: start, weekEnd: end });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, dueDate, status, assignedById } = req.body;
    if (!title || !dueDate) {
      res.status(400).json({ error: 'title and dueDate required' });
      return;
    }
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        dueDate: new Date(dueDate),
        status: status || 'not_started',
        assignedById: assignedById || userId,
      },
      include: { assignedBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, dueDate, status } = req.body;
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const data: { title?: string; dueDate?: Date; status?: 'not_started' | 'on_going' | 'done' } = {};
    if (title !== undefined) data.title = title;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (status !== undefined && ['not_started', 'on_going', 'done'].includes(status)) data.status = status as 'not_started' | 'on_going' | 'done';
    const updated = await prisma.task.update({
      where: { id },
      data,
      include: { assignedBy: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
