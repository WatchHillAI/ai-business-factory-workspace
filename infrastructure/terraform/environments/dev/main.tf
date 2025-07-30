terraform {
  required_version = ">= 1.0"
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

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ai-business-factory"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# =================== SQS QUEUES ===================

# Scraping Queue
module "scraping_queue" {
  source = "../../modules/sqs-queue"
  
  queue_name                = "${var.project_name}-scraping-queue-${var.environment}"
  visibility_timeout_seconds = 360 # 6 minutes (Lambda timeout + buffer)
  
  tags = merge(local.common_tags, {
    Service = "data-collector"
    Type    = "scraping"
  })
}

# Analysis Queue
module "analysis_queue" {
  source = "../../modules/sqs-queue"
  
  queue_name                = "${var.project_name}-analysis-queue-${var.environment}"
  visibility_timeout_seconds = 900 # 15 minutes for ML processing
  
  tags = merge(local.common_tags, {
    Service = "opportunity-analyzer"
    Type    = "analysis"
  })
}

# Validation Queue
module "validation_queue" {
  source = "../../modules/sqs-queue"
  
  queue_name                = "${var.project_name}-validation-queue-${var.environment}"
  visibility_timeout_seconds = 600 # 10 minutes for validation
  
  tags = merge(local.common_tags, {
    Service = "market-validator"
    Type    = "validation"
  })
}

# =================== LAMBDA FUNCTIONS ===================

# Data Collector Lambda
module "data_collector_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-data-collector-${var.environment}"
  description   = "AI Business Factory Data Collector - Web scraping service"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.apiHandler"
  memory_size   = 1024
  timeout       = 300
  
  source_dir = "../../../ai-business-factory-data-collector"
  
  sqs_queue_arns = [
    module.scraping_queue.queue_arn,
    module.analysis_queue.queue_arn
  ]
  
  environment_variables = {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    SCRAPING_QUEUE_URL = module.scraping_queue.queue_url
    ANALYSIS_QUEUE_URL = module.analysis_queue.queue_url
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  }
  
  tags = merge(local.common_tags, {
    Function = "data-collector"
    Service  = "scraping"
  })
}

# Opportunity Analyzer Lambda
module "opportunity_analyzer_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-opportunity-analyzer-${var.environment}"
  description   = "AI Business Factory Opportunity Analyzer - ML analysis service"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.apiHandler"
  memory_size   = 2048
  timeout       = 900
  
  source_dir = "../../../ai-business-factory-opportunity-analyzer"
  
  # Add AI Model Router layer
  layers = [module.ai_model_router.layer_arn]
  
  sqs_queue_arns = [
    module.analysis_queue.queue_arn,
    module.validation_queue.queue_arn
  ]
  
  environment_variables = merge(module.ai_model_router.configuration, {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    ANALYSIS_QUEUE_URL = module.analysis_queue.queue_url
    VALIDATION_QUEUE_URL = module.validation_queue.queue_url
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  })
  
  tags = merge(local.common_tags, {
    Function = "opportunity-analyzer"
    Service  = "analysis"
  })
}

# Market Validator Lambda
module "market_validator_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-market-validator-${var.environment}"
  description   = "AI Business Factory Market Validator - Validation and risk assessment service"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.apiHandler"
  memory_size   = 1024
  timeout       = 600
  
  source_dir = "../../../ai-business-factory-market-validator"
  
  sqs_queue_arns = [
    module.validation_queue.queue_arn
  ]
  
  environment_variables = {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    VALIDATION_QUEUE_URL = module.validation_queue.queue_url
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  }
  
  tags = merge(local.common_tags, {
    Function = "market-validator"
    Service  = "validation"
  })
}

# Strategy Manager Lambda
module "strategy_manager_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-strategy-manager-${var.environment}"
  description   = "AI Business Factory Strategy Manager - Strategy management and A/B testing service"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.apiHandler"
  memory_size   = 512
  timeout       = 60
  
  source_dir = "../../../ai-business-factory-strategy-manager"
  
  # Add AI Model Router layer
  layers = [module.ai_model_router.layer_arn]
  
  environment_variables = merge(module.ai_model_router.configuration, {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    SCRAPING_QUEUE_URL = module.scraping_queue.queue_url
    ANALYSIS_QUEUE_URL = module.analysis_queue.queue_url
    VALIDATION_QUEUE_URL = module.validation_queue.queue_url
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  })
  
  tags = merge(local.common_tags, {
    Function = "strategy-manager"
    Service  = "strategy"
  })
}

