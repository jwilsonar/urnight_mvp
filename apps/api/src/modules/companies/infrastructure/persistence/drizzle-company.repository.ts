import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { company } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { Company, type CompanyStatus } from '../../domain/entities/company.entity';
import type { CompanyRepository } from '../../domain/ports/company.repository';

type Row = typeof company.$inferSelect;

@Injectable()
export class DrizzleCompanyRepository implements CompanyRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findById(id: string): Promise<Company | null> {
    const [row] = await this.db.select().from(company).where(eq(company.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByRuc(ruc: string): Promise<Company | null> {
    const [row] = await this.db.select().from(company).where(eq(company.ruc, ruc)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(entity: Company, tx?: unknown): Promise<Company> {
    const [row] = await this.exec(tx)
      .insert(company)
      .values({
        id: entity.id,
        legalName: entity.legalName,
        ruc: entity.ruc,
        commercialName: entity.commercialName,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        status: entity.status,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la empresa');
    return this.toDomain(row);
  }

  async update(entity: Company): Promise<Company> {
    const [row] = await this.db
      .update(company)
      .set({
        commercialName: entity.commercialName,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        status: entity.status,
        updatedAt: new Date(),
      })
      .where(eq(company.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la empresa');
    return this.toDomain(row);
  }

  async list(): Promise<Company[]> {
    const rows = await this.db.select().from(company);
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: Row): Company {
    return Company.fromPersistence({
      id: row.id,
      legalName: row.legalName,
      ruc: row.ruc,
      commercialName: row.commercialName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      status: row.status as CompanyStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
