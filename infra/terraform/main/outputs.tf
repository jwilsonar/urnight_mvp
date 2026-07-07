output "instance_id" {
  value       = aws_instance.host.id
  description = "Variable de repo EC2_INSTANCE_ID en GitHub."
}

output "public_ip" {
  value = aws_eip.host.public_ip
}

output "ecr_registry" {
  value       = local.ecr_registry
  description = "Variable de repo ECR_REGISTRY en GitHub."
}

output "gha_deploy_role_arn" {
  value       = aws_iam_role.gha_deploy.arn
  description = "Variable de repo AWS_DEPLOY_ROLE_ARN en GitHub."
}

output "gha_terraform_role_arn" {
  value       = aws_iam_role.gha_terraform.arn
  description = "Variable de repo AWS_TF_ROLE_ARN en GitHub."
}

output "artifacts_bucket" {
  value = aws_s3_bucket.artifacts.bucket
}

output "backups_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "staging_cdn_url" {
  value       = module.staging.cdn_url
  description = "Variable de repo STAGING_CDN_URL en GitHub."
}

output "prod_cdn_url" {
  value       = module.production.cdn_url
  description = "Variable de repo PROD_CDN_URL en GitHub."
}

output "staging_assets_bucket" {
  value = module.staging.assets_bucket
}

output "prod_assets_bucket" {
  value = module.production.assets_bucket
}

output "name_servers" {
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : []
  description = "Apuntar los NS del registrador del dominio a estos."
}
