import { prisma } from '../lib/prisma';
import { RiskLevel } from '@prisma/client';

export interface GovernanceResult {
  canRelease: boolean;
  status: 'locked' | 'ready';
  checks: {
    allFeedbackSubmitted: boolean;
    allFeedbackSignedOff: boolean;
    managerApproved: boolean;
    noHighRiskWithoutOverride: boolean;
    hasOffer: boolean;
  };
  errors: string[];
  details?: Record<string, unknown>;
}

export const governanceService = {
  async validateOfferEligibility(candidateId: string): Promise<GovernanceResult> {
    const errors: string[] = [];
    const checks = {
      allFeedbackSubmitted: false,
      allFeedbackSignedOff: false,
      managerApproved: false,
      noHighRiskWithoutOverride: false,
      hasOffer: false,
    };

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        interviews: { include: { feedback: true } },
        approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
        offers: true,
      },
    });

    if (!candidate) {
      return {
        canRelease: false,
        status: 'locked',
        checks,
        errors: ['Candidate not found'],
      };
    }

    const offer = candidate.offers[0];
    checks.hasOffer = !!offer;
    if (!offer) {
      errors.push('No offer exists for this candidate');
    }

    const interviews = candidate.interviews;
    const allFeedbackSubmitted = interviews.every((i) => i.feedbackStatus === 'submitted');
    checks.allFeedbackSubmitted = allFeedbackSubmitted;
    if (!allFeedbackSubmitted) {
      const pending = interviews.filter((i) => i.feedbackStatus !== 'submitted');
      errors.push(
        `Pending feedback from interviews: ${pending.map((p) => p.roundName).join(', ')}`
      );
    }

    const feedbacks = interviews
      .map((i) => i.feedback)
      .filter((f): f is NonNullable<typeof f> => f !== null);
    const allSignedOff = feedbacks.length > 0 && feedbacks.every((f) => f.signedOff);
    checks.allFeedbackSignedOff = allSignedOff;
    if (!allSignedOff && feedbacks.length > 0) {
      const unsigned = feedbacks.filter((f) => !f.signedOff);
      errors.push(`${unsigned.length} feedback(s) not digitally signed off`);
    }

    const latestApproval = candidate.approvals[0];
    const managerApproved = latestApproval?.status === 'approved';
    checks.managerApproved = managerApproved;
    if (!managerApproved) {
      errors.push('Hiring manager approval required');
    }

    const hasHighRisk = feedbacks.some((f) => f.riskLevel === RiskLevel.high);
    checks.noHighRiskWithoutOverride = !hasHighRisk || !!managerApproved;
    if (hasHighRisk && !managerApproved) {
      errors.push('High risk feedback requires manager override approval');
    }

    const canRelease =
      checks.allFeedbackSubmitted &&
      checks.allFeedbackSignedOff &&
      checks.managerApproved &&
      checks.noHighRiskWithoutOverride &&
      checks.hasOffer;

    return {
      canRelease,
      status: canRelease ? 'ready' : 'locked',
      checks,
      errors,
      details: {
        totalInterviews: interviews.length,
        totalFeedbacks: feedbacks.length,
        signedOffCount: feedbacks.filter((f) => f.signedOff).length,
      },
    };
  },
};
