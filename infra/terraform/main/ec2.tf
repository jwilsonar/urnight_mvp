# Host único: corre Caddy + Postgres + Redis (compose.infra) y los stacks
# api/worker/web de staging y prod (compose.app ×2). Los datos persistentes
# viven en un volumen EBS aparte que sobrevive al reemplazo de la instancia.

data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # AZ fija para instancia y volumen de datos: evita el ciclo
  # instancia→volumen (user_data usa el volume id) / volumen→instancia (AZ).
  host_az = data.aws_availability_zones.available.names[0]
}

resource "aws_iam_role" "host" {
  name = "urnight-host"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Session Manager + Run Command (agente SSM preinstalado en AL2023).
resource "aws_iam_role_policy_attachment" "host_ssm" {
  role       = aws_iam_role.host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "host" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid       = "EcrPull"
    effect    = "Allow"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"]
    resources = [for r in aws_ecr_repository.app : r.arn]
  }

  statement {
    sid       = "ReadAppParams"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${local.account_id}:parameter/urnight/*"]
  }

  # SecureStrings usan la clave gestionada aws/ssm; el decrypt solo vale
  # cuando la llamada pasa por el servicio SSM.
  statement {
    sid       = "DecryptSsmSecureStrings"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.region}.amazonaws.com"]
    }
  }

  statement {
    sid       = "BackupsWrite"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:ListBucket", "s3:GetObject"]
    resources = [aws_s3_bucket.backups.arn, "${aws_s3_bucket.backups.arn}/*"]
  }

  statement {
    sid       = "ArtifactsRead"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.artifacts.arn, "${aws_s3_bucket.artifacts.arn}/*"]
  }
}

resource "aws_iam_role_policy" "host" {
  name   = "host"
  role   = aws_iam_role.host.id
  policy = data.aws_iam_policy_document.host.json
}

resource "aws_iam_instance_profile" "host" {
  name = "urnight-host"
  role = aws_iam_role.host.name
}

resource "aws_instance" "host" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.instance_type
  availability_zone      = local.host_az
  iam_instance_profile   = aws_iam_instance_profile.host.name
  vpc_security_group_ids = [aws_security_group.host.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = var.root_volume_gb
  }

  user_data = templatefile("${path.module}/../../cloud-init/user-data.sh.tftpl", {
    region           = var.region
    artifacts_bucket = aws_s3_bucket.artifacts.bucket
    compose_version  = var.compose_version
    data_volume_id   = aws_ebs_volume.data.id
  })

  tags = { Name = "urnight-host" }

  lifecycle {
    # El parámetro SSM del AMI cambia con cada release de AL2023; sin esto,
    # cada plan intentaría reemplazar la instancia.
    ignore_changes = [ami]
  }
}

resource "aws_eip" "host" {
  domain = "vpc"
  tags   = { Name = "urnight-host" }
}

resource "aws_eip_association" "host" {
  instance_id   = aws_instance.host.id
  allocation_id = aws_eip.host.id
}

resource "aws_ebs_volume" "data" {
  availability_zone = local.host_az
  size              = var.data_volume_gb
  type              = "gp3"
  tags              = { Name = "urnight-data" }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.host.id
}
