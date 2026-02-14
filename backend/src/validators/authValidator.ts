import { body, validationResult, ValidationChain } from 'express-validator';

export const registerValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('role').isIn(['employee', 'recruiter', 'interviewer', 'manager', 'admin_hr', 'admin']).withMessage('Invalid role'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

export const loginValidation: ValidationChain[] = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

import { AppError } from '../middleware/errorHandler';

export const validate = (req: { [key: string]: unknown }, _res: unknown, next: () => void) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join(', '), 400);
  }
  next();
};
