import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/auth.types';

type AuditEntryInput = {
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
  actor?: AuthenticatedUser | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntryInput) {
    await this.prisma.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        summary: entry.summary,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        actorId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        actorRole: entry.actor?.role ?? null,
      },
    });
  }

  async listRecent(limit = 12) {
    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
