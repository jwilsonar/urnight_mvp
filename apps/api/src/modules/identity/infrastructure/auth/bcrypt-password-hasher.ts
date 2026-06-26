import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';

/**
 * Adapter de hashing con bcryptjs (JS puro, sin binarios nativos → portable en
 * Windows/CI). Implementa el puerto PasswordHasher (ACL).
 */
@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  private readonly rounds = 12;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
