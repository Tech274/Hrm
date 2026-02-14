import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter, requireAnyAuth } from '../middleware/rbac';
import { param } from 'express-validator';
import {
  createCandidateValidation,
  updateCandidateValidation,
  candidateIdValidation,
  listCandidatesValidation,
  validate,
} from '../validators/candidateValidator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requireAnyAuth,
  listCandidatesValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where = status ? { status: status as 'active' | 'rejected' | 'offered' | 'hired' } : {};
      const skip = (Number(page) - 1) * Number(limit);
      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            _count: { select: { interviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.candidate.count({ where }),
      ]);
      res.json({ data: candidates, total, page: Number(page), limit: Number(limit) });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/',
  requireRecruiter,
  createCandidateValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, phone, roleApplied, stage, status } = req.body;
      const candidate = await prisma.candidate.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          roleApplied,
          stage: stage || null,
          status: status || 'active',
          createdById: req.user!.id,
        },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await auditService.log({
        entityType: 'Candidate',
        entityId: candidate.id,
        action: 'CREATE',
        performedById: req.user!.id,
        metadata: { firstName, lastName, email },
      });
      res.status(201).json(candidate);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id/audit',
  requireAnyAuth,
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: req.params.id },
      });
      if (!candidate) {
        throw new AppError('Candidate not found', 404);
      }
      const logs = await prisma.auditLog.findMany({
        where: { entityId: req.params.id },
        include: { performedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      res.json({ data: logs });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id',
  requireAnyAuth,
  candidateIdValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: req.params.id },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          interviews: {
            include: {
              interviewer: { select: { id: true, name: true, email: true } },
              feedback: true,
            },
          },
          approvals: { include: { manager: { select: { id: true, name: true, email: true } } } },
          offers: { include: { releasedBy: { select: { id: true, name: true, email: true } } } },
        },
      });
      if (!candidate) throw new AppError('Candidate not found', 404);
      res.json(candidate);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  requireRecruiter,
  updateCandidateValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, phone, roleApplied, stage, status } = req.body;
      const existing = await prisma.candidate.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Candidate not found', 404);
      const candidate = await prisma.candidate.update({
        where: { id: req.params.id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(roleApplied !== undefined && { roleApplied }),
          ...(stage !== undefined && { stage }),
          ...(status !== undefined && { status }),
        },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await auditService.log({
        entityType: 'Candidate',
        entityId: candidate.id,
        action: 'UPDATE',
        performedById: req.user!.id,
        metadata: req.body,
      });
      res.json(candidate);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id',
  requireRecruiter,
  candidateIdValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
      if (!candidate) throw new AppError('Candidate not found', 404);
      await prisma.candidate.delete({ where: { id: req.params.id } });
      await auditService.log({
        entityType: 'Candidate',
        entityId: req.params.id,
        action: 'DELETE',
        performedById: req.user!.id,
        metadata: { email: candidate.email },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
