import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, department, location } = req.query;
    const where: { isActive?: boolean; department?: string; location?: string | null; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' }; employeeId?: { contains: string; mode: 'insensitive' } }> } = { isActive: true };
    if (typeof department === 'string' && department) where.department = department;
    if (typeof location === 'string' && location) where.location = location;
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const people = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        location: true,
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
    res.json(people);
  } catch (e) {
    next(e);
  }
});

export default router;
