import { body, param, query, validationResult, ValidationChain } from 'express-validator';

export const createCandidateValidation: ValidationChain[] = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('roleApplied').trim().notEmpty().withMessage('Role applied is required'),
  body('stage').optional().trim(),
  body('source').optional().trim().isLength({ max: 100 }),
  body('jobRequisitionId').optional().isUUID().withMessage('Invalid job requisition ID'),
  body('currentCtc').optional().isFloat({ min: 0 }).withMessage('Invalid current CTC'),
  body('expectedCtc').optional().isFloat({ min: 0 }).withMessage('Invalid expected CTC'),
  body('presentCompany').optional().trim().isLength({ max: 200 }),
  body('experienceYears').optional().isFloat({ min: 0, max: 50 }).withMessage('Invalid experience years'),
  body('noticePeriodDays').optional().isInt({ min: 0, max: 365 }).withMessage('Invalid notice period'),
  body('technologies').optional().isArray().withMessage('Technologies must be an array'),
  body('technologies.*').optional().isString(),
  body('status')
    .optional()
    .isIn(['active', 'rejected', 'offered', 'hired'])
    .withMessage('Invalid status'),
];

export const updateCandidateValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid candidate ID'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('phone').optional().trim(),
  body('roleApplied').optional().trim().notEmpty(),
  body('stage').optional().trim(),
  body('source').optional().trim().isLength({ max: 100 }),
  body('jobRequisitionId').optional().isUUID().withMessage('Invalid job requisition ID'),
  body('currentCtc').optional().isFloat({ min: 0 }).withMessage('Invalid current CTC'),
  body('expectedCtc').optional().isFloat({ min: 0 }).withMessage('Invalid expected CTC'),
  body('presentCompany').optional().trim().isLength({ max: 200 }),
  body('experienceYears').optional().isFloat({ min: 0, max: 50 }).withMessage('Invalid experience years'),
  body('noticePeriodDays').optional().isInt({ min: 0, max: 365 }).withMessage('Invalid notice period'),
  body('technologies').optional().isArray().withMessage('Technologies must be an array'),
  body('technologies.*').optional().isString(),
  body('status')
    .optional()
    .isIn(['active', 'rejected', 'offered', 'hired'])
    .withMessage('Invalid status'),
];

export const candidateIdValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid candidate ID'),
];

export const listCandidatesValidation: ValidationChain[] = [
  query('candidateId').optional().isUUID(),
  query('status').optional().isIn(['active', 'rejected', 'offered', 'hired']),
  query('stage').optional().trim(),
  query('source').optional().trim(),
  query('jobRequisitionId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
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
