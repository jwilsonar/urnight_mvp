import type { DefaultSession } from 'next-auth';
import type { UserProfileResponse } from '@urnight/contracts';

/**
 * Augmentación de tipos de NextAuth: la sesión expone el access token del
 * backend y el perfil/roles para RBAC en cliente. Los tokens crudos viven en el
 * JWT (cookie cifrada), nunca en el objeto Session salvo el accessToken.
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: 'RefreshAccessTokenError';
    user: {
      id?: string;
      roles?: string[];
      onboardingCompleted?: boolean;
      /** Scope multi-tenant del actor (de los claims del access token). */
      companyId?: string | null;
      localId?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Epoch en segundos del vencimiento del access token. */
    accessTokenExpires?: number;
    roles?: string[];
    profile?: UserProfileResponse;
    error?: 'RefreshAccessTokenError';
  }
}
