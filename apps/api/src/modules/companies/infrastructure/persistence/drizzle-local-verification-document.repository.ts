import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  local,
  localVerification,
  localVerificationDocument,
} from '@urnight/db';
import type {
  LocalDocumentReviewStatus,
  LocalDocumentType,
} from '@urnight/contracts';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import { LocalVerificationDocument } from '../../domain/entities/local-verification-document.entity';
import type {
  LocalVerificationDocumentContext,
  LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';

type Row = typeof localVerificationDocument.$inferSelect;

@Injectable()
export class DrizzleLocalVerificationDocumentRepository
  implements LocalVerificationDocumentRepository
{
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(
    document: LocalVerificationDocument,
  ): Promise<LocalVerificationDocument> {
    const [row] = await this.db
      .insert(localVerificationDocument)
      .values({
        id: document.id,
        localVerificationId: document.verificationId,
        documentType: document.documentType,
        storageKey: document.storageKey,
        issuedAt: document.issuedAt,
        expiresAt: document.expiresAt,
        reviewStatus: document.reviewStatus,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el documento de verificación');
    return this.toDomain(row);
  }

  async update(
    document: LocalVerificationDocument,
  ): Promise<LocalVerificationDocument> {
    const [row] = await this.db
      .update(localVerificationDocument)
      .set({
        reviewStatus: document.reviewStatus,
        reviewedBy: document.reviewedBy,
        reviewedAt: document.reviewedAt,
        reviewNotes: document.reviewNotes,
        updatedAt: document.updatedAt,
      })
      .where(eq(localVerificationDocument.id, document.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el documento de verificación');
    return this.toDomain(row);
  }

  async findByIdWithContext(
    id: string,
  ): Promise<LocalVerificationDocumentContext | null> {
    const [row] = await this.contextQuery()
      .where(eq(localVerificationDocument.id, id))
      .limit(1);
    return row ? this.toContext(row) : null;
  }

  async listByLocalId(
    localId: string,
  ): Promise<LocalVerificationDocumentContext[]> {
    const rows = await this.contextQuery()
      .where(eq(localVerification.localId, localId))
      .orderBy(desc(localVerificationDocument.createdAt));
    return rows.map((row) => this.toContext(row));
  }

  async listPending(): Promise<LocalVerificationDocumentContext[]> {
    const rows = await this.contextQuery()
      .where(eq(localVerificationDocument.reviewStatus, 'pending'))
      .orderBy(desc(localVerificationDocument.createdAt));
    return rows.map((row) => this.toContext(row));
  }

  private contextQuery() {
    return this.db
      .select({
        document: localVerificationDocument,
        localId: local.id,
        localName: local.name,
        companyId: local.companyId,
      })
      .from(localVerificationDocument)
      .innerJoin(
        localVerification,
        eq(localVerificationDocument.localVerificationId, localVerification.id),
      )
      .innerJoin(local, eq(localVerification.localId, local.id));
  }

  private toContext(row: {
    document: Row;
    localId: string;
    localName: string;
    companyId: string;
  }): LocalVerificationDocumentContext {
    return { ...row, document: this.toDomain(row.document) };
  }

  private toDomain(row: Row): LocalVerificationDocument {
    return LocalVerificationDocument.fromPersistence({
      id: row.id,
      verificationId: row.localVerificationId,
      documentType: row.documentType as LocalDocumentType,
      storageKey: row.storageKey,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      reviewStatus: row.reviewStatus as LocalDocumentReviewStatus,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt,
      reviewNotes: row.reviewNotes,
      expiryWarningSentAt: row.expiryWarningSentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
