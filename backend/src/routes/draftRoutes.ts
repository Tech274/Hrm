import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
import { generateDraft, DraftType } from '../services/draftService';

const router = Router();

router.use(authMiddleware);
router.use(requireAnyAuth);

router.post(
  '/',
  body('type').isIn(['policy', 'email']).withMessage('Type must be policy or email'),
  body('prompt').trim().notEmpty().withMessage('Prompt is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array().map((e) => e.msg).join(', ') });
      }
      const { type, prompt } = req.body as { type: DraftType; prompt: string };
      const result = await generateDraft(type, prompt);
      if (result.error) {
        return res.status(503).json({ error: result.error });
      }
      res.json({ content: result.content });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
