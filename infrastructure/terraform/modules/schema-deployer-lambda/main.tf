locals {
  function_name = "${var.project_name}-schema-deployer-${var.environment}"
}

# IAM role for Lambda
resource "aws_iam_role" "schema_deployer" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for Lambda
resource "aws_iam_role_policy" "schema_deployer" {
  name = "${local.function_name}-policy"
  role = aws_iam_role.schema_deployer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.db_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda layer for pg module
resource "aws_lambda_layer_version" "pg" {
  filename   = "${path.module}/layers/pg-layer.zip"
  layer_name = "${var.project_name}-pg-layer-${var.environment}"

  compatible_runtimes = ["nodejs18.x"]

  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda function
resource "aws_lambda_function" "schema_deployer" {
  filename      = "${path.module}/lambda.zip"
  function_name = local.function_name
  role          = aws_iam_role.schema_deployer.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 300
  memory_size   = 512

  environment {
    variables = {
      DB_ENDPOINT   = var.db_endpoint
      DB_PORT       = var.db_port
      DB_NAME       = var.db_name
      DB_SECRET_ARN = var.db_secret_arn
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  layers = [aws_lambda_layer_version.pg.arn]

  tags = var.tags

  lifecycle {
    ignore_changes = [filename]
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "schema_deployer" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Output the Lambda function name for invocation
output "function_name" {
  value = aws_lambda_function.schema_deployer.function_name
}

output "function_arn" {
  value = aws_lambda_function.schema_deployer.arn
}