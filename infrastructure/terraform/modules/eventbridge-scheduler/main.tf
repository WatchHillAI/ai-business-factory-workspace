# EventBridge Scheduler Module
# Reusable module for creating EventBridge rules and targets

variable "rule_name" {
  description = "Name of the EventBridge rule"
  type        = string
}

variable "rule_description" {
  description = "Description of the EventBridge rule"
  type        = string
}

variable "schedule_expression" {
  description = "Schedule expression for the rule (rate or cron)"
  type        = string
}

variable "target_lambda_arn" {
  description = "ARN of the target Lambda function"
  type        = string
}

variable "target_lambda_name" {
  description = "Name of the target Lambda function"
  type        = string
}

variable "event_input" {
  description = "JSON input to pass to the target"
  type        = string
  default     = null
}

variable "event_input_transformer" {
  description = "Input transformer configuration"
  type = object({
    input_paths_map = map(string)
    input_template  = string
  })
  default = null
}

variable "is_enabled" {
  description = "Whether the rule is enabled"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "rule" {
  name                = var.rule_name
  description         = var.rule_description
  schedule_expression = var.schedule_expression
  state               = var.is_enabled ? "ENABLED" : "DISABLED"
  
  tags = var.tags
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.rule.name
  target_id = "LambdaTarget"
  arn       = var.target_lambda_arn

  # Optional input
  input = var.event_input

  # Optional input transformer
  dynamic "input_transformer" {
    for_each = var.event_input_transformer != null ? [1] : []
    content {
      input_paths = var.event_input_transformer.input_paths_map
      input_template = var.event_input_transformer.input_template
    }
  }
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.target_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rule.arn
}

# Outputs
output "rule_arn" {
  description = "ARN of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.rule.arn
}

output "rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.rule.name
}

output "target_id" {
  description = "ID of the EventBridge target"
  value       = aws_cloudwatch_event_target.lambda_target.target_id
}