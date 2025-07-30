locals {
  function_name = "${var.project_name}-business-ideas-crud-${var.environment}"
  api_name = "${var.project_name}-business-ideas-api-${var.environment}"
}

# IAM role for Lambda
resource "aws_iam_role" "crud_lambda" {
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
resource "aws_iam_role_policy" "crud_lambda" {
  name = "${local.function_name}-policy"
  role = aws_iam_role.crud_lambda.id

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

# Lambda function
resource "aws_lambda_function" "crud_api" {
  filename      = "${path.module}/lambda.zip"
  function_name = local.function_name
  role          = aws_iam_role.crud_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      DB_ENDPOINT   = var.db_endpoint
      DB_PORT       = var.db_port
      DB_NAME       = var.db_name
      DB_SECRET_ARN = var.db_secret_arn
      NODE_ENV      = var.environment
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [filename]
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "crud_api" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14

  tags = var.tags
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "business_ideas" {
  name        = local.api_name
  description = "REST API for AI-generated business ideas CRUD operations"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

# API Gateway resource for business ideas
resource "aws_api_gateway_resource" "ideas" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  parent_id   = aws_api_gateway_rest_api.business_ideas.root_resource_id
  path_part   = "ideas"
}

# API Gateway resource for specific idea by ID
resource "aws_api_gateway_resource" "idea_by_id" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  parent_id   = aws_api_gateway_resource.ideas.id
  path_part   = "{id}"
}

# API Gateway methods for /ideas resource
# GET /ideas (list ideas)
resource "aws_api_gateway_method" "ideas_get" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.ideas.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.querystring.limit"         = false
    "method.request.querystring.offset"        = false
    "method.request.querystring.tier"          = false
    "method.request.querystring.minConfidence" = false
    "method.request.querystring.search"        = false
    "method.request.querystring.sortBy"        = false
    "method.request.querystring.sortOrder"     = false
  }
}

# POST /ideas (create idea)
resource "aws_api_gateway_method" "ideas_post" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.ideas.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway methods for /ideas/{id} resource
# GET /ideas/{id} (get specific idea)
resource "aws_api_gateway_method" "idea_get" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.idea_by_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

# PUT /ideas/{id} (update idea)
resource "aws_api_gateway_method" "idea_put" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.idea_by_id.id
  http_method   = "PUT"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

# DELETE /ideas/{id} (delete idea)
resource "aws_api_gateway_method" "idea_delete" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.idea_by_id.id
  http_method   = "DELETE"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

# CORS OPTIONS methods
resource "aws_api_gateway_method" "ideas_options" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.ideas.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "idea_options" {
  rest_api_id   = aws_api_gateway_rest_api.business_ideas.id
  resource_id   = aws_api_gateway_resource.idea_by_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda integrations
resource "aws_api_gateway_integration" "ideas_get" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.ideas.id
  http_method = aws_api_gateway_method.ideas_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

resource "aws_api_gateway_integration" "ideas_post" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.ideas.id
  http_method = aws_api_gateway_method.ideas_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

resource "aws_api_gateway_integration" "idea_get" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.idea_by_id.id
  http_method = aws_api_gateway_method.idea_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

resource "aws_api_gateway_integration" "idea_put" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.idea_by_id.id
  http_method = aws_api_gateway_method.idea_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

resource "aws_api_gateway_integration" "idea_delete" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.idea_by_id.id
  http_method = aws_api_gateway_method.idea_delete.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

# CORS integrations
resource "aws_api_gateway_integration" "ideas_options" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.ideas.id
  http_method = aws_api_gateway_method.ideas_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

resource "aws_api_gateway_integration" "idea_options" {
  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  resource_id = aws_api_gateway_resource.idea_by_id.id
  http_method = aws_api_gateway_method.idea_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_api.invoke_arn
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.business_ideas.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "business_ideas" {
  depends_on = [
    aws_api_gateway_integration.ideas_get,
    aws_api_gateway_integration.ideas_post,
    aws_api_gateway_integration.idea_get,
    aws_api_gateway_integration.idea_put,
    aws_api_gateway_integration.idea_delete,
    aws_api_gateway_integration.ideas_options,
    aws_api_gateway_integration.idea_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.business_ideas.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.business_ideas.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.crud_api.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.crud_api.arn
}