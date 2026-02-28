import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth, requireAdminHR } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);

router.get('/', requireAnyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        effectiveFrom: { lte: now },
        effectiveTo: { gte: now },
      },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { effectiveFrom: 'desc' },
    });
    res.json(announcements);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAdminHR, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdById = req.user!.id;
    const { title, body, effectiveFrom, effectiveTo } = req.body;
    if (!title || !body || !effectiveFrom || !effectiveTo) {
      res.status(400).json({ error: 'title, body, effectiveFrom, effectiveTo required' });
      return;
    }
    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: new Date(effectiveTo),
        createdById,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(announcement);
  } catch (e) {
    next(e);
  }
});

export default router;
