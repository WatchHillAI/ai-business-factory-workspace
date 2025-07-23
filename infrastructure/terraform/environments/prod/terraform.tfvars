# Production Environment Configuration
# AI Business Factory - Production Settings

# Environment settings
aws_region    = "us-east-1"
project_name  = "ai-business-factory"
environment   = "prod"

# Deletion protection for production
enable_deletion_protection = true

# Extended log retention for production
log_retention_days = 90

# Production resource sizing
lambda_memory_sizes = {
  data_collector       = 2048
  opportunity_analyzer = 4096
  market_validator     = 2048
  strategy_manager     = 1024
  scheduler           = 512
}

lambda_timeouts = {
  data_collector       = 900
  opportunity_analyzer = 900
  market_validator     = 600
  strategy_manager     = 60
  scheduler           = 60
}

# SQS settings for production
sqs_visibility_timeout = {
  scraping   = 900
  analysis   = 1800
  validation = 1200
}

# EventBridge schedules for production
schedule_expressions = {
  hourly_scraping = "rate(30 minutes)"  # More frequent in prod
  daily_analysis  = "cron(0 4 * * ? *)" # 4 AM UTC daily
}