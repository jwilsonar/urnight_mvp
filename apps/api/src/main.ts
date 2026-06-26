import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './openapi/build-document';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logs estructurados (pino) como logger de Nest.
  app.useLogger(app.get(Logger));

  // REST versionado: /api/v1 (§5).
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Documentación OpenAPI generada desde los contratos Zod. UI en /docs, JSON en /docs-json.
  // Montada en el adapter HTTP (fuera del pipeline de guards) → pública.
  SwaggerModule.setup('docs', app, buildOpenApiDocument() as unknown as OpenAPIObject, {
    jsonDocumentUrl: 'docs-json',
  });

  app.enableCors();
  app.enableShutdownHooks();

  // Puerto dev por defecto alineado con ADR-0001 y los clientes (web/mobile/
  // validator usan :3101). En prod, PORT del entorno tiene prioridad.
  const port = process.env.PORT ?? 3101;
  await app.listen(port);
  app.get(Logger).log(`API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
