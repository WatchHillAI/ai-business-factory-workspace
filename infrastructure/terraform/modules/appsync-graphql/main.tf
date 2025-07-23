# AppSync GraphQL API Module
# Comprehensive module for AWS AppSync with direct resolvers and Lambda integration

variable "api_name" {
  description = "Name of the AppSync GraphQL API"
  type        = string
}

variable "authentication_type" {
  description = "Authentication type for the API"
  type        = string
  default     = "API_KEY"
  validation {
    condition = contains(["API_KEY", "AWS_IAM", "AMAZON_COGNITO_USER_POOLS", "OPENID_CONNECT"], var.authentication_type)
    error_message = "Authentication type must be one of: API_KEY, AWS_IAM, AMAZON_COGNITO_USER_POOLS, OPENID_CONNECT."
  }
}

variable "schema_file_path" {
  description = "Path to the GraphQL schema file"
  type        = string
  default     = ""
}

variable "rds_cluster_arn" {
  description = "ARN of the RDS cluster for direct database resolvers"
  type        = string
  default     = ""
}

variable "rds_secret_arn" {
  description = "ARN of the RDS secret for database authentication"
  type        = string
  default     = ""
}

variable "lambda_function_arns" {
  description = "Map of Lambda function ARNs for Lambda resolvers"
  type        = map(string)
  default     = {}
}

variable "enable_caching" {
  description = "Enable AppSync caching"
  type        = bool
  default     = false
}

variable "cache_type" {
  description = "AppSync cache instance type"
  type        = string
  default     = "SMALL"
}

variable "enable_logging" {
  description = "Enable AppSync logging"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "AppSync log level"
  type        = string
  default     = "ERROR"
  validation {
    condition = contains(["NONE", "ERROR", "ALL"], var.log_level)
    error_message = "Log level must be one of: NONE, ERROR, ALL."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Default GraphQL schema
locals {
  default_schema = var.schema_file_path != "" ? file(var.schema_file_path) : <<-EOT
    type Opportunity {
      id: ID!
      title: String!
      description: String
      tags: [String]
      score: Float
      createdAt: String
      updatedAt: String
    }

    type MarketData {
      id: ID!
      opportunityId: ID!
      marketSize: Float
      growthRate: Float
      competition: String
      sentiment: Float
      createdAt: String
    }

    type ValidationResult {
      id: ID!
      opportunityId: ID!
      marketScore: Float
      competitiveScore: Float
      technicalScore: Float
      financialScore: Float
      overallScore: Float
      recommendation: String
      createdAt: String
    }

    type BusinessPlan {
      id: ID!
      opportunityId: ID!
      executiveSummary: String
      marketAnalysis: String
      businessModel: String
      financialProjections: String
      createdAt: String
    }

    input CreateOpportunityInput {
      title: String!
      description: String
      tags: [String]
    }

    input BusinessPlanInput {
      opportunityId: ID!
      requirements: String
      targetMarket: String
    }

    type Query {
      # Direct database queries (fast, low cost)
      getOpportunity(id: ID!): Opportunity
      listOpportunities(limit: Int, nextToken: String): OpportunityConnection
      getMarketData(opportunityId: ID!): MarketData
      getValidationResult(opportunityId: ID!): ValidationResult
      
      # Lambda resolver queries (complex business logic)
      analyzeOpportunity(id: ID!): MarketData
      validateMarket(opportunityId: ID!): ValidationResult
    }

    type Mutation {
      # Direct database mutations
      createOpportunity(input: CreateOpportunityInput!): Opportunity
      updateOpportunity(id: ID!, input: CreateOpportunityInput!): Opportunity
      deleteOpportunity(id: ID!): Boolean
      
      # Lambda resolver mutations (business logic)
      generateBusinessPlan(input: BusinessPlanInput!): BusinessPlan
      triggerAnalysis(opportunityId: ID!): Boolean
    }

    type Subscription {
      # Real-time updates
      opportunityCreated: Opportunity
        @aws_subscribe(mutations: ["createOpportunity"])
      analysisCompleted(opportunityId: ID!): MarketData
      validationCompleted(opportunityId: ID!): ValidationResult
    }

    type OpportunityConnection {
      items: [Opportunity]
      nextToken: String
    }
  EOT
}

# CloudWatch Log Group for AppSync
resource "aws_cloudwatch_log_group" "appsync_logs" {
  count             = var.enable_logging ? 1 : 0
  name              = "/aws/appsync/apis/${var.api_name}"
  retention_in_days = 14
  
  tags = var.tags
}

# IAM role for AppSync
resource "aws_iam_role" "appsync_service_role" {
  name = "${var.api_name}-appsync-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for AppSync to access RDS Data API
resource "aws_iam_role_policy" "appsync_rds_policy" {
  count = var.rds_cluster_arn != "" ? 1 : 0
  name  = "${var.api_name}-appsync-rds-policy"
  role  = aws_iam_role.appsync_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:ExecuteStatement",
          "rds-data:RollbackTransaction"
        ]
        Resource = var.rds_cluster_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.rds_secret_arn
      }
    ]
  })
}

