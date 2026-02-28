import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';
const router = Router();

router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecord = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const records = await prisma.attendanceRecord.findMany({
      where: { userId, date: { gte: from }, clockIn: { not: null }, clockOut: { not: null } },
    });

    const avgWorkMin =
      records.length > 0
        ? records.reduce((s, r) => s + (r.totalMinutes || 0), 0) / records.length
        : 0;
    const avgBreakMin =
      records.length > 0
        ? records.reduce((s, r) => s + (r.breakMinutes || 0), 0) / records.length
        : 0;

    const leaveCounts = await prisma.leaveRequest.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });
    const leaveStats = {
      raised: leaveCounts.reduce((s, c) => s + c._count, 0),
      approved: leaveCounts.find((c) => c.status === 'approved')?._count ?? 0,
      pending: leaveCounts.find((c) => c.status === 'pending')?._count ?? 0,
      rejected: leaveCounts.find((c) => c.status === 'rejected' || c.status === 'cancelled')?._count ?? 0,
    };

    const regCount = await prisma.attendanceRegularization.count({
      where: { userId, status: 'pending' },
    });

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, birthday: true, joiningDate: true, designation: true, department: true, location: true },
    });

    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const birthdays = users.filter((u) => {
      if (!u.birthday) return false;
      const b = new Date(u.birthday);
      return b.getMonth() === month && b.getDate() === day;
    });
    const anniversaries = users.filter((u) => {
      if (!u.joiningDate) return false;
      const j = new Date(u.joiningDate);
      return j.getMonth() === month && j.getDate() === day;
    });

    const year = now.getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: true },
    });
    const leaveSuggestions: { message: string; type: string }[] = [];
    for (const b of balances) {
      if (b.balance > 0 && b.leaveType.renewsYearly) {
        const yearEnd = new Date(year, 11, 31);
        const daysLeft = Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 90 && b.balance >= 3) {
          leaveSuggestions.push({
            type: 'expiry',
            message: `You have ${b.balance} ${b.leaveType.name} days left. Consider using before year-end.`,
          });
        }
      }
    }

    res.json({
      clockIn: todayRecord?.clockIn ?? null,
      clockOut: todayRecord?.clockOut ?? null,
      avgWorkingHours: Math.floor(avgWorkMin / 60) + ':' + (Math.floor(avgWorkMin % 60) + '').padStart(2, '0'),
      avgBreakDuration: Math.floor(avgBreakMin / 60) + ':' + (Math.floor(avgBreakMin % 60) + '').padStart(2, '0'),
      leave: leaveStats,
      workFromHome: { raised: 0, approved: 0, pending: 0, rejected: 0 },
      attendanceRegularization: { raised: regCount, approved: 0, pending: regCount, rejected: 0 },
      birthdays,
      anniversaries,
      leaveSuggestions,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalCandidates, activeCandidates, pendingFeedback, totalInterviews, recentOffers] =
      await Promise.all([
        prisma.candidate.count(),
        prisma.candidate.count({ where: { status: 'active' } }),
        prisma.interview.count({ where: { feedbackStatus: 'pending', status: 'completed' } }),
        prisma.interview.count(),
        prisma.offer.count({ where: { status: 'released' } }),
      ]);

    const myPendingInterviews =
      req.user!.role === 'interviewer'
        ? await prisma.interview.count({
            where: {
              interviewerId: req.user!.id,
              feedbackStatus: 'pending',
              status: 'completed',
            },
          })
        : 0;

    res.json({
      totalCandidates,
      activeCandidates,
      pendingFeedback,
      totalInterviews,
      recentOffers,
      myPendingInterviews,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
