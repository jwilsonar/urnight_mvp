import type { Promoter } from '../entities/promoter.entity';
import type { ReferralLink } from '../entities/referral-link.entity';

export interface PromoterRepository {
  /** Crea promotor + su referral link en una operación (Tx). */
  create(promoter: Promoter, link: ReferralLink, tx?: unknown): Promise<void>;
  /** Crea un promotor en estado `pending` (invitación) SIN link de referido. */
  createPending(promoter: Promoter, tx?: unknown): Promise<void>;
  /** Persiste cambios del aggregate (userId, status). */
  update(promoter: Promoter, tx?: unknown): Promise<void>;
  /** Inserta el referral link al confirmar la asociación. */
  addLink(link: ReferralLink, tx?: unknown): Promise<void>;
  findById(id: string): Promise<Promoter | null>;
  /** Promotor ACTIVO ligado a un usuario (resuelve sesión → promotor). */
  findActiveByUserId(userId: string): Promise<Promoter | null>;
  /** Lectura admin: promotores de una empresa. null = todas (super_admin). */
  listByCompany(companyId: string | null): Promise<Promoter[]>;
  /** Asociaciones `pending` dirigidas a un usuario (por su id o su correo). */
  findPendingForActor(userId: string, email: string | null): Promise<Promoter[]>;
  getLink(promoterId: string): Promise<ReferralLink | null>;
}

export const PROMOTER_REPOSITORY = Symbol('PROMOTER_REPOSITORY');
