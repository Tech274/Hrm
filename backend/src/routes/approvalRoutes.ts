import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireManager);

router.post(
  '/',
  body('candidateId').isUUID(),
  body('status').isIn(['pending', 'approved', 'rejected']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
      }
      const { candidateId, status } = req.body;
      const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
      if (!candidate) throw new AppError('Candidate not found', 404);

      const approval = await prisma.approval.create({
        data: {
          candidateId,
          managerId: req.user!.id,
          status,
          approvedAt: status === 'approved' ? new Date() : null,
        },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true } },
          manager: { select: { id: true, name: true, email: true } },
        },
      });

      await auditService.log({
        entityType: 'Approval',
        entityId: approval.id,
        action: 'CREATE',
        performedById: req.user!.id,
        metadata: { candidateId, status },
      });

      res.status(201).json(approval);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  param('id').isUUID(),
  body('status').isIn(['approved', 'rejected']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
      }
      const approval = await prisma.approval.findUnique({
        where: { id: req.params.id },
        include: { candidate: true },
      });
      if (!approval) throw new AppError('Approval not found', 404);
      if (approval.managerId !== req.user!.id) {
        throw new AppError('Only the assigning manager can update this approval', 403);
      }

      const status = req.body.status;
      const updated = await prisma.approval.update({
        where: { id: req.params.id },
        data: {
          status,
          approvedAt: status === 'approved' ? new Date() : null,
        },
        include: {
          candidate: true,
          manager: { select: { id: true, name: true, email: true } },
        },
      });

      await auditService.log({
        entityType: 'Approval',
        entityId: updated.id,
        action: 'UPDATE',
        performedById: req.user!.id,
        metadata: { status },
      });

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
