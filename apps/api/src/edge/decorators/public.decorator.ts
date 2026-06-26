import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un handler/controlador como público (omite AuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
