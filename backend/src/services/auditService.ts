import { prisma } from '../lib/prisma';

export interface AuditPayload {
  entityType: string;
  entityId: string;
  action: string;
  performedById?: string;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  async log(payload: AuditPayload): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        performedById: payload.performedById,
        metadata: payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : undefined,
      },
    });
  },
};
