# ElastiCache Redis Module
# Serverless-optimized Redis cluster for caching and session management

variable "cluster_id" {
  description = "Identifier for the ElastiCache cluster"
  type        = string
}

variable "description" {
  description = "Description for the ElastiCache cluster"
  type        = string
  default     = "Redis cluster for AI Business Factory"
}

variable "node_type" {
  description = "Instance class for Redis nodes"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "port" {
  description = "Port number for Redis"
  type        = number
  default     = 6379
}

variable "parameter_group_name" {
  description = "Parameter group for Redis"
  type        = string
  default     = "default.redis7"
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "maintenance_window" {
  description = "Maintenance window for Redis cluster"
  type        = string
  default     = "sun:03:00-sun:04:00"
}

variable "snapshot_window" {
  description = "Daily snapshot window"
  type        = string
  default     = "02:00-03:00"
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 5
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ for higher availability"
  type        = bool
  default     = false
}

variable "subnet_group_name" {
  description = "Subnet group name for Redis cluster"
  type        = string
  default     = null
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
  default     = []
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

variable "log_delivery_configuration" {
  description = "Redis log delivery configuration"
  type = list(object({
    destination      = string
    destination_type = string
    log_format       = string
    log_type         = string
  }))
  default = []
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

# Default VPC and subnets
data "aws_vpc" "default" {
  count   = var.subnet_group_name == null ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.subnet_group_name == null ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

# Subnet Group for ElastiCache (create default if not provided)
resource "aws_elasticache_subnet_group" "default" {
  count      = var.subnet_group_name == null ? 1 : 0
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = data.aws_subnets.default[0].ids

  tags = merge(var.tags, {
    Name = "${var.cluster_id}-subnet-group"
  })
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  count       = length(var.security_group_ids) == 0 ? 1 : 0
  name        = "${var.cluster_id}-redis-sg"
  description = "Security group for Redis cluster ${var.cluster_id}"
  vpc_id      = var.subnet_group_name == null ? data.aws_vpc.default[0].id : data.aws_elasticache_subnet_group.existing[0].vpc_id

  ingress {
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
    description = "Redis access from private networks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_id}-redis-sg"
  })
}

# Get existing subnet group info if provided
data "aws_elasticache_subnet_group" "existing" {
  count = var.subnet_group_name != null ? 1 : 0
  name  = var.subnet_group_name
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = var.cluster_id
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = var.parameter_group_name
  port                 = var.port

  # Network configuration
  subnet_group_name  = var.subnet_group_name != null ? var.subnet_group_name : aws_elasticache_subnet_group.default[0].name
  security_group_ids = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.redis[0].id]

  # Maintenance and backup
  maintenance_window         = var.maintenance_window
  snapshot_window           = var.snapshot_window
  snapshot_retention_limit  = var.snapshot_retention_limit
  apply_immediately         = var.apply_immediately
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # High availability
  az_mode = var.num_cache_nodes > 1 ? "cross-az" : "single-az"

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  # Logging configuration
  dynamic "log_delivery_configuration" {
    for_each = var.log_delivery_configuration
    content {
      destination      = log_delivery_configuration.value.destination
      destination_type = log_delivery_configuration.value.destination_type
      log_format       = log_delivery_configuration.value.log_format
      log_type         = log_delivery_configuration.value.log_type
    }
  }

  tags = merge(var.tags, {
    Name        = var.cluster_id
    Environment = var.environment
  })
}

# CloudWatch Log Group for Redis logs
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  count             = length(var.log_delivery_configuration) > 0 ? 1 : 0
  name              = "/aws/elasticache/${var.cluster_id}/slow-log"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name = "${var.cluster_id}-slow-log"
  })
}

# Parameter Group for custom Redis configuration (optional)
resource "aws_elasticache_parameter_group" "redis_params" {
  count       = var.parameter_group_name == "default.redis7" ? 0 : 1
  family      = "redis7"
  name        = "${var.cluster_id}-params"
  description = "Custom parameter group for ${var.cluster_id}"

  # Common parameters for serverless optimization
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  tags = var.tags
}

# Outputs
output "cluster_id" {
  description = "ElastiCache cluster identifier"
  value       = aws_elasticache_cluster.redis.cluster_id
}

output "cluster_arn" {
  description = "ElastiCache cluster ARN"
  value       = aws_elasticache_cluster.redis.arn
}

output "cluster_address" {
  description = "ElastiCache cluster endpoint address"
  value       = aws_elasticache_cluster.redis.cluster_address
}

output "configuration_endpoint" {
  description = "Configuration endpoint for cluster mode"
  value       = aws_elasticache_cluster.redis.configuration_endpoint
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.redis.port
}

output "engine_version" {
  description = "Redis engine version"
  value       = aws_elasticache_cluster.redis.engine_version_actual
}

output "parameter_group_name" {
  description = "Parameter group name"
  value       = aws_elasticache_cluster.redis.parameter_group_name
}

output "subnet_group_name" {
  description = "Subnet group name"
  value       = aws_elasticache_cluster.redis.subnet_group_name
}

output "security_group_ids" {
  description = "Security group IDs"
  value       = aws_elasticache_cluster.redis.security_group_ids
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://${aws_elasticache_cluster.redis.cluster_address}:${aws_elasticache_cluster.redis.port}"
}

# Connection configuration for Lambda environment variables
output "redis_config" {
  description = "Redis configuration for Lambda functions"
  value = {
    host     = aws_elasticache_cluster.redis.cluster_address
    port     = aws_elasticache_cluster.redis.port
    url      = "redis://${aws_elasticache_cluster.redis.cluster_address}:${aws_elasticache_cluster.redis.port}"
    engine   = "redis"
    version  = aws_elasticache_cluster.redis.engine_version_actual
  }
}