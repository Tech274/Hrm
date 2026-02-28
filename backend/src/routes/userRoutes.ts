import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAdminHR, requireRecruiter } from '../middleware/rbac';
import { updateUserValidation, userIdParam, validateUser } from '../validators/userValidator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.get('/interviewers', requireRecruiter, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'interviewer', isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: users });
  } catch (e) {
    next(e);
  }
});

router.get('/recruiters', requireRecruiter, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['recruiter', 'admin_hr', 'admin'] },
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: users });
  } catch (e) {
    next(e);
  }
});

router.get('/', requireAdminHR, async (_req, res, next): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        employeeId: true,
        designation: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ data: users });
  } catch (e) {
    next(e);
  }
});

router.get(
  '/:id',
  requireAdminHR,
  userIdParam,
  validateUser as never,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          createdAt: true,
          employeeId: true,
          managerId: true,
          designation: true,
          location: true,
          joiningDate: true,
          birthday: true,
          organization: true,
          avatarUrl: true,
          assignedShiftId: true,
          manager: { select: { id: true, name: true, email: true } },
          assignedShift: { select: { id: true, name: true, inTime: true, outTime: true } },
        },
      });
      if (!user) throw new AppError('User not found', 404);
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  requireAdminHR,
  updateUserValidation,
  validateUser as never,
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) throw new AppError('User not found', 404);

      const isSuperAdmin = req.user!.role === 'admin';
      const body = req.body as Record<string, unknown>;
      if ((body.role !== undefined || body.isActive !== undefined) && !isSuperAdmin) {
        res.status(403).json({ error: 'Only Super Admin can change role or active status' });
        return;
      }

      const data: Record<string, unknown> = {};
      const allowed = [
        'name', 'email', 'department', 'role', 'isActive', 'employeeId', 'managerId',
        'designation', 'location', 'joiningDate', 'birthday', 'organization', 'avatarUrl', 'assignedShiftId',
      ];
      for (const key of allowed) {
        if (body[key] !== undefined) {
          if (key === 'managerId' && body[key] === '') data[key] = null;
          else if (key === 'assignedShiftId' && body[key] === '') data[key] = null;
          else if (key === 'joiningDate' || key === 'birthday') data[key] = new Date(body[key] as string);
          else data[key] = body[key];
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: data as never,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          employeeId: true,
          managerId: true,
          designation: true,
          location: true,
          joiningDate: true,
          birthday: true,
          organization: true,
          avatarUrl: true,
          assignedShiftId: true,
          manager: { select: { id: true, name: true, email: true } },
          assignedShift: { select: { id: true, name: true } },
        },
      });

      await auditService.log({
        entityType: 'User',
        entityId: userId,
        action: 'UPDATE',
        performedById: req.user!.id,
        metadata: data,
      });

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
