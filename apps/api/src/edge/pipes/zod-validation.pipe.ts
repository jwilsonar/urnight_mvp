import { Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodError} from 'zod';
import { type ZodSchema } from 'zod';

/** Error de validación Zod — el ProblemJsonFilter lo mapea a 422. */
export class ZodValidationException extends Error {
  constructor(public readonly zodError: ZodError) {
    super('Validation failed');
    this.name = 'ZodValidationException';
  }
}

/**
 * Valida payloads contra un esquema Zod de `@urnight/contracts` (DTOs, reglas
 * 18+/documento). Uso por handler: `@Body(new ZodValidationPipe(schema))`.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ZodValidationException(result.error);
    }
    return result.data;
  }
}
