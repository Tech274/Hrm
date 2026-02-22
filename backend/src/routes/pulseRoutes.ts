import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

const getWeekStart = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { score, comment } = req.body;
    if (typeof score !== 'number' || score < 1 || score > 5) {
      res.status(400).json({ error: 'Score must be 1-5' });
      return;
    }
    const week = getWeekStart(new Date());
    const pulse = await prisma.pulseCheck.upsert({
      where: {
        userId_week: { userId, week },
      },
      create: { userId, score, week, comment: comment || null },
      update: { score, comment: comment || null },
    });
    res.status(201).json(pulse);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const weeks = parseInt(req.query.weeks as string) || 4;
    const from = new Date();
    from.setDate(from.getDate() - weeks * 7);
    from.setHours(0, 0, 0, 0);

    const pulses = await prisma.pulseCheck.findMany({
      where: { userId, week: { gte: from } },
      orderBy: { week: 'asc' },
    });
    res.json(pulses);
  } catch (e) {
    next(e);
  }
});

export default router;