# Scheduler Lambda
module "scheduler_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-scheduler-${var.environment}"
  description   = "AI Business Factory Scheduler - SQS-based job scheduling and orchestration service"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.handler"
  memory_size   = 512
  timeout       = 60
  
  source_dir = "../../../ai-business-factory-scheduler"
  
  sqs_queue_arns = [
    module.scraping_queue.queue_arn,
    module.analysis_queue.queue_arn,
    module.validation_queue.queue_arn
  ]
  
  environment_variables = {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    SCRAPING_QUEUE_URL = module.scraping_queue.queue_url
    ANALYSIS_QUEUE_URL = module.analysis_queue.queue_url
    VALIDATION_QUEUE_URL = module.validation_queue.queue_url
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  }
  
  tags = merge(local.common_tags, {
    Function = "scheduler"
    Service  = "orchestration"
  })
}

# =================== API GATEWAYS ===================

# Data Collector API Gateway
module "data_collector_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-data-collector-api-${var.environment}"
  api_description      = "API Gateway for Data Collector Lambda"
  lambda_function_name = module.data_collector_lambda.function_name
  lambda_invoke_arn    = module.data_collector_lambda.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "data-collector"
  })
}

# Opportunity Analyzer API Gateway
module "opportunity_analyzer_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-opportunity-analyzer-api-${var.environment}"
  api_description      = "API Gateway for Opportunity Analyzer Lambda"
  lambda_function_name = module.opportunity_analyzer_lambda.function_name
  lambda_invoke_arn    = module.opportunity_analyzer_lambda.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "opportunity-analyzer"
  })
}

# Market Validator API Gateway
module "market_validator_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-market-validator-api-${var.environment}"
  api_description      = "API Gateway for Market Validator Lambda"
  lambda_function_name = module.market_validator_lambda.function_name
  lambda_invoke_arn    = module.market_validator_lambda.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "market-validator"
  })
}

# Strategy Manager API Gateway
module "strategy_manager_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-strategy-manager-api-${var.environment}"
  api_description      = "API Gateway for Strategy Manager Lambda"
  lambda_function_name = module.strategy_manager_lambda.function_name
  lambda_invoke_arn    = module.strategy_manager_lambda.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "strategy-manager"
  })
}

# Scheduler API Gateway
module "scheduler_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-scheduler-api-${var.environment}"
  api_description      = "API Gateway for Scheduler Lambda"
  lambda_function_name = module.scheduler_lambda.function_name
  lambda_invoke_arn    = module.scheduler_lambda.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "scheduler"
  })
}

# =================== EVENTBRIDGE SCHEDULING ===================

# Hourly scraping schedule
module "hourly_scraping_schedule" {
  source = "../../modules/eventbridge-scheduler"
  
  rule_name           = "${var.project_name}-hourly-scraping-${var.environment}"
  rule_description    = "Trigger scraping jobs every hour"
  schedule_expression = "rate(1 hour)"
  target_lambda_arn   = module.scheduler_lambda.function_arn
  target_lambda_name  = module.scheduler_lambda.function_name
  
  event_input = jsonencode({
    source      = "aws.events"
    detail-type = "Scheduled Event"
    detail = {
      trigger_type = "hourly_scraping"
      strategies   = "default"
    }
  })
  
  tags = merge(local.common_tags, {
    Service = "scheduler"
    Type    = "hourly"
  })
}

# Daily analysis schedule
module "daily_analysis_schedule" {
  source = "../../modules/eventbridge-scheduler"
  
  rule_name           = "${var.project_name}-daily-analysis-${var.environment}"
  rule_description    = "Trigger comprehensive analysis daily"
  schedule_expression = "cron(0 6 * * ? *)" # 6 AM UTC daily
  target_lambda_arn   = module.scheduler_lambda.function_arn
  target_lambda_name  = module.scheduler_lambda.function_name
  
  event_input = jsonencode({
    source      = "aws.events"
    detail-type = "Scheduled Event"
    detail = {
      trigger_type = "daily_analysis"
      strategies   = "comprehensive"
    }
  })
  
  tags = merge(local.common_tags, {
    Service = "scheduler"
    Type    = "daily"
  })
}

# =================== AI MODEL ROUTER ===================

# AI Model Router Lambda Layer
module "ai_model_router" {
  source = "../../modules/ai-model-router"
  
  layer_name = "ai-model-router"
  runtime    = "nodejs18.x"
  environment = var.environment
  
  # Dependencies
  redis_endpoint = module.redis_cluster.cluster_address
  database_url   = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
  
  # Cost optimization settings
  enable_cost_optimization = true
  daily_budget_limit       = 10.0  # $10/day for dev
  monthly_budget_limit     = 300.0 # $300/month for dev
  
