terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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
  default     = "prod"
}

# Local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# =================== PWA DEPLOYMENT ONLY ===================

# Minimal PWA Workspace Deployment (S3 + CloudFront only)
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

output "migration_complete" {
  description = "Production migration completion status"
  value = {
    terraform_managed = true
    bucket_name = module.pwa_workspace.s3_bucket.name
    distributions = {
      ideas = module.pwa_workspace.cloudfront_distributions.ideas.id
      bmc = module.pwa_workspace.cloudfront_distributions.bmc.id
    }
    next_steps = [
      "Update production CloudFront to point to new bucket",
      "Verify production functionality", 
      "Clean up old manual bucket after 24h verification"
    ]
  }
}