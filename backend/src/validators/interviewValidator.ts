import { body, param, query, validationResult, ValidationChain } from 'express-validator';

export const createInterviewValidation: ValidationChain[] = [
  body('candidateId').isUUID().withMessage('Valid candidate ID required'),
  body('interviewerId').isUUID().withMessage('Valid interviewer ID required'),
  body('roundName').trim().notEmpty().withMessage('Round name is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date required'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed'])
    .withMessage('Invalid status'),
];

export const updateInterviewValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid interview ID'),
  body('roundName').optional().trim().notEmpty(),
  body('scheduledAt').optional().isISO8601(),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed'])
    .withMessage('Invalid status'),
  body('feedbackStatus')
    .optional()
    .isIn(['pending', 'submitted'])
    .withMessage('Invalid feedback status'),
];

export const listInterviewsValidation: ValidationChain[] = [
  query('candidateId').optional().isUUID(),
  query('interviewerId').optional().isUUID(),
];

import { AppError } from '../middleware/errorHandler';

export const validate = (req: { [key: string]: unknown }, _res: unknown, next: () => void) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join(', '), 400);
  }
  next();
};
