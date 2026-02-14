import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({ error: 'Insufficient permissions' });
  };
};

export const requireAdmin = requireRoles('admin');
export const requireSuperAdmin = requireRoles('admin');
export const requireAdminHR = requireRoles('admin', 'admin_hr');
export const requireManager = requireRoles('admin', 'admin_hr', 'manager');
export const requireRecruiter = requireRoles('admin', 'admin_hr', 'recruiter');
export const requireInterviewer = requireRoles('admin', 'admin_hr', 'manager', 'interviewer');
export const requireAnyAuth = requireRoles('admin', 'admin_hr', 'manager', 'recruiter', 'interviewer', 'employee');
