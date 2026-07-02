# pg_dump nocturno desde el host (cron 07:15 UTC, bin/backup.sh).
# RPO ≤ 24h; retención corta para mantener el costo en centavos.

resource "aws_s3_bucket" "backups" {
  bucket = "urnight-backups-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "prod-30d"
    status = "Enabled"
    filter {
      prefix = "prod/"
    }
    expiration {
      days = 30
    }
  }

  rule {
    id     = "staging-14d"
    status = "Enabled"
    filter {
      prefix = "staging/"
    }
    expiration {
      days = 14
    }
  }
}
