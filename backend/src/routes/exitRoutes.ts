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
    const exit = await prisma.exitProcess.findUnique({
      where: { userId },
    });
    res.json(exit || null);
  } catch (e) {
    next(e);
  }
});

router.post('/initiate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { resignationDate, lastWorkingDate } = req.body;
    if (!resignationDate || !lastWorkingDate) {
      res.status(400).json({ error: 'resignationDate and lastWorkingDate required' });
      return;
    }
    const existing = await prisma.exitProcess.findUnique({ where: { userId } });
    if (existing) return res.status(400).json({ error: 'Exit already initiated' });
    const exit = await prisma.exitProcess.create({
      data: {
        userId,
        resignationDate: new Date(resignationDate),
        lastWorkingDate: new Date(lastWorkingDate),
      },
    });
    res.status(201).json(exit);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;
    const exit = await prisma.exitProcess.findFirst({ where: { id, userId } });
    if (!exit) return res.status(404).json({ error: 'Exit process not found' });
    if (req.user!.role !== 'admin' && req.user!.role !== 'admin_hr' && req.user!.role !== 'manager') {
      if (status && !['initiated'].includes(status)) {
        return res.status(403).json({ error: 'Only HR/Admin can update exit status' });
      }
    }
    const updated = await prisma.exitProcess.update({
      where: { id },
      data: status ? { status } : {},
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
