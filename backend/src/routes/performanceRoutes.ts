import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/1on1', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const list = await prisma.oneOnOne.findMany({
      where: { userId },
      include: { manager: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/1on1', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { managerId, scheduledAt, notes } = req.body;
    const manager = await prisma.user.findFirst({ where: { id: managerId } });
    if (!manager) return res.status(404).json({ error: 'Manager not found' });
    const oneOnOne = await prisma.oneOnOne.create({
      data: { userId, managerId, scheduledAt: new Date(scheduledAt), notes: notes || null },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(oneOnOne);
  } catch (e) {
    next(e);
  }
});

router.get('/updates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const updates = await prisma.performanceUpdate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(updates);
  } catch (e) {
    next(e);
  }
});

router.post('/updates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content required' });
      return;
    }
    const update = await prisma.performanceUpdate.create({
      data: { userId, content: content.trim() },
    });
    res.status(201).json(update);
  } catch (e) {
    next(e);
  }
});

router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reviews = await prisma.performanceReview.findMany({
      where: { userId },
      orderBy: { periodEnd: 'desc' },
    });
    res.json(reviews);
  } catch (e) {
    next(e);
  }
});

export default router;
