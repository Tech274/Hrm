import { body, param, validationResult, ValidationChain } from 'express-validator';

export const createFeedbackValidation: ValidationChain[] = [
  body('interviewId').isUUID().withMessage('Valid interview ID required'),
  body('scoreTechnical').isInt({ min: 1, max: 5 }).withMessage('Technical score 1-5 required'),
  body('scoreCommunication')
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication score 1-5 required'),
  body('scoreProblemSolving')
    .isInt({ min: 1, max: 5 })
    .withMessage('Problem solving score 1-5 required'),
  body('scoreCultureFit')
    .isInt({ min: 1, max: 5 })
    .withMessage('Culture fit score 1-5 required'),
  body('strengths').trim().notEmpty().withMessage('Strengths justification required'),
  body('concerns').trim().notEmpty().withMessage('Concerns justification required'),
  body('riskLevel')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Risk level must be low, medium, or high'),
  body('recommendation')
    .isIn(['strong_hire', 'hire', 'hold', 'reject'])
    .withMessage('Recommendation must be strong_hire, hire, hold, or reject'),
  body('signedOff').optional().isBoolean(),
];

export const updateFeedbackValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid feedback ID'),
  body('scoreTechnical').optional().isInt({ min: 1, max: 5 }),
  body('scoreCommunication').optional().isInt({ min: 1, max: 5 }),
  body('scoreProblemSolving').optional().isInt({ min: 1, max: 5 }),
  body('scoreCultureFit').optional().isInt({ min: 1, max: 5 }),
  body('strengths').optional().trim().notEmpty(),
  body('concerns').optional().trim().notEmpty(),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']),
  body('recommendation').optional().isIn(['strong_hire', 'hire', 'hold', 'reject']),
  body('signedOff').optional().isBoolean(),
];

export const feedbackIdValidation: ValidationChain[] = [
  param('interviewId').isUUID().withMessage('Invalid interview ID'),
];

import { AppError } from '../middleware/errorHandler';

export const validate = (req: { [key: string]: unknown }, _res: unknown, next: () => void) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join(', '), 400);
  }
  next();
};
