# Bucket de assets del entorno (docs/uploads-strategy.md):
# - prefijos públicos locals/ events/ users/ → servidos vía CloudFront (OAC)
# - prefijos privados verifications/ tickets/ → solo presigned GET directo a S3
# - tmp/ → destino de presigned PUT; huérfanos expiran a las 24h

resource "aws_s3_bucket" "assets" {
  bucket        = "urnight-assets-${var.env}-${var.account_id}"
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  # El browser sube directo a S3 con presigned PUT (la API solo firma).
  cors_rule {
    allowed_origins = var.cors_allowed_origins
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "tmp-24h"
    status = "Enabled"
    filter {
      prefix = "tmp/"
    }
    expiration {
      days = 1
    }
  }

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Solo CloudFront puede leer, y únicamente los prefijos públicos. Los privados
# quedan accesibles solo con URLs firmadas por la app (SigV4 directo a S3).
data "aws_iam_policy_document" "assets_cdn" {
  statement {
    sid     = "CloudFrontReadPublicPrefixes"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.assets.arn}/locals/*",
      "${aws_s3_bucket.assets.arn}/events/*",
      "${aws_s3_bucket.assets.arn}/users/*",
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.assets.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets_cdn.json
}
