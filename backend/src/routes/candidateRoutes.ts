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
      const { status, stage, source, jobRequisitionId, from, to, page = 1, limit = 20 } = req.query;
      const where: Record<string, unknown> = {};
      if (status) where.status = status as 'active' | 'rejected' | 'offered' | 'hired';
      if (stage) where.stage = stage;
      if (source) where.source = source;
      if (jobRequisitionId) where.jobRequisitionId = jobRequisitionId;
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, Date>).gte = new Date(from as string);
        if (to) (where.createdAt as Record<string, Date>).lte = new Date(to as string);
      }
      const skip = (Number(page) - 1) * Number(limit);
      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            jobRequisition: { select: { id: true, title: true, department: true } },
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
      const { firstName, lastName, email, phone, roleApplied, stage, source, jobRequisitionId, status, currentCtc, expectedCtc, presentCompany, experienceYears, noticePeriodDays, technologies } = req.body;
      const candidate = await prisma.candidate.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          roleApplied,
          stage: stage || null,
          source: source || null,
          jobRequisitionId: jobRequisitionId || null,
          status: status || 'active',
          currentCtc: currentCtc != null ? Number(currentCtc) : null,
          expectedCtc: expectedCtc != null ? Number(expectedCtc) : null,
          presentCompany: presentCompany || null,
          experienceYears: experienceYears != null ? Number(experienceYears) : null,
          noticePeriodDays: noticePeriodDays != null ? Number(noticePeriodDays) : null,
          technologies: Array.isArray(technologies) ? technologies : null,
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

router.patch(
  '/bulk',
  requireRecruiter,
  async (req, res, next) => {
    try {
      const { candidateIds, action, value } = req.body;
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ error: 'candidateIds must be a non-empty array' });
      }
      const updateData: Record<string, unknown> = {};
      if (action === 'stage' && typeof value === 'string') {
        updateData.stage = value;
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      } else {
        return res.status(400).json({ error: 'Invalid action. Use action: "stage" with value, or action: "reject"' });
      }
      const result = await prisma.candidate.updateMany({
        where: { id: { in: candidateIds } },
        data: updateData as never,
      });
      for (const cid of candidateIds) {
        await auditService.log({
          entityType: 'Candidate',
          entityId: cid,
          action: 'UPDATE',
          performedById: req.user!.id,
          metadata: { bulkAction: action, ...updateData },
        });
      }
      res.json({ updated: result.count });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id/notes',
  requireAnyAuth,
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: req.params.id },
      });
      if (!candidate) throw new AppError('Candidate not found', 404);
      const notes = await prisma.candidateNote.findMany({
        where: { candidateId: req.params.id },
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ data: notes });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/:id/notes',
  requireRecruiter,
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: req.params.id },
      });
      if (!candidate) throw new AppError('Candidate not found', 404);
      const { body, isPrivate } = req.body;
      const note = await prisma.candidateNote.create({
        data: {
          candidateId: req.params.id,
          userId: req.user!.id,
          body: body || '',
          isPrivate: !!isPrivate,
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      res.status(201).json(note);
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
          jobRequisition: { select: { id: true, title: true, department: true } },
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
      const {
        firstName,
        lastName,
        email,
        phone,
        roleApplied,
        stage,
        source,
        jobRequisitionId,
        status,
        currentCtc,
        expectedCtc,
        presentCompany,
        experienceYears,
        noticePeriodDays,
        technologies,
      } = req.body;
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
          ...(source !== undefined && { source: source || null }),
          ...(jobRequisitionId !== undefined && { jobRequisitionId: jobRequisitionId || null }),
          ...(status !== undefined && { status }),
          ...(currentCtc !== undefined && { currentCtc: currentCtc != null ? Number(currentCtc) : null }),
          ...(expectedCtc !== undefined && { expectedCtc: expectedCtc != null ? Number(expectedCtc) : null }),
          ...(presentCompany !== undefined && { presentCompany: presentCompany || null }),
          ...(experienceYears !== undefined && { experienceYears: experienceYears != null ? Number(experienceYears) : null }),
          ...(noticePeriodDays !== undefined && { noticePeriodDays: noticePeriodDays != null ? Number(noticePeriodDays) : null }),
          ...(technologies !== undefined && { technologies: Array.isArray(technologies) ? technologies : null }),
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
