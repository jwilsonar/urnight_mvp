output "assets_bucket" {
  value = aws_s3_bucket.assets.bucket
}

output "cdn_url" {
  value = "https://${aws_cloudfront_distribution.assets.domain_name}"
}
