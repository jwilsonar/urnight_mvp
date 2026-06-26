/** Perfil normalizado devuelto por el IdP de Google (OIDC). */
export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}

/**
 * Puerto secundario (ACL): verificación del ID token de Google. La
 * implementación (google-auth-library) vive en infrastructure y aísla el SDK
 * externo del dominio.
 */
export abstract class GoogleVerifier {
  abstract verify(idToken: string): Promise<GoogleProfile>;
}
