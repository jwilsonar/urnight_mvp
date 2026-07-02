# Backend S3 con lock nativo (TF >= 1.10) — sin DynamoDB.
# El nombre del bucket incluye el account id, así que se pasa en el init:
#
#   terraform init \
#     -backend-config="bucket=urnight-tfstate-<ACCOUNT_ID>" \
#     -backend-config="region=us-east-1"

terraform {
  backend "s3" {
    key          = "main.tfstate"
    use_lockfile = true
    encrypt      = true
  }
}
