import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter, requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);

router.get(
  '/',
  requireAnyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where: Record<string, unknown> = {};
      if (status && typeof status === 'string') where.status = status;
      const skip = (Number(page) - 1) * Number(limit);
      const [reqs, total] = await Promise.all([
        prisma.jobRequisition.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            recruiter: { select: { id: true, name: true, email: true } },
            _count: { select: { candidates: true } },
          },
          orderBy: { openedAt: 'desc' },
        }),
        prisma.jobRequisition.count({ where }),
      ]);
      res.json({ data: reqs, total, page: Number(page), limit: Number(limit) });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id',
  requireAnyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqn = await prisma.jobRequisition.findUnique({
        where: { id },
        include: {
          recruiter: { select: { id: true, name: true, email: true } },
          candidates: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              stage: true,
              roleApplied: true,
            },
          },
        },
      });
      if (!reqn) {
        return res.status(404).json({ error: 'Job requisition not found' });
      }
      res.json(reqn);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/',
  requireRecruiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, department, status, targetHireDate, recruiterId } = req.body;
      const reqn = await prisma.jobRequisition.create({
        data: {
          title: title || 'Untitled',
          department: department || 'General',
          status: status || 'open',
          targetHireDate: targetHireDate ? new Date(targetHireDate) : null,
          recruiterId: recruiterId || null,
        },
      });
      res.status(201).json(reqn);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id',
  requireRecruiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, department, status, targetHireDate, recruiterId } = req.body;
      const updates: Record<string, unknown> = {};
      if (title != null) updates.title = title;
      if (department != null) updates.department = department;
      if (status != null) updates.status = status;
      if (recruiterId !== undefined) updates.recruiterId = recruiterId || null;
      if (targetHireDate !== undefined) updates.targetHireDate = targetHireDate ? new Date(targetHireDate) : null;
      if (status === 'closed') updates.closedAt = new Date();
      const reqn = await prisma.jobRequisition.update({
        where: { id },
        data: updates as never,
      });
      res.json(reqn);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/assign-recruiter',
  requireRecruiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { recruiterId } = req.body;
      const reqn = await prisma.jobRequisition.update({
        where: { id },
        data: { recruiterId: recruiterId || null },
      });
      res.json(reqn);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