  tags = merge(local.common_tags, {
    Service = "ai-model-router"
    Type    = "layer"
  })
}

# API Key Secrets (must be populated manually)
resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id = module.ai_model_router.openai_secret_arn
  secret_string = "YOUR_OPENAI_API_KEY_HERE"
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_version" "claude_api_key" {
  secret_id = module.ai_model_router.claude_secret_arn
  secret_string = "YOUR_CLAUDE_API_KEY_HERE"
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_version" "gemini_api_key" {
  secret_id = module.ai_model_router.gemini_secret_arn
  secret_string = "YOUR_GEMINI_API_KEY_HERE"
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# =================== MANAGED SERVICES ===================

# RDS PostgreSQL Aurora Serverless
module "postgresql_cluster" {
  source = "../../modules/rds-postgresql"
  
  cluster_identifier = "${var.project_name}-db-${var.environment}"
  database_name      = "ai_business_factory"
  master_username    = "postgres"
  
  # Serverless v2 configuration for dev
  min_capacity = 0.5
  max_capacity = 1
  auto_pause   = true
  seconds_until_auto_pause = 300
  
  # Enable Data API for AppSync
  enable_data_api      = true
  enable_http_endpoint = true
  
  # Dev environment settings
  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true
  
  environment = var.environment
  
  tags = merge(local.common_tags, {
    Service = "database"
    Type    = "postgresql"
  })
}

# ElastiCache Redis Cluster
module "redis_cluster" {
  source = "../../modules/elasticache-redis"
  
  cluster_id          = "${var.project_name}-cache-${var.environment}"
  description         = "Redis cluster for AI Business Factory caching and sessions"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  engine_version      = "7.0"
  
  # Dev environment settings
  snapshot_retention_limit = 1
  apply_immediately        = true
  auto_minor_version_upgrade = true
  
  environment = var.environment
  
  tags = merge(local.common_tags, {
    Service = "cache"
    Type    = "redis"
  })
}

# AppSync GraphQL API
module "graphql_api" {
  source = "../../modules/appsync-graphql"
  
  api_name            = "${var.project_name}-graphql-${var.environment}"
  authentication_type = "API_KEY"
  
  # RDS Data API integration
  rds_cluster_arn = module.postgresql_cluster.cluster_arn
  rds_secret_arn  = module.postgresql_cluster.secret_arn
  
  # Lambda resolvers for complex business logic
  lambda_function_arns = {
    opportunity_analyzer = module.opportunity_analyzer_lambda.function_arn
    market_validator     = module.market_validator_lambda.function_arn
    business_generator   = module.business_generator_lambda.function_arn
    ai_agent_orchestrator = module.ai_agent_orchestrator.function_arn
  }
  
  # Performance and monitoring
  enable_caching = false # Disabled for dev
  enable_logging = true
  log_level      = "ERROR"
  
  tags = merge(local.common_tags, {
    Service = "graphql"
    Type    = "api"
  })
}

# Business Generator Lambda (for AppSync)
module "business_generator_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "${var.project_name}-business-generator-${var.environment}"
  description   = "AI Business Factory Business Generator - Generate business plans from opportunities"
  runtime       = "nodejs18.x"
  handler       = "src/lambda-handler.apiHandler"
  memory_size   = 2048
  timeout       = 900
  
  source_dir = "../../../ai-business-factory-business-generator"
  
  # Add AI Model Router layer
  layers = [module.ai_model_router.layer_arn]
  
  environment_variables = merge(module.ai_model_router.configuration, {
    NODE_ENV = var.environment
    LOG_LEVEL = "info"
    DATABASE_URL = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
    REDIS_URL = module.redis_cluster.redis_url
  })
  
  tags = merge(local.common_tags, {
    Function = "business-generator"
    Service  = "generation"
  })
}

# =================== AI AGENT ORCHESTRATOR ===================

# AI Agent Orchestrator Lambda (NEW)
module "ai_agent_orchestrator" {
  source = "../../modules/ai-agent-orchestrator"
  
  function_name = "${var.project_name}-ai-agent-orchestrator-${var.environment}"
  environment   = var.environment
  
  # Integrate with existing infrastructure
  ai_model_router_layer_arn = module.ai_model_router.layer_arn
  redis_url                 = module.redis_cluster.redis_url
  database_url              = "postgresql://${module.postgresql_cluster.master_username}@${module.postgresql_cluster.cluster_endpoint}:${module.postgresql_cluster.cluster_port}/${module.postgresql_cluster.database_name}"
  
  tags = merge(local.common_tags, {
    Function = "ai-agent-orchestrator"
    Service  = "ai-intelligence"
  })
}

