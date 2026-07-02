# Subdominios → EIP del host. Caddy emite los certificados (Let's Encrypt),
# así que no hace falta ACM para el origen.

resource "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 1 : 0
  name  = var.domain
}

data "aws_route53_zone" "existing" {
  count = var.create_hosted_zone ? 0 : 1
  name  = var.domain
}

locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.existing[0].zone_id

  subdomains = {
    "app"         = "web prod"
    "api"         = "api prod"
    "staging"     = "web staging"
    "api-staging" = "api staging"
  }
}

resource "aws_route53_record" "subdomain" {
  for_each = local.subdomains

  zone_id = local.zone_id
  name    = "${each.key}.${var.domain}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.host.public_ip]
}
