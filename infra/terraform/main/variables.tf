variable "region" {
  type    = string
  default = "us-east-1"
}

variable "domain" {
  type        = string
  description = "Dominio raíz (ej. urnight.app). Subdominios: app, api, staging, api-staging."
}

variable "create_hosted_zone" {
  type        = bool
  default     = true
  description = "true crea la zona Route53 (apuntar los NS del registrador a ella); false usa una zona ya existente con ese dominio."
}

variable "github_repo" {
  type        = string
  default     = "jwilsonar/urnight_mvp"
  description = "owner/repo de GitHub para el trust OIDC."
}

variable "instance_type" {
  type    = string
  default = "t4g.small" # escape hatch: t4g.medium si 2GB quedan cortos
}

variable "root_volume_gb" {
  type    = number
  default = 16
}

variable "data_volume_gb" {
  type        = number
  default     = 12
  description = "Volumen EBS aparte para datos persistentes (Postgres, Redis, certs de Caddy). Sobrevive al reemplazo de la instancia."
}

variable "compose_version" {
  type        = string
  default     = "v2.39.4"
  description = "Versión del plugin docker compose instalado por cloud-init."
}
