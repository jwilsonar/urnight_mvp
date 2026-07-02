# Parámetros del entorno bajo /urnight/<env>/. render-env.sh (host) los vuelca
# a /opt/urnight/<env>/.env en cada deploy.
#
# Strings: valores derivados de la infra — Terraform es la fuente de verdad.
# SecureStrings: placeholders "CHANGEME" + ignore_changes; los valores reales
# se cargan una vez con `aws ssm put-parameter --overwrite` y nunca entran al
# estado. La API valida env al arrancar (Zod) → un deploy con placeholders
# falla visible, no silencioso.

locals {
  plain_params = {
    NODE_ENV       = "production"
    PORT           = "3101"
    AWS_REGION     = var.region
    S3_BUCKET      = aws_s3_bucket.assets.bucket
    S3_PUBLIC_URL  = "https://${aws_cloudfront_distribution.assets.domain_name}"
    CORS_ORIGIN    = join(",", var.cors_allowed_origins)
    TRUST_PROXY    = "1" # un salto: Caddy
    REDIS_URL      = "redis://redis:6379/${var.redis_db}"
    WEB_PUBLIC_URL = var.web_public_url
    # NextAuth v5 detrás de reverse proxy necesita su URL canónica.
    AUTH_URL        = var.web_public_url
    AUTH_TRUST_HOST = "true"
    # AWS_ENDPOINT se omite a propósito: el default '' del schema = AWS real.
  }

  secret_params = toset([
    "DATABASE_URL", # postgres://urnight_<env>:<pass>@postgres:5432/urnight_<env>
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "GOOGLE_CLIENT_ID",
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AWS_ACCESS_KEY_ID",     # ver iam.tf — se crea manual
    "AWS_SECRET_ACCESS_KEY", # ver iam.tf — se crea manual
  ])
}

resource "aws_ssm_parameter" "plain" {
  for_each = local.plain_params

  name  = "/urnight/${var.env}/${each.key}"
  type  = "String"
  value = each.value
}

resource "aws_ssm_parameter" "secret" {
  for_each = local.secret_params

  name  = "/urnight/${var.env}/${each.key}"
  type  = "SecureString"
  value = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}
