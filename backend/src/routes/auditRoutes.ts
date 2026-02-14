import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { listAuditValidation, validate } from '../validators/auditValidator';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', listAuditValidation, validate as never, async (req, res, next) => {
  try {
    const { entityType, entityId, page = 1, limit = 50 } = req.query;
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: { performedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ data: logs, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    next(e);
  }
});

export default router;
