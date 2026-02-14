import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../validators/authValidator';
import { auditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/register',
  registerValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { name, email, password, role, department } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('Email already registered', 400);
      }
      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role, department },
        select: { id: true, name: true, email: true, role: true, department: true },
      });
      await auditService.log({
        entityType: 'User',
        entityId: user.id,
        action: 'REGISTER',
        metadata: { email },
      });
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login',
  loginValidation,
  validate as never,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        throw new AppError('Invalid credentials', 401);
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new AppError('Invalid credentials', 401);
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
      );
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, department: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
