import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { legalDocument } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { LegalDocument, type LegalDocType } from '../../domain/entities/legal-document.entity';
import type { LegalDocumentRepository } from '../../domain/ports/legal.repository';

type LegalDocumentRow = typeof legalDocument.$inferSelect;

/** Adapter Drizzle del puerto LegalDocumentRepository. */
@Injectable()
export class DrizzleLegalDocumentRepository implements LegalDocumentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<LegalDocument | null> {
    const [row] = await this.db
      .select()
      .from(legalDocument)
      .where(eq(legalDocument.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findCurrent(docType: LegalDocType): Promise<LegalDocument | null> {
    const [row] = await this.db
      .select()
      .from(legalDocument)
      .where(and(eq(legalDocument.docType, docType), eq(legalDocument.isCurrent, true)))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  /** Atómico: supersede el vigente del tipo e inserta el nuevo (invariante 1 current/tipo). */
  async publish(next: LegalDocument): Promise<LegalDocument> {
    return this.db.transaction(async (tx) => {
      await tx
        .update(legalDocument)
        .set({ isCurrent: false })
        .where(and(eq(legalDocument.docType, next.docType), eq(legalDocument.isCurrent, true)));

      const [row] = await tx
        .insert(legalDocument)
        .values({
          id: next.id,
          docType: next.docType,
          version: next.version,
          contentUrl: next.contentUrl,
          isCurrent: true,
          publishedAt: next.publishedAt,
        })
        .returning();
      if (!row) throw new Error('No se pudo publicar el documento legal');
      return this.toDomain(row);
    });
  }

  private toDomain(row: LegalDocumentRow): LegalDocument {
    return LegalDocument.fromPersistence({
      id: row.id,
      docType: row.docType as LegalDocType,
      version: row.version,
      contentUrl: row.contentUrl,
      isCurrent: row.isCurrent,
      publishedAt: row.publishedAt,
    });
  }
}
