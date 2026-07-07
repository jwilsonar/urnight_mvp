module "staging" {
  source = "../modules/env"

  env            = "staging"
  account_id     = local.account_id
  region         = var.region
  redis_db       = 1
  web_public_url = "https://staging.${var.domain}"
  api_public_url = "https://api-staging.${var.domain}"
  cors_allowed_origins = [
    "https://staging.${var.domain}",
    "http://localhost:3000", # pruebas locales contra staging
  ]
  force_destroy = true
}

module "production" {
  source = "../modules/env"

  env            = "prod"
  account_id     = local.account_id
  region         = var.region
  redis_db       = 0
  web_public_url = "https://app.${var.domain}"
  api_public_url = "https://api.${var.domain}"
  cors_allowed_origins = [
    "https://app.${var.domain}",
  ]
  force_destroy = false
}
