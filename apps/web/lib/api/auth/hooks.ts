'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { UserProfileResponse } from '@urnight/contracts';
import { apiFetch } from '../client';
import { queryKeys } from '../query-keys';

/**
 * Perfil del usuario autenticado. La sesión de NextAuth ya trae el perfil, pero
 * este hook permite refrescarlo bajo demanda (p. ej. tras onboarding) usando el
 * access token vigente de la sesión.
 */
export function useMe() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  return useQuery<UserProfileResponse>({
    queryKey: queryKeys.me,
    queryFn: () => apiFetch<UserProfileResponse>('/auth/me', { token }),
    enabled: status === 'authenticated' && Boolean(token),
    staleTime: 60_000,
  });
}