# IAM policy for AppSync to invoke Lambda functions
resource "aws_iam_role_policy" "appsync_lambda_policy" {
  count = length(var.lambda_function_arns) > 0 ? 1 : 0
  name  = "${var.api_name}-appsync-lambda-policy"
  role  = aws_iam_role.appsync_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = values(var.lambda_function_arns)
      }
    ]
  })
}

# IAM policy for CloudWatch logging
resource "aws_iam_role_policy" "appsync_logs_policy" {
  count = var.enable_logging ? 1 : 0
  name  = "${var.api_name}-appsync-logs-policy"
  role  = aws_iam_role.appsync_service_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# AppSync GraphQL API
resource "aws_appsync_graphql_api" "api" {
  name               = var.api_name
  authentication_type = var.authentication_type
  schema             = local.default_schema

  dynamic "log_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      cloudwatch_logs_role_arn = aws_iam_role.appsync_service_role.arn
      field_log_level         = var.log_level
    }
  }

  tags = var.tags
}

# API Key (if using API_KEY authentication)
resource "aws_appsync_api_key" "api_key" {
  count       = var.authentication_type == "API_KEY" ? 1 : 0
  api_id      = aws_appsync_graphql_api.api.id
  description = "API key for ${var.api_name}"
  expires     = timeadd(timestamp(), "365h") # 1 year
}

# AppSync Cache (optional)
resource "aws_appsync_api_cache" "cache" {
  count              = var.enable_caching ? 1 : 0
  api_id             = aws_appsync_graphql_api.api.id
  api_caching_behavior = "FULL_REQUEST_CACHING"
  type               = var.cache_type
  ttl                = 3600 # 1 hour
}

# RDS Data Source (for direct database resolvers)
resource "aws_appsync_datasource" "rds_datasource" {
  count           = var.rds_cluster_arn != "" ? 1 : 0
  api_id          = aws_appsync_graphql_api.api.id
  name            = "RDS_DataSource"
  service_role_arn = aws_iam_role.appsync_service_role.arn
  type            = "RELATIONAL_DATABASE"

  relational_database_config {
    http_endpoint_config {
      aws_secret_store_arn = var.rds_secret_arn
      db_cluster_identifier = replace(var.rds_cluster_arn, "/^.*cluster:/", "")
    }
  }
}

# Lambda Data Sources (for Lambda resolvers)
resource "aws_appsync_datasource" "lambda_datasources" {
  for_each        = var.lambda_function_arns
  api_id          = aws_appsync_graphql_api.api.id
  name            = "${each.key}_DataSource"
  service_role_arn = aws_iam_role.appsync_service_role.arn
  type            = "AWS_LAMBDA"

  lambda_config {
    function_arn = each.value
  }
}

# Direct Resolvers (RDS)
resource "aws_appsync_resolver" "direct_resolvers" {
  count             = var.rds_cluster_arn != "" ? 1 : 0
  api_id            = aws_appsync_graphql_api.api.id
  data_source       = aws_appsync_datasource.rds_datasource[0].name
  type              = "Query"
  field             = "listOpportunities"

  request_template = <<-EOT
    {
      "version": "2018-05-29",
      "statements": [
        "SELECT id, title, description, tags, score, created_at, updated_at FROM opportunities ORDER BY created_at DESC LIMIT $util.defaultIfNull($ctx.args.limit, 20)"
      ]
    }
  EOT

  response_template = <<-EOT
    {
      "items": $utils.toJson($utils.rds.toJsonObject($ctx.result)[0])
    }
  EOT
}

# Lambda Resolvers (for complex business logic)
resource "aws_appsync_resolver" "lambda_resolvers" {
  for_each    = var.lambda_function_arns
  api_id      = aws_appsync_graphql_api.api.id
  data_source = aws_appsync_datasource.lambda_datasources[each.key].name
  type        = "Mutation"
  field       = each.key == "business_generator" ? "generateBusinessPlan" : "analyzeOpportunity"

  request_template = <<-EOT
    {
      "version": "2018-05-29",
      "operation": "Invoke",
      "payload": {
        "arguments": $utils.toJson($ctx.args),
        "identity": $utils.toJson($ctx.identity),
        "source": $utils.toJson($ctx.source),
        "request": $utils.toJson($ctx.request),
        "prev": $utils.toJson($ctx.prev)
      }
    }
  EOT

  response_template = <<-EOT
    $utils.toJson($ctx.result)
  EOT
}

# Outputs
output "graphql_api_id" {
  description = "ID of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.api.id
}

output "graphql_api_arn" {
  description = "ARN of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.api.arn
}

output "graphql_api_uris" {
  description = "Map of GraphQL API URIs"
  value = {
    graphql    = aws_appsync_graphql_api.api.uris["GRAPHQL"]
    realtime   = aws_appsync_graphql_api.api.uris["REALTIME"]
  }
}

output "api_key" {
  description = "AppSync API key"
  value       = var.authentication_type == "API_KEY" ? aws_appsync_api_key.api_key[0].key : null
  sensitive   = true
}

output "service_role_arn" {
  description = "ARN of the AppSync service role"
  value       = aws_iam_role.appsync_service_role.arn
}