import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireInterviewer } from '../middleware/rbac';
import {
  createFeedbackValidation,
  updateFeedbackValidation,
  feedbackIdValidation,
  validate,
} from '../validators/feedbackValidator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

function computeAverage(
  technical: number,
  communication: number,
  problemSolving: number,
  cultureFit: number
): number {
  return Math.round(((technical + communication + problemSolving + cultureFit) / 4) * 100) / 100;
}

const router = Router();

router.use(authMiddleware);
router.use(requireInterviewer);

router.post(
  '/',
  createFeedbackValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const {
        interviewId,
        scoreTechnical,
        scoreCommunication,
        scoreProblemSolving,
        scoreCultureFit,
        strengths,
        concerns,
        riskLevel,
        recommendation,
        signedOff = false,
      } = req.body;

      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: { feedback: true },
      });
      if (!interview) throw new AppError('Interview not found', 404);
      if (interview.interviewerId !== req.user!.id) {
        throw new AppError('You are not assigned to this interview', 403);
      }
      if (interview.feedback) throw new AppError('Feedback already exists for this interview', 400);

      const averageScore = computeAverage(
        scoreTechnical,
        scoreCommunication,
        scoreProblemSolving,
        scoreCultureFit
      );

      const feedback = await prisma.$transaction(async (tx) => {
        const f = await tx.feedback.create({
          data: {
            interviewId,
            scoreTechnical,
            scoreCommunication,
            scoreProblemSolving,
            scoreCultureFit,
            averageScore,
            strengths,
            concerns,
            riskLevel,
            recommendation,
            signedOff,
            submittedAt: signedOff ? new Date() : null,
          },
        });
        await tx.interview.update({
          where: { id: interviewId },
          data: {
            feedbackStatus: signedOff ? 'submitted' : 'pending',
            status: 'completed',
          },
        });
        return f;
      });

      await auditService.log({
        entityType: 'Feedback',
        entityId: feedback.id,
        action: 'CREATE',
        performedById: req.user!.id,
        metadata: { interviewId, averageScore },
      });

      const full = await prisma.feedback.findUnique({
        where: { id: feedback.id },
        include: { interview: true },
      });
      res.status(201).json(full);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:interviewId',
  feedbackIdValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const feedback = await prisma.feedback.findUnique({
        where: { interviewId: req.params.interviewId },
        include: { interview: { include: { candidate: true, interviewer: true } } },
      });
      if (!feedback) throw new AppError('Feedback not found', 404);
      const interview = feedback.interview;
      if (interview.interviewerId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'admin_hr') {
        throw new AppError('Access denied', 403);
      }
      res.json(feedback);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  updateFeedbackValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const feedback = await prisma.feedback.findUnique({
        where: { id: req.params.id },
        include: { interview: true },
      });
      if (!feedback) throw new AppError('Feedback not found', 404);
      if (feedback.interview.interviewerId !== req.user!.id) {
        throw new AppError('You can only edit your own feedback', 403);
      }

      const updates: Record<string, unknown> = { ...req.body };
      if (
        updates.scoreTechnical !== undefined ||
        updates.scoreCommunication !== undefined ||
        updates.scoreProblemSolving !== undefined ||
        updates.scoreCultureFit !== undefined
      ) {
        const t = Number(updates.scoreTechnical ?? feedback.scoreTechnical);
        const c = Number(updates.scoreCommunication ?? feedback.scoreCommunication);
        const p = Number(updates.scoreProblemSolving ?? feedback.scoreProblemSolving);
        const cf = Number(updates.scoreCultureFit ?? feedback.scoreCultureFit);
        updates.averageScore = computeAverage(t, c, p, cf);
      }
      if (updates.signedOff === true) {
        updates.submittedAt = new Date();
      }

      const updated = await prisma.$transaction(async (tx) => {
        const f = await tx.feedback.update({
          where: { id: req.params.id },
          data: updates as never,
        });
        if (updates.signedOff === true) {
          await tx.interview.update({
            where: { id: feedback.interviewId },
            data: { feedbackStatus: 'submitted' },
          });
        }
        return f;
      });

      await auditService.log({
        entityType: 'Feedback',
        entityId: updated.id,
        action: 'UPDATE',
        performedById: req.user!.id,
        metadata: req.body,
      });

      const full = await prisma.feedback.findUnique({
        where: { id: updated.id },
        include: { interview: true },
      });
      res.json(full);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
