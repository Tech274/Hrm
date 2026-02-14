import { body, param, validationResult, ValidationChain } from 'express-validator';

const roleValues = ['employee', 'recruiter', 'interviewer', 'manager', 'admin_hr', 'admin'] as const;

export const userIdParam: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

export const updateUserValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('email').optional().trim().isEmail(),
  body('department').optional().trim().notEmpty().isLength({ max: 100 }),
  body('role').optional().isIn(roleValues).withMessage('Invalid role'),
  body('isActive').optional().isBoolean(),
  body('employeeId').optional().trim().isLength({ max: 50 }),
  body('managerId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid manager ID'),
  body('designation').optional().trim().isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('joiningDate').optional().isISO8601().withMessage('Invalid date'),
  body('birthday').optional().isISO8601().withMessage('Invalid date'),
  body('organization').optional().trim().isLength({ max: 100 }),
  body('avatarUrl').optional().trim().isLength({ max: 500 }),
  body('assignedShiftId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid shift ID'),
];

import { AppError } from '../middleware/errorHandler';

export const validateUser = (req: { [key: string]: unknown }, _res: unknown, next: () => void) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join(', '), 400);
  }
  next();
};
