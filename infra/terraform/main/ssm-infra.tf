# Secretos del stack de infraestructura del host (compose.infra.yml).
# Terraform siembra placeholders; los valores reales se cargan UNA VEZ:
#
#   aws ssm put-parameter --overwrite --type SecureString \
#     --name /urnight/infra/POSTGRES_PASSWORD --value '<real>'
#
# ignore_changes evita que un apply posterior pise el valor real, y los
# secretos nunca tocan el estado de Terraform.

resource "aws_ssm_parameter" "infra_secret" {
  for_each = toset([
    "POSTGRES_PASSWORD",         # superusuario del contenedor postgres
    "POSTGRES_STAGING_PASSWORD", # rol urnight_staging (creado por init script)
    "POSTGRES_PROD_PASSWORD",    # rol urnight_prod (creado por init script)
  ])

  name  = "/urnight/infra/${each.key}"
  type  = "SecureString"
  value = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}
