import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';
import { buildOpenApiDocument } from './openapi/build-document';

/** `trust proxy` de Express desde env: `true`/`false`, número de saltos, o lista/subred. */
function parseTrustProxy(raw: string): boolean | number | string {
  if (raw === '' || raw.toLowerCase() === 'false') return false;
  if (raw.toLowerCase() === 'true') return true;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : raw;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Logs estructurados (pino) como logger de Nest.
  app.useLogger(app.get(Logger));

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const isProd = nodeEnv === 'production';

  // Confianza en el proxy inverso: usa la IP real (X-Forwarded-For) para el
  // rate-limit tras un balanceador/ingress. TRUST_PROXY vacío ⇒ prod=1 salto, dev=false (A3).
  const trustProxyRaw = config.get('TRUST_PROXY', { infer: true });
  app.set('trust proxy', trustProxyRaw === '' && isProd ? 1 : parseTrustProxy(trustProxyRaw));

  // Cabeceras de seguridad HTTP (M7). API JSON: sin CSP (que rompería Swagger)
  // y con COEP desactivado; el resto de defaults de helmet aplican (HSTS, nosniff,
  // frameguard, referrerPolicy…).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // REST versionado: /api/v1 (§5).
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Documentación OpenAPI: solo fuera de producción (B3). Montada en el adapter
  // HTTP (fuera del pipeline de guards); en prod no se expone /docs ni /docs-json.
  if (!isProd) {
    SwaggerModule.setup('docs', app, buildOpenApiDocument() as unknown as OpenAPIObject, {
      jsonDocumentUrl: 'docs-json',
    });
  }

  // CORS con allowlist por entorno (M6). `CORS_ORIGIN` = orígenes separados por
  // coma. Vacío en prod ⇒ ningún origen cross-site permitido.
  const origins = config
    .get('CORS_ORIGIN', { infer: true })
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.enableShutdownHooks();

  // Puerto dev por defecto alineado con ADR-0001 y los clientes (web/mobile/
  // validator usan :3101). En prod, PORT del entorno tiene prioridad.
  const port = process.env.PORT ?? 3101;
  await app.listen(port);
  app.get(Logger).log(`API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
