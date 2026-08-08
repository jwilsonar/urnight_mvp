/**
 * Claves de caché centralizadas de TanStack Query. Punto único para
 * invalidación cruzada entre módulos.
 */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  mfaStatus: ['auth', 'mfa-status'] as const,
  /** Favoritos del usuario autenticado (compartido por todos los FavoriteButton). */
  favorites: ['identity', 'favorites', 'me'] as const,
  /** Canjes de promo del usuario autenticado (#13). */
  myRedemptions: ['promoters', 'redemptions', 'me'] as const,
  /** Empresas de la plataforma (super_admin, #16). */
  companies: ['companies', 'all'] as const,
  /** Empresa del actor (admin, #29). */
  myCompany: ['companies', 'me'] as const,
  zones: ['catalog', 'zones'] as const,
  musicGenres: ['catalog', 'music-genres'] as const,
  tags: ['catalog', 'tags'] as const,
  locals: (zoneId?: string) => ['companies', 'locals', { zoneId }] as const,
  local: (slug: string) => ['companies', 'local', slug] as const,
  /** Locales de la empresa del actor (panel admin, scoped por tenant). */
  myLocals: ['companies', 'locals', 'mine'] as const,
  /** Promotores de la empresa del actor (panel admin, scoped por tenant). */
  myPromoters: ['promoters', 'mine'] as const,
  localImages: (localId: string) => ['companies', 'local-images', localId] as const,
  menuCategories: (localId: string) =>
    ['menu', localId, 'categories'] as const,
  menuProducts: (localId: string) => ['menu', localId, 'products'] as const,
  menuProduct: (localId: string, productId: string) =>
    ['menu', localId, 'products', productId] as const,
  localOrderWindows: (localId: string) =>
    ['menu', localId, 'order-windows'] as const,
  localOrder: (orderId: string) => ['orders', 'local', orderId] as const,
  localVerificationDocuments: (localId: string) =>
    ['companies', 'local-verification-documents', localId] as const,
  pendingLocalVerificationDocuments: [
    'companies',
    'local-verification-documents',
    'pending',
  ] as const,
  events: (localId?: string) => ['events', 'list', { localId }] as const,
  event: (slug: string) => ['events', 'event', slug] as const,
  ticketTypes: (eventId: string) => ['events', 'ticket-types', eventId] as const,
  promoterSales: (promoterId: string) => ['promoters', 'sales', promoterId] as const,
  promoterMetricsMe: (filter: Record<string, unknown> = {}) => ['promoters', 'metrics', 'me', filter] as const,
  promoterRanking: (filter: Record<string, unknown>) => ['promoters', 'ranking', filter] as const,
  promoterAssociations: ['promoters', 'associations', 'me'] as const,
  /** Promotor activo del usuario de sesión (panel promotor). */
  myPromoter: ['promoters', 'me'] as const,
  /** Asignaciones de un promotor (vista admin). */
  promoterAssignments: (promoterId: string) => ['promoters', 'assignments', promoterId] as const,
  /** Eventos asignados al promotor de sesión. */
  myAssignments: ['promoters', 'assignments', 'me'] as const,
  /** Códigos de canje de una asignación (gestión del promotor). */
  redemptionCodes: (promoterEventId: string) => ['promoters', 'redemption-codes', promoterEventId] as const,
  platformSetting: (key: string) => ['ops', 'platform-setting', key] as const,
  notificationsMe: ['ops', 'notifications', 'me'] as const,
} as const;
