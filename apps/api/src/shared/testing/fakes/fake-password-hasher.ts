import { PasswordHasher } from '../../../modules/identity/domain/ports/password-hasher.port';

/** PasswordHasher determinista para tests: `hashed:<plain>`. Sin bcrypt. */
export class FakePasswordHasher extends PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
