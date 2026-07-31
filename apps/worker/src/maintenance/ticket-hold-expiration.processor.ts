import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { UnrecoverableError, type Job, type Queue } from 'bullmq';
import { and, eq, inArray, isNull, lte } from 'drizzle-orm';
import {
  local,
  localVerification,
  localVerificationDocument,
  platformSetting,
  role,
  ticketHold,
  user,
  userRole,
  type Database,
} from '@urnight/db';
import { DB } from '../db/db.module';
import { createLogger } from '../logging/logger';

type LocalDocumentType =
  | 'municipal_license'
  | 'itse_certificate'
  | 'health_certificate';

/** Limpieza activa complementaria a la expiración perezosa de disponibilidad. */
@Processor('maintenance')
export class TicketHoldExpirationProcessor extends WorkerHost {
  private readonly log = createLogger(TicketHoldExpirationProcessor.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @InjectQueue('notifications') private readonly notifications: Queue,
  ) {
    super();
  }

  async process(
    job: Job,
  ): Promise<{ expired: number } | { degraded: number; warningsQueued: number }> {
    if (job.name === 'maintain-local-verifications') {
      return this.maintainLocalVerifications();
    }
    if (job.name !== 'expire-ticket-holds') {
      throw new UnrecoverableError(
        `Job de mantenimiento desconocido: ${job.name}`,
      );
    }
    const now = new Date();
    const expired = await this.db
      .update(ticketHold)
      .set({ status: 'expired', updatedAt: now })
      .where(
        and(
          eq(ticketHold.status, 'active'),
          lte(ticketHold.expiresAt, now),
        ),
      )
      .returning({ id: ticketHold.id });
    this.log.info(
      { expired: expired.length },
      'worker.ticket_holds.expired',
    );
    return { expired: expired.length };
  }

  private async maintainLocalVerifications(): Promise<{
    degraded: number;
    warningsQueued: number;
  }> {
    const settings = await this.db
      .select({ key: platformSetting.key, value: platformSetting.value })
      .from(platformSetting)
      .where(
        inArray(platformSetting.key, [
          'verification_required_document_types',
          'verification_expiry_warning_days',
        ]),
      );
    const requiredTypes = requiredDocumentTypes(
      settings.find((setting) => setting.key === 'verification_required_document_types')
        ?.value,
    );
    const warningDays = warningWindowDays(
      settings.find((setting) => setting.key === 'verification_expiry_warning_days')
        ?.value,
    );
    const documents = await this.db
      .select({
        id: localVerificationDocument.id,
        localId: local.id,
        companyId: local.companyId,
        localName: local.name,
        documentType: localVerificationDocument.documentType,
        expiresAt: localVerificationDocument.expiresAt,
        warningSentAt: localVerificationDocument.expiryWarningSentAt,
      })
      .from(localVerificationDocument)
      .innerJoin(
        localVerification,
        eq(localVerificationDocument.localVerificationId, localVerification.id),
      )
      .innerJoin(local, eq(localVerification.localId, local.id))
      .where(eq(localVerificationDocument.reviewStatus, 'approved'));

    const today = dateOnly(new Date());
    const warningLimit = new Date(`${today}T00:00:00.000Z`);
    warningLimit.setUTCDate(warningLimit.getUTCDate() + warningDays);
    const warningLimitDate = dateOnly(warningLimit);

    const currentByLocalAndType = new Map<string, (typeof documents)[number]>();
    for (const document of documents) {
      const key = `${document.localId}:${document.documentType}`;
      const current = currentByLocalAndType.get(key);
      if (!current || document.expiresAt > current.expiresAt) {
        currentByLocalAndType.set(key, document);
      }
    }

    let warningsQueued = 0;
    for (const document of currentByLocalAndType.values()) {
      if (
        !requiredTypes.includes(document.documentType as LocalDocumentType) ||
        document.warningSentAt ||
        document.expiresAt < today ||
        document.expiresAt > warningLimitDate
      ) {
        continue;
      }
      const recipients = await this.db
        .select({ userId: user.id, email: user.email })
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .innerJoin(user, eq(userRole.userId, user.id))
        .where(
          and(
            eq(userRole.companyId, document.companyId),
            eq(userRole.isActive, true),
            eq(role.code, 'admin_local'),
          ),
        );
      if (recipients.length === 0) continue;
      for (const recipient of recipients) {
        await this.notifications.add(
          'send-local-document-expiry-warning',
          {
            documentId: document.id,
            userId: recipient.userId,
            email: recipient.email,
            localName: document.localName,
            documentType: document.documentType,
            expiresAt: document.expiresAt,
          },
          { jobId: `local-doc-expiry-${document.id}-${recipient.userId}` },
        );
        warningsQueued += 1;
      }
      await this.db
        .update(localVerificationDocument)
        .set({ expiryWarningSentAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(localVerificationDocument.id, document.id),
            isNull(localVerificationDocument.expiryWarningSentAt),
          ),
        );
    }

    const localIds = [...new Set(documents.map((document) => document.localId))];
    let degraded = 0;
    for (const localId of localIds) {
      const isCurrent = requiredTypes.every((documentType) => {
        const document = currentByLocalAndType.get(`${localId}:${documentType}`);
        return Boolean(document && document.expiresAt >= today);
      });
      if (isCurrent) continue;
      const changed = await this.db
        .update(local)
        .set({ isVerified: false, updatedAt: new Date() })
        .where(and(eq(local.id, localId), eq(local.isVerified, true)))
        .returning({ id: local.id });
      degraded += changed.length;
    }
    this.log.info(
      { degraded, warningsQueued },
      'worker.local_verifications.maintained',
    );
    return { degraded, warningsQueued };
  }
}

function requiredDocumentTypes(value?: string): LocalDocumentType[] {
  try {
    const parsed: unknown = value ? JSON.parse(value) : null;
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(
        (item): item is LocalDocumentType =>
          item === 'municipal_license' ||
          item === 'itse_certificate' ||
          item === 'health_certificate',
      );
      if (valid.length > 0) return [...new Set(valid)];
    }
  } catch {
    // Un setting inválido no debe desactivar controles regulatorios.
  }
  return ['municipal_license', 'itse_certificate'];
}

function warningWindowDays(value?: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 180 ? parsed : 30;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
