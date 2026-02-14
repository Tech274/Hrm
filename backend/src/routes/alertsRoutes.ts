import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const alerts = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(alerts);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const alert = await prisma.notification.findFirst({ where: { id, userId } });
    if (!alert) return res.status(404).json({ error: 'Notification not found' });
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
