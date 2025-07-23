# SQS Queue Module
# Reusable module for creating SQS queues with dead letter queues

variable "queue_name" {
  description = "Name of the SQS queue"
  type        = string
}

variable "delay_seconds" {
  description = "Time in seconds that messages are delayed before delivery"
  type        = number
  default     = 0
}

variable "max_message_size" {
  description = "Maximum message size in bytes"
  type        = number
  default     = 262144
}

variable "message_retention_seconds" {
  description = "Number of seconds to retain messages"
  type        = number
  default     = 1209600 # 14 days
}

variable "receive_wait_time_seconds" {
  description = "Time for which ReceiveMessage call waits for a message"
  type        = number
  default     = 10
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for messages"
  type        = number
  default     = 360 # 6 minutes (Lambda timeout + buffer)
}

variable "max_receive_count" {
  description = "Maximum times a message can be received before moving to DLQ"
  type        = number
  default     = 3
}

variable "create_dlq" {
  description = "Whether to create a dead letter queue"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  count = var.create_dlq ? 1 : 0
  
  name                      = "${var.queue_name}-dlq"
  message_retention_seconds = var.message_retention_seconds
  
  tags = merge(var.tags, {
    Name = "${var.queue_name} Dead Letter Queue"
    Type = "dlq"
  })
}

# Main SQS Queue
resource "aws_sqs_queue" "queue" {
  name                      = var.queue_name
  delay_seconds             = var.delay_seconds
  max_message_size          = var.max_message_size
  message_retention_seconds = var.message_retention_seconds
  receive_wait_time_seconds = var.receive_wait_time_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds
  
  # Dead Letter Queue configuration
  redrive_policy = var.create_dlq ? jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[0].arn
    maxReceiveCount     = var.max_receive_count
  }) : null
  
  tags = merge(var.tags, {
    Name = var.queue_name
    Type = "main"
  })
}

# SQS Queue Policy (allowing Lambda and EventBridge access)
data "aws_caller_identity" "current" {}

resource "aws_sqs_queue_policy" "queue_policy" {
  queue_url = aws_sqs_queue.queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaAccess"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.queue.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowEventBridgeAccess"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.queue.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Outputs
output "queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.queue.arn
}

output "queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.queue.url
}

output "queue_name" {
  description = "Name of the SQS queue"
  value       = aws_sqs_queue.queue.name
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = var.create_dlq ? aws_sqs_queue.dlq[0].arn : null
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = var.create_dlq ? aws_sqs_queue.dlq[0].url : null
}