# =================== BUSINESS IDEAS CRUD API ===================
# Moved to business-ideas-api.tf for focused deployment

# AI Agent Orchestrator API Gateway
module "ai_agent_orchestrator_api" {
  source = "../../modules/api-gateway-lambda"
  
  api_name             = "${var.project_name}-ai-agent-orchestrator-api-${var.environment}"
  api_description      = "API Gateway for AI Agent Orchestrator Lambda"
  lambda_function_name = module.ai_agent_orchestrator.function_name
  lambda_invoke_arn    = module.ai_agent_orchestrator.invoke_arn
  aws_region          = local.region
  aws_account_id      = local.account_id
  
  tags = merge(local.common_tags, {
    Service = "ai-agent-orchestrator"
  })
}

# =================== PWA DEPLOYMENT ===================

# Shared PWA Workspace Deployment
module "pwa_workspace" {
  source = "../../modules/s3-cloudfront-pwa"
  
  project_name = var.project_name
  environment  = var.environment
  
  # Domain configuration (optional - can be added later)
  domain_name     = null  # Set to your domain when ready
  certificate_arn = null  # Set to ACM certificate ARN when domain is configured
  
  # PWA applications configuration
  pwa_applications = {
    bmc = {
      subdomain    = "bmc"
      source_path  = "apps/bmc-pwa/dist"
      spa_mode     = true
      cache_policy = "spa"
    }
    ideas = {
      subdomain    = "ideas" 
      source_path  = "apps/idea-cards-pwa/dist"
      spa_mode     = true
      cache_policy = "spa"
    }
  }
  
  tags = merge(local.common_tags, {
    Service = "pwa-workspace"
    Type    = "frontend"
  })
}

# =================== OUTPUTS ===================

output "lambda_functions" {
  description = "Deployed Lambda function details"
  value = {
    data_collector = {
      name = module.data_collector_lambda.function_name
      arn  = module.data_collector_lambda.function_arn
      api_url = module.data_collector_api.api_gateway_url
    }
    opportunity_analyzer = {
      name = module.opportunity_analyzer_lambda.function_name
      arn  = module.opportunity_analyzer_lambda.function_arn
      api_url = module.opportunity_analyzer_api.api_gateway_url
    }
    market_validator = {
      name = module.market_validator_lambda.function_name
      arn  = module.market_validator_lambda.function_arn
      api_url = module.market_validator_api.api_gateway_url
    }
    strategy_manager = {
      name = module.strategy_manager_lambda.function_name
      arn  = module.strategy_manager_lambda.function_arn
      api_url = module.strategy_manager_api.api_gateway_url
    }
    scheduler = {
      name = module.scheduler_lambda.function_name
      arn  = module.scheduler_lambda.function_arn
      api_url = module.scheduler_api.api_gateway_url
    }
    ai_agent_orchestrator = {
      name = module.ai_agent_orchestrator.function_name
      arn  = module.ai_agent_orchestrator.function_arn
      api_url = module.ai_agent_orchestrator_api.api_gateway_url
    }
  }
}

output "sqs_queues" {
  description = "SQS queue details"
  value = {
    scraping_queue = {
      url = module.scraping_queue.queue_url
      arn = module.scraping_queue.queue_arn
    }
    analysis_queue = {
      url = module.analysis_queue.queue_url
      arn = module.analysis_queue.queue_arn
    }
    validation_queue = {
      url = module.validation_queue.queue_url
      arn = module.validation_queue.queue_arn
    }
  }
}

output "eventbridge_rules" {
  description = "EventBridge scheduling rules"
  value = {
    hourly_scraping = {
      name = module.hourly_scraping_schedule.rule_name
      arn  = module.hourly_scraping_schedule.rule_arn
    }
    daily_analysis = {
      name = module.daily_analysis_schedule.rule_name
      arn  = module.daily_analysis_schedule.rule_arn
    }
  }
}

output "api_endpoints" {
  description = "All API Gateway endpoints"
  value = {
    data_collector       = module.data_collector_api.api_gateway_url
    opportunity_analyzer = module.opportunity_analyzer_api.api_gateway_url
    market_validator     = module.market_validator_api.api_gateway_url
    strategy_manager     = module.strategy_manager_api.api_gateway_url
    scheduler           = module.scheduler_api.api_gateway_url
    ai_agent_orchestrator = module.ai_agent_orchestrator_api.api_gateway_url
  }
}

