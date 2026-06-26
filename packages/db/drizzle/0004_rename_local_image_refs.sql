ALTER TABLE "local" RENAME COLUMN "main_image_url" TO "main_image_key";--> statement-breakpoint
ALTER TABLE "local_image" RENAME COLUMN "url" TO "storage_key";--> statement-breakpoint
--> Normaliza referencias legado: URLs absolutas del bucket propio (LocalStack/CDN)
--> a la key de S3, para que la URL pública se resuelva por entorno en lectura.
--> Las URLs externas (p. ej. picsum.photos) no coinciden y quedan intactas.
UPDATE "local" SET "main_image_key" = regexp_replace("main_image_key", '^https?://[^/]+/urnight-local/', '') WHERE "main_image_key" ~ '^https?://[^/]+/urnight-local/';--> statement-breakpoint
UPDATE "local_image" SET "storage_key" = regexp_replace("storage_key", '^https?://[^/]+/urnight-local/', '') WHERE "storage_key" ~ '^https?://[^/]+/urnight-local/';
