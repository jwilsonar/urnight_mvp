# Usuario IAM por entorno para la app (env.schema.ts exige llaves estáticas en
# prod; follow-up: hacerlas opcionales y usar el instance profile).
# La access key se crea MANUALMENTE para que el secreto no toque el estado:
#
#   aws iam create-access-key --user-name urnight-app-<env>
#   aws ssm put-parameter --overwrite --type SecureString \
#     --name /urnight/<env>/AWS_ACCESS_KEY_ID --value '<AccessKeyId>'
#   aws ssm put-parameter --overwrite --type SecureString \
#     --name /urnight/<env>/AWS_SECRET_ACCESS_KEY --value '<SecretAccessKey>'

resource "aws_iam_user" "app" {
  name = "urnight-app-${var.env}"
}

data "aws_iam_policy_document" "app" {
  statement {
    sid       = "BucketList"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.assets.arn]
  }

  statement {
    sid    = "ObjectsRW"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
    ]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
  }
}

resource "aws_iam_user_policy" "app" {
  name   = "assets-bucket"
  user   = aws_iam_user.app.name
  policy = data.aws_iam_policy_document.app.json
}