output "managed_services" {
  description = "AWS managed services endpoints and details"
  value = {
    postgresql = {
      cluster_endpoint = module.postgresql_cluster.cluster_endpoint
      database_name    = module.postgresql_cluster.database_name
      secret_arn       = module.postgresql_cluster.secret_arn
      cluster_arn      = module.postgresql_cluster.cluster_arn
    }
    redis = {
      cluster_endpoint = module.redis_cluster.cluster_address
      port             = module.redis_cluster.port
      redis_url        = module.redis_cluster.redis_url
    }
    graphql = {
      api_id           = module.graphql_api.graphql_api_id
      graphql_endpoint = module.graphql_api.graphql_api_uris.graphql
      realtime_endpoint = module.graphql_api.graphql_api_uris.realtime
      api_key          = module.graphql_api.api_key
    }
  }
  sensitive = true
}

output "ai_model_router" {
  description = "AI Model Router configuration and secrets"
  value = {
    layer_arn = module.ai_model_router.layer_arn
    layer_version = module.ai_model_router.layer_version
    iam_policy_arn = module.ai_model_router.iam_policy_arn
    secrets = {
      openai_secret_arn = module.ai_model_router.openai_secret_arn
      claude_secret_arn = module.ai_model_router.claude_secret_arn
      gemini_secret_arn = module.ai_model_router.gemini_secret_arn
    }
    configuration = module.ai_model_router.configuration
  }
  sensitive = true
}

output "pwa_workspace" {
  description = "PWA workspace deployment details"
  value = {
    s3_bucket = module.pwa_workspace.s3_bucket
    cloudfront_distributions = module.pwa_workspace.cloudfront_distributions
    deployment_info = module.pwa_workspace.deployment_info
    cache_policies = module.pwa_workspace.cache_policies
  }
}

output "deployment_urls" {
  description = "PWA application URLs"
  value = {
    bmc_app = {
      cloudfront_url = "https://${module.pwa_workspace.cloudfront_distributions.bmc.domain_name}"
      status = module.pwa_workspace.cloudfront_distributions.bmc.status
    }
    ideas_app = {
      cloudfront_url = "https://${module.pwa_workspace.cloudfront_distributions.ideas.domain_name}"
      status = module.pwa_workspace.cloudfront_distributions.ideas.status
    }
    s3_bucket = module.pwa_workspace.s3_bucket.name
  }
}

output "cost_summary" {
  description = "Estimated monthly costs for dev environment"
  value = {
    serverless_total = "~$80-90/month"
    breakdown = {
      lambda_functions = "~$15-25/month (6 functions)"
      api_gateway      = "~$10-15/month (6 APIs)"
      appsync_graphql  = "~$5-10/month (queries + real-time)"
      rds_aurora       = "~$25-30/month (serverless, auto-pause)"
      elasticache      = "~$15-20/month (t3.micro)"
      sqs_queues       = "~$1-2/month (3 queues)"
      cloudwatch_logs  = "~$2-3/month (log retention)"
      ai_model_router  = "~$3-10/month (dev: $10/day budget)"
      pwa_hosting      = "~$5-8/month (S3 + 2 CloudFront distributions)"
    }
    notes = {
      aurora_savings = "Auto-pause reduces costs by ~70% during idle time"
      appsync_benefit = "5x faster than API Gateway + Lambda for GraphQL"
      serverless_advantage = "Pay-per-use vs $88-220/month for containers"
      ai_cost_optimization = "88% cost reduction through intelligent routing"
      pwa_benefits = "Shared S3 bucket, optimized caching, SPA routing"
    }
  }
}

# =================== GITHUB OIDC INTEGRATION ===================

# GitHub OIDC for secure CI/CD authentication
module "github_oidc" {
  source = "../../modules/github-oidc"
  
  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  github_repository = "WatchHillAI/ai-business-factory-workspace"
  
  github_branches = [
    "main",
    "develop", 
    "feature/live-ai-integration"
  ]
}

# =================== OUTPUTS ===================

# Database connection outputs
output "rds_cluster_endpoint" {
  description = "Aurora PostgreSQL cluster endpoint"
  value       = module.postgresql_cluster.cluster_endpoint
}

output "rds_cluster_port" {
  description = "Aurora PostgreSQL cluster port"
  value       = module.postgresql_cluster.cluster_port
}

output "rds_database_name" {
  description = "Aurora PostgreSQL database name"
  value       = module.postgresql_cluster.database_name
}

output "rds_master_username" {
  description = "Aurora PostgreSQL master username"
  value       = module.postgresql_cluster.master_username
}

output "rds_master_password_secret_arn" {
  description = "ARN of the secret containing the Aurora PostgreSQL master password"
  value       = module.postgresql_cluster.secret_arn
}

# GitHub Actions integration outputs
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role for OIDC authentication"
  value       = module.github_oidc.github_actions_role_arn
}