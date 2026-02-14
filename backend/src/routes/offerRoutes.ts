import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireManager, requireAnyAuth } from '../middleware/rbac';
import { param } from 'express-validator';
import { validationResult } from 'express-validator';
import { governanceService } from '../services/governanceService';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);
router.post('/:candidateId/validate', requireAnyAuth, param('candidateId').isUUID(), (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
  }
  governanceService
    .validateOfferEligibility(req.params.candidateId)
    .then((result) => res.json(result))
    .catch(next);
});

router.post('/:candidateId/release', requireManager, param('candidateId').isUUID(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
      return;
    }
    const { candidateId } = req.params;

    const validation = await governanceService.validateOfferEligibility(candidateId);
    if (!validation.canRelease) {
      res.status(400).json({
        error: 'Offer cannot be released. Governance validation failed.',
        details: validation.errors,
        checks: validation.checks,
      });
      return;
    }

    const offer = await prisma.offer.findFirst({
      where: { candidateId },
    });
    if (!offer) throw new AppError('No offer found for candidate', 404);
    if (offer.status === 'released') {
      throw new AppError('Offer already released', 400);
    }

    const [updatedOffer] = await prisma.$transaction([
      prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: 'released',
          releasedAt: new Date(),
          releasedById: req.user!.id,
        },
      }),
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: 'offered' },
      }),
    ]);

    await auditService.log({
      entityType: 'Offer',
      entityId: updatedOffer.id,
      action: 'RELEASE',
      performedById: req.user!.id,
      metadata: { candidateId },
    });

    await auditService.log({
      entityType: 'Candidate',
      entityId: candidateId,
      action: 'STATUS_OFFERED',
      performedById: req.user!.id,
      metadata: { offerId: updatedOffer.id },
    });

    const full = await prisma.offer.findUnique({
      where: { id: updatedOffer.id },
      include: {
        candidate: true,
        releasedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(full);
  } catch (e) {
    next(e);
  }
});

export default router;
