# Bundle de host (compose files, Caddyfile, scripts) que sube cada deploy:
# host/<sha>/ (versionado por commit) + host/latest/ (bootstrap de cloud-init).

resource "aws_s3_bucket" "artifacts" {
  bucket = "urnight-deploy-artifacts-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  # Los bundles son KBs; solo se limpian multiparts huérfanos. host/latest/
  # nunca expira (cloud-init depende de él para re-provisionar la instancia).
  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
