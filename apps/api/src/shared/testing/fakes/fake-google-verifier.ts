import { GoogleTokenInvalidError } from '../../../modules/identity/domain/errors/identity.errors';
import {
  GoogleVerifier,
  type GoogleProfile,
} from '../../../modules/identity/domain/ports/google-verifier.port';

/**
 * GoogleVerifier de prueba: devuelve un perfil preconfigurado o lanza
 * GoogleTokenInvalidError si no hay perfil (fiel al adapter real, que traduce
 * cualquier fallo del SDK a ese error de dominio — ACL). Sin google-auth-library.
 */
export class FakeGoogleVerifier extends GoogleVerifier {
  constructor(private profile: GoogleProfile | null = null) {
    super();
  }

  setProfile(profile: GoogleProfile): this {
    this.profile = profile;
    return this;
  }

  async verify(_idToken: string): Promise<GoogleProfile> {
    if (!this.profile) throw new GoogleTokenInvalidError();
    return this.profile;
  }
}
