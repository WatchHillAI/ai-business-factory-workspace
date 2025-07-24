# Variables for GitHub OIDC module

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ai-business-factory"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = "WatchHillAI/ai-business-factory-workspace"
}

variable "github_branches" {
  description = "List of GitHub branches allowed to assume the role"
  type        = list(string)
  default     = ["main", "develop", "feature/*"]
}