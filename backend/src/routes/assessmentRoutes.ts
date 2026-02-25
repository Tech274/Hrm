import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRecruiter, requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);

router.get('/questions', requireAnyAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await prisma.assessmentQuestion.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ data: questions });
  } catch (e) {
    next(e);
  }
});

router.post('/questions', requireRecruiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, type, options, sortOrder } = req.body;
    const q = await prisma.assessmentQuestion.create({
      data: {
        title: title || 'Question',
        body: body ?? null,
        type: type || 'text',
        options: options ?? null,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      },
    });
    res.status(201).json(q);
  } catch (e) {
    next(e);
  }
});

router.patch('/questions/:id', requireRecruiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, body, type, options, sortOrder } = req.body;
    const updates: Record<string, unknown> = {};
    if (title != null) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (type != null) updates.type = type;
    if (options !== undefined) updates.options = options;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    const q = await prisma.assessmentQuestion.update({
      where: { id },
      data: updates as never,
    });
    res.json(q);
  } catch (e) {
    next(e);
  }
});

router.delete('/questions/:id', requireRecruiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.assessmentQuestion.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/candidates/:candidateId', requireAnyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.params;
    const answers = await prisma.candidateAssessmentAnswer.findMany({
      where: { candidateId },
      include: { question: true },
      orderBy: { question: { sortOrder: 'asc' } },
    });
    res.json({ data: answers });
  } catch (e) {
    next(e);
  }
});

router.put('/candidates/:candidateId', requireRecruiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.id;
    const { answers } = req.body; // [{ questionId, answer }]
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array of { questionId, answer }' });
    }
    for (const a of answers) {
      if (!a.questionId) continue;
      await prisma.candidateAssessmentAnswer.upsert({
        where: {
          candidateId_questionId: { candidateId, questionId: a.questionId },
        },
        create: {
          candidateId,
          questionId: a.questionId,
          answer: a.answer ?? null,
          submittedById: userId || undefined,
        },
        update: {
          answer: a.answer ?? null,
          submittedById: userId || undefined,
        },
      });
    }
    const updated = await prisma.candidateAssessmentAnswer.findMany({
      where: { candidateId },
      include: { question: true },
    });
    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
