# AI Agent System - AppSync GraphQL Resolvers
# Connects GraphQL operations to AI Agent Lambda functions

# =====================================================
# AI AGENT ORCHESTRATOR RESOLVERS
# =====================================================

# Data source for AI Agent Orchestrator Lambda
resource "aws_appsync_datasource" "ai_agent_orchestrator" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "AiAgentOrchestratorDataSource"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_lambda_role.arn

  lambda_config {
    function_arn = var.lambda_function_arns["ai_agent_orchestrator"]
  }

  description = "Lambda data source for AI Agent Orchestrator"
}

# Mutation: analyzeIdea - Analyze business idea with AI agents
resource "aws_appsync_resolver" "analyze_idea" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "analyzeIdea"
  data_source = aws_appsync_datasource.ai_agent_orchestrator.name

  request_template = <<-EOT
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": {
    "info": {
      "fieldName": "analyzeIdea",
      "variables": $util.toJson($context.arguments)
    },
    "arguments": {
      "input": $util.toJson($context.arguments.input)
    },
    "identity": $util.toJson($context.identity),
    "request": $util.toJson($context.request)
  }
}
EOT

  response_template = <<-EOT
#if($context.error)
  $util.error($context.error.message, $context.error.type)
#end
#if($context.result.success == false)
  $util.error($context.result.error, "AI_AGENT_ERROR")
#end
$util.toJson($context.result)
EOT
}

# Query: getAnalysisResult - Get analysis by ID
resource "aws_appsync_resolver" "get_analysis_result" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"  
  field       = "getAnalysisResult"
  data_source = aws_appsync_datasource.detailed_ideas_rds.name

  request_template = <<-EOT
{
  "version": "2018-05-29",
  "statements": [
    "SELECT * FROM detailed_ideas_complete WHERE id = :analysisId AND deleted_at IS NULL"
  ],
  "variableMap": {
    ":analysisId": "$context.arguments.analysisId"
  }
}
EOT

  response_template = <<-EOT
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
#if($ctx.result.records.size() == 0)
  null
#else
  #set($record = $ctx.result.records[0])
  {
    "success": true,
    "analysisId": "$record.id",
    "marketResearch": {
      "confidence": $record.market_research_confidence,
      "problemStatement": {
        "summary": "$record.problem_summary"
      },
      "marketSignals": {
        "marketSentiment": "$record.market_sentiment"
      },
      "marketTiming": {
        "assessment": "$record.timing_assessment"
      }
    },
    "financialModel": {
      "confidence": $record.financial_model_confidence,
      "fundingRequirements": {
        "totalRequired": "$record.total_funding_required"
      }
    },
    "founderFit": {
      "confidence": $record.founder_fit_confidence,
      "founderReadinessScore": $record.founder_readiness_score
    },
    "riskAssessment": {
      "confidence": $record.risk_assessment_confidence,
      "overallRiskLevel": "$record.overall_risk_level",
      "riskScore": $record.risk_score
    },
    "confidence": $record.overall_confidence,
    "executionTime": 0
  }
#end
EOT
}

# Query: aiAgentHealth - Get agent health status
resource "aws_appsync_resolver" "ai_agent_health" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "aiAgentHealth"
  data_source = aws_appsync_datasource.ai_agent_orchestrator.name

  request_template = <<-EOT
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": {
    "info": {
      "fieldName": "aiAgentHealth"
    },
    "arguments": {},
    "identity": $util.toJson($context.identity),
    "request": $util.toJson($context.request)
  }
}
EOT

  response_template = <<-EOT
#if($context.error)
  $util.error($context.error.message, $context.error.type)
#end
$util.toJson($context.result)
EOT
}

# =====================================================
# DETAILED IDEAS RDS DATA SOURCE
# =====================================================

# Direct RDS data source for detailed ideas (leveraging existing pattern)
resource "aws_appsync_datasource" "detailed_ideas_rds" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "DetailedIdeasRDSDataSource"
  type             = "RELATIONAL_DATABASE"
  service_role_arn = aws_iam_role.appsync_rds_role.arn

  relational_database_config {
    http_endpoint_config {
      aws_region   = data.aws_region.current.name
      db_cluster_identifier = split(":", var.rds_cluster_arn)[6]
      database_name = "ai_business_factory"
      aws_secret_store_arn = var.rds_secret_arn
    }
  }

  description = "Direct RDS data source for detailed ideas and analysis results"
}

