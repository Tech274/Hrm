import { query, validationResult, ValidationChain } from 'express-validator';

export const listAuditValidation: ValidationChain[] = [
  query('entityType').optional().trim(),
  query('entityId').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

import { AppError } from '../middleware/errorHandler';

export const validate = (req: { [key: string]: unknown }, _res: unknown, next: () => void) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join(', '), 400);
  }
  next();
};
