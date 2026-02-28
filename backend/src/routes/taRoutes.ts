import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

router.get('/hub', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const [
      byStatus,
      bySource,
      openReqs,
      totalCandidates,
      activeCandidates,
      pendingFeedback,
      totalInterviews,
      recentOffers,
      recentCandidates,
    ] = await Promise.all([
      prisma.candidate.groupBy({ by: ['status'], _count: true }),
      prisma.candidate.groupBy({
        by: ['source'],
        where: { source: { not: null } },
        _count: true,
      }),
      prisma.jobRequisition.count({ where: { status: 'open' } }),
      prisma.candidate.count(),
      prisma.candidate.count({ where: { status: 'active' } }),
      prisma.interview.count({ where: { feedbackStatus: 'pending', status: 'completed' } }),
      prisma.interview.count(),
      prisma.offer.count({ where: { status: 'released' } }),
      prisma.candidate.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          roleApplied: true,
          stage: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    const sourceCounts = Object.fromEntries(
      bySource.map((s) => [s.source ?? 'unknown', s._count])
    );

    const myPendingInterviews =
      userRole === 'interviewer'
        ? await prisma.interview.count({
            where: {
              interviewerId: userId,
              feedbackStatus: 'pending',
              status: 'completed',
            },
          })
        : 0;

    const openRequisitions = await prisma.jobRequisition.findMany({
      where: { status: 'open' },
      select: { id: true, openedAt: true },
    });
    const now = Date.now();
    const ageOfJobDays =
      openRequisitions.length > 0
        ? Math.round(
            openRequisitions.reduce((s, r) => s + (now - new Date(r.openedAt).getTime()) / (24 * 60 * 60 * 1000), 0) /
              openRequisitions.length
          )
        : null;

    const closedReqs = await prisma.jobRequisition.findMany({
      where: { status: 'closed', closedAt: { not: null } },
      select: { openedAt: true, closedAt: true },
    });
    const timeToFillDays =
      closedReqs.length > 0
        ? Math.round(
            closedReqs.reduce(
              (s, r) =>
                s +
                (new Date(r.closedAt!).getTime() - new Date(r.openedAt).getTime()) / (24 * 60 * 60 * 1000),
              0
            ) / closedReqs.length
          )
        : null;

    const releasedOffersCount = await prisma.offer.count({ where: { status: 'released' } });
    const hiredAfterOffer = await prisma.candidate.count({ where: { status: 'hired' } });
    const offerAcceptanceRate =
      releasedOffersCount > 0 ? Math.round((hiredAfterOffer / releasedOffersCount) * 100) : null;

    const completedInterviews = await prisma.interview.findMany({
      where: { status: 'completed' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        roundName: true,
        scheduledAt: true,
        feedbackStatus: true,
        candidate: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const myActions =
      userRole === 'interviewer'
        ? await prisma.interview.findMany({
            where: {
              interviewerId: userId,
              feedbackStatus: 'pending',
              status: 'completed',
            },
            take: 10,
            select: {
              id: true,
              roundName: true,
              candidate: { select: { id: true, firstName: true, lastName: true } },
            },
          })
        : [];

    const recentActivities = await prisma.auditLog.findMany({
      where: { entityType: 'Candidate' },
      take: 15,
      orderBy: { timestamp: 'desc' },
      select: {
        action: true,
        timestamp: true,
        entityId: true,
        performedBy: { select: { name: true } },
      },
    });

    res.json({
      totalCandidates,
      activeCandidates,
      pendingFeedback,
      totalInterviews,
      recentOffers,
      openRequisitions: openReqs,
      byStatus: statusCounts,
      bySource: sourceCounts,
      myPendingInterviews,
      recentCandidates,
      timeToFillDays,
      ageOfJobDays,
      offerAcceptanceRate,
      completedInterviews,
      myActions,
      recentActivities,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hiredCandidates = await prisma.candidate.findMany({
      where: { status: 'hired' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        source: true,
        offers: { select: { releasedAt: true }, orderBy: { releasedAt: 'desc' }, take: 1 },
      },
    });
    const timeToHireData = hiredCandidates
      .map((c) => {
        const offer = c.offers[0];
        const endDate = offer?.releasedAt ? new Date(offer.releasedAt) : new Date();
        const days = Math.round((endDate.getTime() - new Date(c.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        return days;
      })
      .filter((d) => d >= 0);
    const avgTimeToHire = timeToHireData.length
      ? Math.round(timeToHireData.reduce((a, b) => a + b, 0) / timeToHireData.length)
      : null;

    const bySource = await prisma.candidate.groupBy({
      by: ['source'],
      _count: true,
      where: { source: { not: null } },
    });
    const totalWithSource = bySource.reduce((s, x) => s + x._count, 0);
    const sourceEffectiveness = bySource.map((s) => ({
      source: s.source ?? 'unknown',
      count: s._count,
      share: totalWithSource ? Math.round((s._count / totalWithSource) * 100) : 0,
    }));

    const hiredBySource = await prisma.candidate.groupBy({
      by: ['source'],
      _count: true,
      where: { status: 'hired', source: { not: null } },
    });
    const hireRateBySource = bySource.map((s) => {
      const hired = hiredBySource.find((h) => h.source === s.source)?._count ?? 0;
      return {
        source: s.source ?? 'unknown',
        total: s._count,
        hired,
        hireRate: s._count ? Math.round((hired / s._count) * 100) : 0,
      };
    });

    res.json({
      avgTimeToHireDays: avgTimeToHire,
      timeToHireSampleSize: timeToHireData.length,
      sourceEffectiveness,
      hireRateBySource,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [byStatus, bySource, openReqs, totalCandidates] = await Promise.all([
      prisma.candidate.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.candidate.groupBy({
        by: ['source'],
        where: { source: { not: null } },
        _count: true,
      }),
      prisma.jobRequisition.count({ where: { status: 'open' } }),
      prisma.candidate.count(),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    const sourceCounts = Object.fromEntries(
      bySource.map((s) => [s.source ?? 'unknown', s._count])
    );

    res.json({
      byStatus: statusCounts,
      bySource: sourceCounts,
      openRequisitions: openReqs,
      totalCandidates,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
