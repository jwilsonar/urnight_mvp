import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { Env } from '../../../../config/env.schema';
import { createLogger } from '../../../../shared/logging/logger';
import { GoogleTokenInvalidError } from '../../domain/errors/identity.errors';
import { GoogleVerifier, type GoogleProfile } from '../../domain/ports/google-verifier.port';

/**
 * Adapter google-auth-library del puerto GoogleVerifier (ACL). Verifica la firma
 * y la audiencia del ID token contra GOOGLE_CLIENT_ID; aísla el SDK del dominio.
 */
@Injectable()
export class GoogleOidcVerifier extends GoogleVerifier {
  private readonly log = createLogger(GoogleOidcVerifier.name);
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.clientId = config.getOrThrow('GOOGLE_CLIENT_ID', { infer: true });
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    if (!this.clientId) {
      this.log.warn({}, 'oauth.google.not_configured');
      throw new GoogleTokenInvalidError(); // login con Google no configurado
    }
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email) throw new Error('payload incompleto');
      this.log.debug({ sub: p.sub, emailVerified: p.email_verified ?? false }, 'oauth.google.verified');
      return {
        sub: p.sub,
        email: p.email,
        emailVerified: p.email_verified ?? false,
        name: p.name ?? p.email,
        picture: p.picture ?? null,
      };
    } catch (err) {
      this.log.warn({ err: (err as Error).message }, 'oauth.google.invalid');
      throw new GoogleTokenInvalidError();
    }
  }
}
