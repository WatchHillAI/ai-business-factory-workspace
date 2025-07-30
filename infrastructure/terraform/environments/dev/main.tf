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

# GitHub OIDC Provider for CI/CD
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

# Business Ideas CRUD API - This is what we need to fix
# Include the business-ideas-api.tf file content here
# Data sources for VPC configuration
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get existing Aurora cluster information
data "aws_rds_cluster" "postgresql" {
  cluster_identifier = "ai-business-factory-db-dev"
}

# Business Ideas CRUD API - Force state refresh to detect missing API Gateway deployment
module "business_ideas_api" {
  source = "../../modules/business-ideas-api"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  # Database connection - use existing Aurora cluster
  db_endpoint   = data.aws_rds_cluster.postgresql.endpoint
  db_port       = tostring(data.aws_rds_cluster.postgresql.port)
  db_name       = data.aws_rds_cluster.postgresql.database_name
  db_secret_arn = "arn:aws:secretsmanager:us-east-1:519284856023:secret:ai-business-factory-db-dev-credentials-iFQoGn"

  # VPC configuration for Lambda
  subnet_ids         = data.aws_subnets.default.ids
  security_group_ids = ["sg-089fe5cc28dc8d927"] # Aurora cluster security group

  tags = merge(local.common_tags, {
    Service = "business-ideas-crud"
    Type    = "api"
  })
}

# =================== OUTPUTS ===================

# GitHub Actions Role ARN
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role for CI/CD"
  value       = module.github_oidc.github_actions_role_arn
}

# Business Ideas API endpoint
output "business_ideas_api_endpoint" {
  description = "Business Ideas CRUD API endpoint URL"
  value       = "${module.business_ideas_api.api_endpoint}/ideas"
}

output "business_ideas_lambda_name" {
  description = "Business Ideas Lambda function name"
  value       = module.business_ideas_api.lambda_function_name
}