import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter } from '../middleware/rbac';
import { param } from 'express-validator';
import { validationResult } from 'express-validator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireRecruiter);

router.post('/:candidateId', param('candidateId').isUUID(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
    }
    const { candidateId } = req.params;
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const existing = await prisma.offer.findFirst({ where: { candidateId } });
    if (existing) throw new AppError('Offer already exists for this candidate', 400);

    const offer = await prisma.offer.create({
      data: { candidateId, status: 'locked' },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await auditService.log({
      entityType: 'Offer',
      entityId: offer.id,
      action: 'CREATE',
      performedById: req.user!.id,
      metadata: { candidateId },
    });

    res.status(201).json(offer);
  } catch (e) {
    next(e);
  }
});

export default router;
