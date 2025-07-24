# GitHub OIDC Identity Provider for AWS
# This module sets up secure GitHub Actions authentication with AWS using OIDC

# GitHub OIDC Identity Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  
  client_id_list = [
    "sts.amazonaws.com"
  ]
  
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]
  
  tags = {
    Name        = "GitHub Actions OIDC"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })
  
  tags = {
    Name        = "GitHub Actions Role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Policy for database deployment
resource "aws_iam_policy" "database_deployment" {
  name        = "${var.project_name}-database-deployment-${var.environment}"
  description = "Policy for GitHub Actions to deploy database schema"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # RDS permissions
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSubnetGroups",
          "rds:DescribeDBClusterParameters",
          "rds:DescribeDBParameterGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          # Secrets Manager permissions
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # Terraform state access
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-terraform-state-${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-terraform-state-${var.environment}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # DynamoDB for Terraform state locking
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-terraform-locks-${var.environment}"
        ]
      }
    ]
  })
}

# Policy for AI agent deployment
resource "aws_iam_policy" "ai_agent_deployment" {
  name        = "${var.project_name}-ai-agent-deployment-${var.environment}"
  description = "Policy for GitHub Actions to deploy AI agents"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # Lambda permissions
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "lambda:DeleteFunction",
          "lambda:InvokeFunction",
          "lambda:TagResource",
          "lambda:UntagResource"
        ]
        Resource = [
          "arn:aws:lambda:${var.aws_region}:*:function:${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # API Gateway permissions
          "apigateway:GET",
          "apigateway:POST",
          "apigateway:PUT",
          "apigateway:DELETE",
          "apigateway:PATCH"
        ]
        Resource = [
          "arn:aws:apigateway:${var.aws_region}::/restapis/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # IAM permissions for Lambda execution role
          "iam:GetRole",
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PassRole"
        ]
        Resource = [
          "arn:aws:iam::*:role/${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # CloudWatch Logs
          "logs:CreateLogGroup",
          "logs:DescribeLogGroups",
          "logs:PutRetentionPolicy"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-*"
        ]
      }
    ]
  })
}

# Policy for PWA deployment
resource "aws_iam_policy" "pwa_deployment" {
  name        = "${var.project_name}-pwa-deployment-${var.environment}"
  description = "Policy for GitHub Actions to deploy PWAs"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # S3 permissions for PWA hosting
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*-pwa-${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*-pwa-${var.environment}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # CloudFront permissions
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policies to the role
resource "aws_iam_role_policy_attachment" "database_deployment" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.database_deployment.arn
}

resource "aws_iam_role_policy_attachment" "ai_agent_deployment" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.ai_agent_deployment.arn
}

resource "aws_iam_role_policy_attachment" "pwa_deployment" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.pwa_deployment.arn
}

# Additional AWS managed policies
resource "aws_iam_role_policy_attachment" "readonly_access" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}