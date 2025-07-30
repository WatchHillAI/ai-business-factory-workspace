# Focused configuration for Business Ideas CRUD API
# This allows deployment without missing module dependencies

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

# Business Ideas CRUD API
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
  security_group_ids = ["sg-089fe5cc28dc8d927"]  # Aurora cluster security group
  
  tags = merge(local.common_tags, {
    Service = "business-ideas-crud"
    Type    = "api"
  })
}

# Output the API endpoint for environment configuration
output "business_ideas_api_endpoint" {
  description = "Business Ideas CRUD API endpoint URL"
  value       = "${module.business_ideas_api.api_endpoint}/ideas"
}

output "business_ideas_lambda_name" {
  description = "Business Ideas Lambda function name"
  value       = module.business_ideas_api.lambda_function_name
}