# =====================================================
# SUBSCRIPTION RESOLVERS (Real-time updates)
# =====================================================

# Subscription: analysisProgress - Real-time analysis updates
resource "aws_appsync_resolver" "analysis_progress_subscription" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Subscription"
  field       = "analysisProgress"
  data_source = "NONE"

  request_template = <<-EOT
{
  "version": "2017-02-28",
  "payload": {
    "analysisId": "$context.arguments.analysisId"
  }
}
EOT

  response_template = <<-EOT
$util.toJson($context.result)
EOT
}

# Subscription: agentHealthUpdates - Real-time health monitoring
resource "aws_appsync_resolver" "agent_health_updates_subscription" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Subscription"
  field       = "agentHealthUpdates"
  data_source = "NONE"

  request_template = <<-EOT
{
  "version": "2017-02-28",
  "payload": {}
}
EOT

  response_template = <<-EOT
$util.toJson($context.result)
EOT
}

# =====================================================
# REGENERATE ANALYSIS RESOLVER
# =====================================================

# Mutation: regenerateAnalysis - Regenerate specific sections
resource "aws_appsync_resolver" "regenerate_analysis" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "regenerateAnalysis"
  data_source = aws_appsync_datasource.ai_agent_orchestrator.name

  request_template = <<-EOT
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": {
    "info": {
      "fieldName": "regenerateAnalysis",
      "variables": $util.toJson($context.arguments)
    },
    "arguments": {
      "analysisId": "$context.arguments.analysisId",
      "sections": $util.toJson($context.arguments.sections)
    },
    "identity": $util.toJson($context.identity),
    "request": $util.toJson($context.request)
  }
}
EOT

  response_template = <<-EOT
#if($context.error)
  $util.error($context.error.message, $context.error.type)
#end
#if($context.result.success == false)
  $util.error($context.result.error, "AI_AGENT_ERROR")
#end
$util.toJson($context.result)
EOT
}

# =====================================================
# IAM ROLES FOR APPSYNC DATA SOURCES
# =====================================================

# IAM role for AppSync to invoke Lambda functions
resource "aws_iam_role" "appsync_lambda_role" {
  name = "${var.api_name}-lambda-role"

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

# Policy for Lambda invocation
resource "aws_iam_policy" "appsync_lambda_policy" {
  name = "${var.api_name}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          for arn in values(var.lambda_function_arns) : arn
        ]
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "appsync_lambda_policy_attachment" {
  role       = aws_iam_role.appsync_lambda_role.name
  policy_arn = aws_iam_policy.appsync_lambda_policy.arn
}

# IAM role for AppSync to access RDS
resource "aws_iam_role" "appsync_rds_role" {
  name = "${var.api_name}-rds-role"

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

# Policy for RDS Data API access
resource "aws_iam_policy" "appsync_rds_policy" {
  name = "${var.api_name}-rds-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = [
          var.rds_cluster_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.rds_secret_arn
        ]
      }
    ]
  })
}

# Attach RDS policy to role
resource "aws_iam_role_policy_attachment" "appsync_rds_policy_attachment" {
  role       = aws_iam_role.appsync_rds_role.name
  policy_arn = aws_iam_policy.appsync_rds_policy.arn
}

# =====================================================
# OUTPUTS
# =====================================================

output "ai_agent_data_source_arn" {
  description = "ARN of the AI Agent Orchestrator data source"
  value       = aws_appsync_datasource.ai_agent_orchestrator.arn
}

output "detailed_ideas_data_source_arn" {
  description = "ARN of the Detailed Ideas RDS data source"
  value       = aws_appsync_datasource.detailed_ideas_rds.arn
}

output "resolver_arns" {
  description = "ARNs of all AI agent resolvers"
  value = {
    analyze_idea           = aws_appsync_resolver.analyze_idea.arn
    get_analysis_result    = aws_appsync_resolver.get_analysis_result.arn
    ai_agent_health        = aws_appsync_resolver.ai_agent_health.arn
    regenerate_analysis    = aws_appsync_resolver.regenerate_analysis.arn
  }
}