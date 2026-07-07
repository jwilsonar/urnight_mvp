# Infraestructura UrNight — Terraform

Una instancia EC2 ARM (t4g.small) con Docker Compose hostea **staging y
producción** detrás de Caddy (TLS automático). Postgres 16 y Redis 7 corren
como contenedores compartidos (DB / db-index separados por entorno). S3 +
CloudFront por entorno, ECR para imágenes, SSM Parameter Store para secretos,
deploys vía SSM Run Command, auth de GitHub Actions vía OIDC (cero llaves
estáticas). Costo estimado: **≈$21.5/mes** (us-east-1).

```
bootstrap/    estado remoto (bucket S3) — aplicar UNA vez, estado local
main/         todo lo demás — backend S3 con lock nativo (TF ≥ 1.10)
modules/env/  recursos por entorno (S3, CloudFront, SSM, IAM user)
```

## Primer despliegue (manual, una vez)

Requisitos: Terraform ≥ 1.10, AWS CLI con credenciales de admin, un dominio.

```sh
# 1. Estado remoto
cd infra/terraform/bootstrap
terraform init && terraform apply
terraform output tfstate_bucket        # → urnight-tfstate-<ACCOUNT_ID>

# 2. Infra principal
cd ../main
cat > terraform.tfvars <<EOF
domain = "tudominio.com"
EOF
terraform init \
  -backend-config="bucket=urnight-tfstate-<ACCOUNT_ID>" \
  -backend-config="region=us-east-1"
terraform apply

# 3. DNS: apuntar los NS del registrador a `terraform output name_servers`
#    (o create_hosted_zone=false si la zona ya existe en Route53).
```

## Secretos (SSM Parameter Store)

Terraform siembra SecureStrings con valor `CHANGEME` y NO los vuelve a tocar
(`ignore_changes`). Cargar los reales una vez — nunca entran al estado ni a
GitHub:

```sh
# Infra (passwords de Postgres; inventarlos fuertes)
aws ssm put-parameter --overwrite --type SecureString --name /urnight/infra/POSTGRES_PASSWORD         --value '...'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/infra/POSTGRES_STAGING_PASSWORD --value '...'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/infra/POSTGRES_PROD_PASSWORD    --value '...'

# Por entorno (repetir con /urnight/prod/)
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/DATABASE_URL \
  --value 'postgres://urnight_staging:<POSTGRES_STAGING_PASSWORD>@postgres:5432/urnight_staging'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/JWT_SECRET         --value '<32+ chars>'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/JWT_REFRESH_SECRET --value '<32+ chars>'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/AUTH_SECRET        --value '<openssl rand -base64 32>'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/GOOGLE_CLIENT_ID   --value '<id o vacío-no: dejar CHANGEME deshabilita login Google>'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/AUTH_GOOGLE_ID     --value '...'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/AUTH_GOOGLE_SECRET --value '...'

# Llaves S3 de la app (usuario IAM creado por Terraform; key manual a propósito)
aws iam create-access-key --user-name urnight-app-staging
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/AWS_ACCESS_KEY_ID     --value '<AccessKeyId>'
aws ssm put-parameter --overwrite --type SecureString --name /urnight/staging/AWS_SECRET_ACCESS_KEY --value '<SecretAccessKey>'
```

La API valida el env al arrancar (Zod): con placeholders `CHANGEME` el deploy
falla visible, no silencioso.

## Variables de GitHub que salen de los outputs

| Output | Repository variable |
|---|---|
| `gha_deploy_role_arn` | `AWS_DEPLOY_ROLE_ARN` |
| `gha_terraform_role_arn` | `AWS_TF_ROLE_ARN` |
| `ecr_registry` | `ECR_REGISTRY` |
| `instance_id` | `EC2_INSTANCE_ID` |
| `staging_cdn_url` / `prod_cdn_url` | `STAGING_CDN_URL` / `PROD_CDN_URL` |
| — | `AWS_REGION`, `AWS_ACCOUNT_ID`, `DOMAIN`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |

## Verificación post-apply

```sh
aws ssm start-session --target $(terraform output -raw instance_id)   # sin SSH
sudo docker ps                                                        # infra stack (tras primer deploy del bundle)
dig +short app.tudominio.com                                          # → EIP
```

## Notas de operación

- **Acceso admin:** solo SSM Session Manager. El SG no abre el puerto 22.
- **AMI:** `ignore_changes = [ami]` — actualizar la instancia es decisión
  explícita (taint/replace), no un side-effect del plan.
- **Volumen de datos:** `prevent_destroy`; sobrevive al reemplazo de la
  instancia. Recovery: replace de la instancia + restore del último pg_dump
  (bucket `urnight-backups-*`). RTO < 30 min, RPO ≤ 24 h.
- **Escalar:** `instance_type = "t4g.medium"` en tfvars (stop/start ~2 min).
  Migrar a ECS/RDS/ElastiCache después no exige rediseño: las imágenes ya
  están en ECR y la config en SSM; es swap de URLs + Terraform.
- **CloudFront sin dominio custom** (*.cloudfront.net): evita el cert ACM en
  us-east-1. Agregar aliases + cert después es aditivo.
