# AI Agent Orchestrator Lambda Module
# Integrates with existing AI Business Factory infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

variable "function_name" {
  description = "Name of the AI Agent Orchestrator Lambda function"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "ai_model_router_layer_arn" {
  description = "ARN of the existing AI Model Router layer"
  type        = string
}

variable "redis_url" {
  description = "Redis cluster URL from existing infrastructure"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL database URL from existing infrastructure"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Local values
locals {
  lambda_zip_path = "${path.module}/ai-agent-orchestrator.zip"
  source_dir      = "${path.root}/../../../ai-business-factory-workspace/packages/ai-agents"
}

# Package AI Agents code for Lambda deployment
data "archive_file" "ai_agent_orchestrator" {
  type        = "zip"
  source_dir  = local.source_dir
  output_path = local.lambda_zip_path
  
  excludes = [
    "*.test.ts",
    "*.test.js",
    "node_modules",
    ".git",
    "README.md",
    "tsconfig.json",
    "lambda-deployment.zip"
  ]
}

# IAM role for AI Agent Orchestrator Lambda
resource "aws_iam_role" "ai_agent_orchestrator_role" {
  name = "${var.function_name}-role"

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

# Enhanced IAM policy for AI agent operations
resource "aws_iam_policy" "ai_agent_orchestrator_policy" {
  name = "${var.function_name}-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Basic Lambda execution
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      # Secrets Manager for API keys
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/openai-api-key/*",
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/claude-api-key/*",
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/gemini-api-key/*",
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/google-trends-api-key/*",
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/crunchbase-api-key/*",
          "arn:aws:secretsmanager:*:*:secret:ai-business-factory/semrush-api-key/*"
        ]
      },
      # ElastiCache Redis access (leveraging existing cluster)
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      },
      # CloudWatch metrics for monitoring
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      # SQS for potential async processing
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ]
        Resource = "arn:aws:sqs:*:*:ai-business-factory-*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ai_agent_orchestrator_policy_attachment" {
  role       = aws_iam_role.ai_agent_orchestrator_role.name
  policy_arn = aws_iam_policy.ai_agent_orchestrator_policy.arn
}

# Attach AWS managed policies
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.ai_agent_orchestrator_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# AI Agent Orchestrator Lambda function
resource "aws_lambda_function" "ai_agent_orchestrator" {
  filename         = data.archive_file.ai_agent_orchestrator.output_path
  function_name    = var.function_name
  role            = aws_iam_role.ai_agent_orchestrator_role.arn
  handler         = "simple-lambda-handler.handler"
  runtime         = "nodejs18.x"
  memory_size     = 2048
  timeout         = 900
  
  # Use existing AI Model Router layer for cost optimization
  layers = [var.ai_model_router_layer_arn]
  
  source_code_hash = data.archive_file.ai_agent_orchestrator.output_base64sha256

  environment {
    variables = {
      NODE_ENV = var.environment
      LOG_LEVEL = var.environment == "prod" ? "info" : "debug"
      
      # Existing infrastructure integration
      REDIS_URL = var.redis_url
      DATABASE_URL = var.database_url
      
      # AI Agent configuration - All agents TypeScript issues resolved
      ENABLE_MARKET_RESEARCH_AGENT = "true"
      ENABLE_FINANCIAL_MODELING_AGENT = "true"   # Fixed and ready
      ENABLE_FOUNDER_FIT_AGENT = "true"          # Fixed and ready
      ENABLE_RISK_ASSESSMENT_AGENT = "true"      # Fixed and ready
      
      # Performance tuning
      AGENT_TIMEOUT_MS = "300000"        # 5 minutes
      CACHE_TTL_SECONDS = "3600"         # 1 hour
      MAX_CONCURRENT_AGENTS = "3"
      
      # Quality assurance
      CONFIDENCE_THRESHOLD = "0.7"
      ENABLE_QUALITY_VALIDATION = "true"
      
      # Cost optimization (leveraging existing AI Model Router)
      USE_EXISTING_AI_ROUTER = "true"
      ENABLE_RESPONSE_CACHING = "true"
      
      # External API configuration (secrets managed via AWS Secrets Manager)
      GOOGLE_TRENDS_API_KEY_SECRET = "ai-business-factory/google-trends-api-key"
      CRUNCHBASE_API_KEY_SECRET = "ai-business-factory/crunchbase-api-key"
      SEMRUSH_API_KEY_SECRET = "ai-business-factory/semrush-api-key"
    }
  }

  tags = var.tags
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "ai_agent_orchestrator_logs" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 14

  tags = var.tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "ai_agent_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_agent_orchestrator.function_name
  principal     = "apigateway.amazonaws.com"
}

# Lambda permission for AppSync GraphQL
resource "aws_lambda_permission" "ai_agent_appsync" {
  statement_id  = "AllowExecutionFromAppSync"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_agent_orchestrator.function_name
  principal     = "appsync.amazonaws.com"
}

# Outputs
output "function_name" {
  description = "Name of the AI Agent Orchestrator Lambda function"
  value       = aws_lambda_function.ai_agent_orchestrator.function_name
}

output "function_arn" {
  description = "ARN of the AI Agent Orchestrator Lambda function"
  value       = aws_lambda_function.ai_agent_orchestrator.arn
}

output "invoke_arn" {
  description = "Invoke ARN of the AI Agent Orchestrator Lambda function"
  value       = aws_lambda_function.ai_agent_orchestrator.invoke_arn
}

output "role_arn" {
  description = "IAM role ARN for the AI Agent Orchestrator Lambda"
  value       = aws_iam_role.ai_agent_orchestrator_role.arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.ai_agent_orchestrator_logs.name
}