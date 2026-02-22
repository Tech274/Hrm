import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fromUserId = req.user!.id;
    const { toUserId, type, message } = req.body;
    if (!toUserId || !type) {
      res.status(400).json({ error: 'toUserId and type required' });
      return;
    }
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }
    const recognition = await prisma.recognition.create({
      data: {
        fromUserId,
        toUserId,
        type: String(type),
        message: message || null,
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(recognition);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const recs = await prisma.recognition.findMany({
      where: { toUserId: userId },
      include: { fromUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(recs);
  } catch (e) {
    next(e);
  }
});

router.get('/team', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reports = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    const reportIds = reports.map((r) => r.id);
    const recs = await prisma.recognition.findMany({
      where: { toUserId: { in: reportIds } },
      include: { fromUser: { select: { id: true, name: true } }, toUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(recs);
  } catch (e) {
    next(e);
  }
});

export default router;
