variable "env" {
  type        = string
  description = "staging | prod"
}

variable "account_id" {
  type = string
}

variable "region" {
  type = string
}

variable "redis_db" {
  type        = number
  description = "Índice de DB en el Redis compartido del host (0=prod, 1=staging)."
}

variable "web_public_url" {
  type        = string
  description = "URL pública de la web del entorno (https://app.dominio / https://staging.dominio)."
}

variable "api_public_url" {
  type        = string
  description = "URL pública de la API del entorno."
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Orígenes permitidos: CORS de la API y CORS del bucket (presigned PUT desde el browser)."
}

variable "force_destroy" {
  type    = bool
  default = false
}
