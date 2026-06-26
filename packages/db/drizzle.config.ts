import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// .env vive en la raíz del monorepo; el cwd al correr scripts es packages/db.
config({ path: '../../.env' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
