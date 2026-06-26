#!/bin/bash
# LocalStack init hook — corre cuando S3 está listo (ready.d).
# Crea el bucket de dev local de forma idempotente y le aplica CORS para
# permitir subidas/descargas directas desde el navegador con URLs firmadas (§5).
set -euo pipefail

BUCKET="${S3_BUCKET:-urnight-local}"

# Crear bucket (idempotente: si ya existe, no falla).
awslocal s3 mb "s3://${BUCKET}" 2>/dev/null || true

# CORS abierto para dev (PUT/GET/HEAD desde cualquier origen).
awslocal s3api put-bucket-cors --bucket "${BUCKET}" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Lifecycle: los objetos de staging (subidos pero nunca confirmados) bajo tmp/
# expiran a 1 día → autolimpieza de huérfanos sin job de barrido.
awslocal s3api put-bucket-lifecycle-configuration --bucket "${BUCKET}" --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "expire-staging-tmp",
      "Status": "Enabled",
      "Filter": { "Prefix": "tmp/" },
      "Expiration": { "Days": 1 }
    }
  ]
}'

echo "[localstack-init] bucket S3 '${BUCKET}' listo (CORS + lifecycle tmp/)"
