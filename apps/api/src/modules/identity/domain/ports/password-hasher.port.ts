/**
 * Puerto secundario (ACL): hashing de contraseñas. El algoritmo concreto
 * (bcrypt/argon2) vive en infrastructure y nunca toca el dominio.
 */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(hash: string, plain: string): Promise<boolean>;
}
