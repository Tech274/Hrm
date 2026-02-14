import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter, requireInterviewer } from '../middleware/rbac';
import { param } from 'express-validator';
import {
  createInterviewValidation,
  updateInterviewValidation,
  listInterviewsValidation,
  validate,
} from '../validators/interviewValidator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRecruiter,
  createInterviewValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { candidateId, interviewerId, roundName, scheduledAt, status } = req.body;
      const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
      if (!candidate) throw new AppError('Candidate not found', 404);
      const interviewer = await prisma.user.findUnique({ where: { id: interviewerId } });
      if (!interviewer) throw new AppError('Interviewer not found', 404);
      const interview = await prisma.interview.create({
        data: {
          candidateId,
          interviewerId,
          roundName,
          scheduledAt: new Date(scheduledAt),
          status: status || 'scheduled',
        },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true } },
          interviewer: { select: { id: true, name: true, email: true } },
        },
      });
      await auditService.log({
        entityType: 'Interview',
        entityId: interview.id,
        action: 'CREATE',
        performedById: req.user!.id,
        metadata: { candidateId, roundName },
      });
      res.status(201).json(interview);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/',
  requireInterviewer,
  listInterviewsValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { candidateId, interviewerId } = req.query;
      const where: Record<string, unknown> = {};
      if (candidateId) where.candidateId = candidateId;
      if (interviewerId) where.interviewerId = interviewerId;
      const interviews = await prisma.interview.findMany({
        where,
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
          interviewer: { select: { id: true, name: true, email: true } },
          feedback: true,
        },
        orderBy: { scheduledAt: 'desc' },
      });
      res.json({ data: interviews });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/:id', requireInterviewer, param('id').isUUID(), async (req, res, next) => {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviewer: { select: { id: true, name: true, email: true } },
        feedback: true,
      },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

router.put(
  '/:id',
  requireInterviewer,
  updateInterviewValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const existing = await prisma.interview.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Interview not found', 404);
      const { roundName, scheduledAt, status, feedbackStatus } = req.body;
      const interview = await prisma.interview.update({
        where: { id: req.params.id },
        data: {
          ...(roundName !== undefined && { roundName }),
          ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
          ...(status !== undefined && { status }),
          ...(feedbackStatus !== undefined && { feedbackStatus }),
        },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true } },
          interviewer: { select: { id: true, name: true, email: true } },
          feedback: true,
        },
      });
      await auditService.log({
        entityType: 'Interview',
        entityId: interview.id,
        action: 'UPDATE',
        performedById: req.user!.id,
        metadata: req.body,
      });
      res.json(interview);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
