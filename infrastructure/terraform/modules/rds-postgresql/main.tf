# RDS PostgreSQL Module
# Serverless-optimized PostgreSQL Aurora cluster with Data API support

variable "cluster_identifier" {
  description = "Identifier for the RDS cluster"
  type        = string
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "ai_business_factory"
}

variable "master_username" {
  description = "Username for the master DB user"
  type        = string
  default     = "postgres"
}

variable "master_password" {
  description = "Password for the master DB user (will be stored in AWS Secrets Manager)"
  type        = string
  sensitive   = true
  default     = null
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "min_capacity" {
  description = "Minimum Aurora Serverless capacity units"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum Aurora Serverless capacity units"
  type        = number
  default     = 1
}

variable "auto_pause" {
  description = "Enable auto pause for Aurora Serverless"
  type        = bool
  default     = true
}

variable "seconds_until_auto_pause" {
  description = "Time in seconds before Aurora Serverless auto-pauses"
  type        = number
  default     = 300
}

variable "timeout_action" {
  description = "Action to take when the timeout is reached"
  type        = string
  default     = "ForceApplyCapacityChange"
}

variable "enable_data_api" {
  description = "Enable RDS Data API for serverless access"
  type        = bool
  default     = true
}

variable "enable_http_endpoint" {
  description = "Enable HTTP endpoint for Aurora Serverless"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying cluster"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "vpc_security_group_ids" {
  description = "List of VPC security group IDs"
  type        = list(string)
  default     = []
}

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Random password generation if not provided
resource "random_password" "master_password" {
  count   = var.master_password == null ? 1 : 0
  length  = 32
  special = true
}

# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.cluster_identifier}-credentials"
  description = "Database credentials for ${var.cluster_identifier}"

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.master_username
    password = var.master_password != null ? var.master_password : random_password.master_password[0].result
    engine   = "postgres"
    host     = aws_rds_cluster.postgresql.endpoint
    port     = aws_rds_cluster.postgresql.port
    dbname   = var.database_name
  })
}

# DB Subnet Group (create default if not provided)
resource "aws_db_subnet_group" "default" {
  count      = var.db_subnet_group_name == null ? 1 : 0
  name       = "${var.cluster_identifier}-subnet-group"
  subnet_ids = data.aws_subnets.default[0].ids

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-subnet-group"
  })
}

# Default VPC and subnets
data "aws_vpc" "default" {
  count   = var.db_subnet_group_name == null ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.db_subnet_group_name == null ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  count       = length(var.vpc_security_group_ids) == 0 ? 1 : 0
  name        = "${var.cluster_identifier}-rds-sg"
  description = "Security group for RDS cluster ${var.cluster_identifier}"
  vpc_id      = var.db_subnet_group_name == null ? data.aws_vpc.default[0].id : data.aws_db_subnet_group.existing[0].vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
    description = "PostgreSQL access from private networks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-rds-sg"
  })
}

# Get existing subnet group info if provided
data "aws_db_subnet_group" "existing" {
  count = var.db_subnet_group_name != null ? 1 : 0
  name  = var.db_subnet_group_name
}

# Aurora PostgreSQL Serverless Cluster
resource "aws_rds_cluster" "postgresql" {
  cluster_identifier = var.cluster_identifier
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version
  
  database_name   = var.database_name
  master_username = var.master_username
  master_password = var.master_password != null ? var.master_password : random_password.master_password[0].result
  
  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.max_capacity
    min_capacity = var.min_capacity
  }

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.default[0].name
  vpc_security_group_ids = length(var.vpc_security_group_ids) > 0 ? var.vpc_security_group_ids : [aws_security_group.rds[0].id]

  # Serverless features
  enable_http_endpoint = var.enable_http_endpoint

  # Backup configuration
  backup_retention_period   = var.backup_retention_period
  preferred_backup_window   = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  # Lifecycle configuration
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.cluster_identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  deletion_protection = var.deletion_protection
  apply_immediately   = var.apply_immediately

  # Storage encryption
  storage_encrypted = true

  tags = merge(var.tags, {
    Name        = var.cluster_identifier
    Environment = var.environment
  })

  lifecycle {
    ignore_changes = [
      master_password,
      final_snapshot_identifier
    ]
  }
}

# Aurora Serverless v2 instances
resource "aws_rds_cluster_instance" "postgresql" {
  count              = 1  # Single instance for dev
  identifier         = "${var.cluster_identifier}-${count.index}"
  cluster_identifier = aws_rds_cluster.postgresql.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.postgresql.engine
  engine_version     = aws_rds_cluster.postgresql.engine_version
  
  performance_insights_enabled = var.environment == "prod"
  monitoring_interval          = var.environment == "prod" ? 60 : 0
  
  tags = var.tags
}

# CloudWatch Log Groups for enhanced monitoring
resource "aws_cloudwatch_log_group" "postgresql" {
  name              = "/aws/rds/cluster/${var.cluster_identifier}/postgresql"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-postgresql-logs"
  })
}

# Outputs
output "cluster_identifier" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.postgresql.cluster_identifier
}

output "cluster_arn" {
  description = "RDS cluster ARN"
  value       = aws_rds_cluster.postgresql.arn
}

output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.postgresql.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.postgresql.reader_endpoint
}

output "cluster_port" {
  description = "RDS cluster port"
  value       = aws_rds_cluster.postgresql.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.postgresql.database_name
}

output "master_username" {
  description = "Master username"
  value       = aws_rds_cluster.postgresql.master_username
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "security_group_id" {
  description = "Security group ID for RDS cluster"
  value       = length(var.vpc_security_group_ids) > 0 ? var.vpc_security_group_ids[0] : aws_security_group.rds[0].id
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.default[0].name
}

# AppSync Data API specific outputs
output "rds_data_api_config" {
  description = "Configuration for AppSync RDS Data API integration"
  value = {
    cluster_arn    = aws_rds_cluster.postgresql.arn
    secret_arn     = aws_secretsmanager_secret.db_credentials.arn
    database_name  = aws_rds_cluster.postgresql.database_name
    enabled        = var.enable_http_endpoint
  }
}