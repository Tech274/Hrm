import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
import { param } from 'express-validator';
import { validationResult } from 'express-validator';
import { governanceService } from '../services/governanceService';

const router = Router();

router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/:id/governance-status', param('id').isUUID(), (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
  }
  governanceService
    .validateOfferEligibility(req.params.id)
    .then((result) => res.json(result))
    .catch(next);
});

export default router;
