# Registros de imágenes. MUTABLE porque los alias staging/prod son tags móviles;
# la inmutabilidad de los tags sha-* es por convención (nunca se re-pushean).

resource "aws_ecr_repository" "app" {
  for_each = toset(["api", "worker", "web", "migrator"])

  name                 = "urnight/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name

  # Orden importa: una imagen consumida por una regla no es evaluada por las
  # siguientes. Regla 1 protege las imágenes con alias de entorno (prod puede
  # apuntar a un sha viejo si hay muchos deploys de staging entre releases).
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Proteger imágenes con alias de entorno"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["prod", "staging"]
          countType     = "imageCountMoreThan"
          countNumber   = 100
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Conservar solo las últimas 10 imágenes sha-*"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 3
        description  = "Expirar imágenes sin tag a los 7 días"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
    ]
  })
}
