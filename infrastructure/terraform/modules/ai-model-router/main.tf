# AI Model Router Lambda Layer Module
# Provides intelligent routing across multiple AI providers with cost optimization

variable "layer_name" {
  description = "Name for the Lambda layer"
  type        = string
  default     = "ai-model-router"
}

variable "runtime" {
  description = "Lambda runtime for the layer"
  type        = string
  default     = "nodejs18.x"
}

variable "description" {
  description = "Description for the Lambda layer"
  type        = string
  default     = "AI Model Router with cost optimization and intelligent fallback"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "redis_endpoint" {
  description = "ElastiCache Redis endpoint for caching"
  type        = string
}

variable "database_url" {
  description = "Aurora PostgreSQL connection string"
  type        = string
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "daily_budget_limit" {
  description = "Daily budget limit in USD"
  type        = number
  default     = 50.0
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 1500.0
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Local values for configuration
locals {
  layer_filename = "${var.layer_name}-layer.zip"
  
  # Cost optimization settings by environment
  cost_settings = {
    dev = {
      daily_budget = 10.0
      monthly_budget = 300.0
      cache_ttl_multiplier = 2.0
      enable_batch_processing = true
    }
    staging = {
      daily_budget = 25.0
      monthly_budget = 750.0
      cache_ttl_multiplier = 1.5
      enable_batch_processing = true
    }
    prod = {
      daily_budget = var.daily_budget_limit
      monthly_budget = var.monthly_budget_limit
      cache_ttl_multiplier = 1.0
      enable_batch_processing = false
    }
  }
  
  environment_config = local.cost_settings[var.environment]
}

# Create the AI Model Router source code
resource "local_file" "package_json" {
  filename = "${path.module}/src/package.json"
  content = jsonencode({
    name = "ai-model-router"
    version = "1.0.0"
    description = "Intelligent AI model routing with cost optimization"
    main = "index.js"
    dependencies = {
      "@aws-sdk/client-secrets-manager" = "^3.0.0"
      "@aws-sdk/client-rds-data" = "^3.0.0"
      "redis" = "^4.6.0"
      "openai" = "^4.0.0"
      "@anthropic-ai/sdk" = "^0.17.0"
      "@google-ai/generativelanguage" = "^2.0.0"
      "crypto" = "*"
      "uuid" = "^9.0.0"
    }
  })
}

resource "local_file" "router_index" {
  filename = "${path.module}/src/index.js"
  content = <<-EOT
const { AIModelRouter } = require('./ai-model-router');
const { CostOptimizer } = require('./cost-optimizer');
const { ResponseCache } = require('./response-cache');
const { PerformanceMonitor } = require('./performance-monitor');

// Export the main router class and utilities
module.exports = {
  AIModelRouter,
  CostOptimizer,
  ResponseCache,
  PerformanceMonitor,
  
  // Factory function for easy instantiation
  createRouter: (config = {}) => {
    return new AIModelRouter({
      redisEndpoint: process.env.REDIS_ENDPOINT,
      databaseUrl: process.env.DATABASE_URL,
      enableCostOptimization: process.env.ENABLE_COST_OPTIMIZATION === 'true',
      dailyBudgetLimit: parseFloat(process.env.DAILY_BUDGET_LIMIT || '50'),
      monthlyBudgetLimit: parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '1500'),
      environment: process.env.NODE_ENV || 'dev',
      ...config
    });
  }
};
EOT
}

resource "local_file" "ai_model_router" {
  filename = "${path.module}/src/ai-model-router.js"
  content = <<-EOT
const { ModelSelector } = require('./model-selector');
const { ResponseCache } = require('./response-cache');
const { PerformanceMonitor } = require('./performance-monitor');
const { CostOptimizer } = require('./cost-optimizer');
const { AIProviderFactory } = require('./providers/provider-factory');

class AIModelRouter {
  constructor(config = {}) {
    this.config = config;
    this.modelSelector = new ModelSelector(config);
    this.responseCache = new ResponseCache(config);
    this.performanceMonitor = new PerformanceMonitor(config);
    this.costOptimizer = new CostOptimizer(config);
    this.providers = new AIProviderFactory(config);
  }

  async route(request) {
    const startTime = Date.now();
    
    try {
      // 1. Validate budget constraints
      if (this.config.enableCostOptimization) {
        const budgetCheck = await this.costOptimizer.checkBudget(request);
        if (!budgetCheck.allowed) {
          throw new Error(`Budget limit exceeded: $${budgetCheck.reason}`);
        }
      }
      
      // 2. Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.responseCache.get(cacheKey);
      if (cached) {
        return { ...cached, cached: true, latency: Date.now() - startTime };
      }
      
      // 3. Select optimal model with cost consideration
      const modelConfig = await this.modelSelector.selectModel(request);
      
      // 4. Execute with fallback logic
      const response = await this.executeWithFallback(request, modelConfig);
      
      // 5. Cache the response
      await this.responseCache.set(cacheKey, response);
      
      // 6. Record metrics and costs
      await this.performanceMonitor.record(request, response);
      await this.costOptimizer.recordSpend(response);
      
      return { ...response, cached: false, latency: Date.now() - startTime };
      
    } catch (error) {
      await this.performanceMonitor.recordError(request, error);
      throw error;
    }
  }
  
  async executeWithFallback(request, modelConfig) {
    for (let i = 0; i < modelConfig.models.length; i++) {
      const model = modelConfig.models[i];
      
      try {
        const provider = await this.providers.getProvider(model.provider);
        const response = await provider.generate(request, model);
        
        return {
          ...response,
          model: model.name,
          provider: model.provider,
          fallbackUsed: i > 0,
          reasoning: modelConfig.reasoning
        };
        
      } catch (error) {
        console.warn(`Model $${model.name} failed:`, error.message);
        
        // If this is the last model, throw the error
        if (i === modelConfig.models.length - 1) {
          throw error;
        }
        
        // Continue to next model in fallback chain
        continue;
      }
    }
  }
  
  generateCacheKey(request) {
    const crypto = require('crypto');
    const content = `$${request.taskType}:$${request.prompt}:$${request.context || ""}`;
    return `ai_cache:$${crypto.createHash("sha256").update(content).digest("hex").slice(0, 16)}`;
  }
}

module.exports = { AIModelRouter };
EOT
}

resource "local_file" "cost_optimizer" {
  filename = "${path.module}/src/cost-optimizer.js"
  content = <<-EOT
class CostOptimizer {
  constructor(config = {}) {
    this.config = config;
    this.dailyBudgetLimit = config.dailyBudgetLimit || 50;
    this.monthlyBudgetLimit = config.monthlyBudgetLimit || 1500;
    this.redis = null; // Will be initialized when needed
  }
  
  async checkBudget(request) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const currentSpend = await this.getCurrentSpend(today);
      
      // Estimate cost for this request
      const estimatedCost = this.estimateRequestCost(request);
      
      // Check daily budget
      if (currentSpend + estimatedCost > this.dailyBudgetLimit) {
        return {
          allowed: false,
          reason: `Daily budget exceeded: $$${currentSpend + estimatedCost} > $$${this.dailyBudgetLimit}`,
          currentSpend,
          estimatedCost
        };
      }
      
      // Check monthly budget
      const monthStart = new Date().toISOString().slice(0, 7) + '-01';
      const monthlySpend = await this.getMonthlySpend(monthStart);
      if (monthlySpend + estimatedCost > this.monthlyBudgetLimit) {
        return {
          allowed: false,
          reason: `Monthly budget exceeded: $${monthlySpend + estimatedCost} > $${this.monthlyBudgetLimit}`,
          monthlySpend,
          estimatedCost
        };
      }
      
      return {
        allowed: true,
        currentSpend,
        estimatedCost,
        budgetUtilization: currentSpend / this.dailyBudgetLimit
      };
      
    } catch (error) {
      console.warn('Budget check failed:', error);
      // Fail open - allow request if budget check fails
      return { allowed: true, error: error.message };
    }
  }
  
  estimateRequestCost(request) {
    // Rough estimation based on task type and content length
    const baseRates = {
      business_plan: 0.05,    // Higher complexity
      market_analysis: 0.01,  // Medium complexity
      sentiment_analysis: 0.005, // Lower complexity
      general: 0.02
    };
    
    const rate = baseRates[request.taskType] || baseRates.general;
    const contentMultiplier = Math.max(1, (request.prompt?.length || 1000) / 1000);
    
    return rate * contentMultiplier;
  }
  
  async getCurrentSpend(date) {
    const redis = await this.getRedis();
    const key = `cost:daily:$${date}`;
    const spend = await redis.get(key);
    return parseFloat(spend || '0');
  }
  
  async getMonthlySpend(monthStart) {
    const redis = await this.getRedis();
    const key = `cost:monthly:$${monthStart}`;
    const spend = await redis.get(key);
    return parseFloat(spend || '0');
  }
  
  async recordSpend(response) {
    try {
      const redis = await this.getRedis();
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date().toISOString().slice(0, 7) + '-01';
      
      // Record daily spend
      await redis.incrbyfloat(`cost:daily:$${today}`, response.cost || 0);
      await redis.expire(`cost:daily:$${today}`, 86400 * 7); // 7 day expiry
      
      // Record monthly spend
      await redis.incrbyfloat(`cost:monthly:$${monthStart}`, response.cost || 0);
      await redis.expire(`cost:monthly:$${monthStart}`, 86400 * 31); // 31 day expiry
      
      // Record provider-specific metrics
      const hour = new Date().toISOString().slice(0, 13);
      await redis.incrbyfloat(`cost:$${hour}:$${response.provider}`, response.cost || 0);
      
    } catch (error) {
      console.warn('Failed to record spend:', error);
    }
  }
  
  async getRedis() {
    if (!this.redis) {
      const Redis = require('redis');
      this.redis = Redis.createClient({
        url: `redis://$${this.config.redisEndpoint || "localhost"}:6379`
      });
      await this.redis.connect();
    }
    return this.redis;
  }
}

module.exports = { CostOptimizer };
EOT
}

# Create a build script for the Lambda layer
resource "local_file" "build_script" {
  filename = "${path.module}/build-layer.sh"
  content = <<-EOT
#!/bin/bash
set -e

echo "Building AI Model Router Lambda Layer..."

# Create build directory
BUILD_DIR="${path.module}/build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/nodejs"

# Copy source files
cp -r "${path.module}/src/"* "$BUILD_DIR/nodejs/"

# Install dependencies
cd "$BUILD_DIR/nodejs"
npm install --production

# Create the zip file
cd "$BUILD_DIR"
zip -r "${path.module}/${local.layer_filename}" nodejs/

echo "Lambda layer built: ${local.layer_filename}"
EOT
}

# Make build script executable and run it
resource "null_resource" "build_layer" {
  depends_on = [
    local_file.package_json,
    local_file.router_index,
    local_file.ai_model_router,
    local_file.cost_optimizer,
    local_file.build_script
  ]
  
  provisioner "local-exec" {
    command = "chmod +x ${path.module}/build-layer.sh && ${path.module}/build-layer.sh"
  }
  
  # Rebuild when source files change
  triggers = {
    package_json = local_file.package_json.content
    router_index = local_file.router_index.content
    ai_model_router = local_file.ai_model_router.content
    cost_optimizer = local_file.cost_optimizer.content
  }
}

# AI Provider API Keys in Secrets Manager
resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${var.layer_name}-openai-key-${var.environment}"
  description = "OpenAI API key for ${var.layer_name}"
  
  tags = merge(var.tags, {
    Name = "${var.layer_name}-openai-key"
    Component = "ai-model-router"
  })
}

resource "aws_secretsmanager_secret" "claude_api_key" {
  name        = "${var.layer_name}-claude-key-${var.environment}"
  description = "Claude API key for ${var.layer_name}"
  
  tags = merge(var.tags, {
    Name = "${var.layer_name}-claude-key"
    Component = "ai-model-router"
  })
}

resource "aws_secretsmanager_secret" "gemini_api_key" {
  name        = "${var.layer_name}-gemini-key-${var.environment}"
  description = "Gemini API key for ${var.layer_name}"
  
  tags = merge(var.tags, {
    Name = "${var.layer_name}-gemini-key"
    Component = "ai-model-router"
  })
}

# Lambda Layer
resource "aws_lambda_layer_version" "ai_model_router" {
  depends_on = [null_resource.build_layer]
  
  filename         = "${path.module}/${local.layer_filename}"
  layer_name       = "${var.layer_name}-${var.environment}"
  description      = var.description
  
  compatible_runtimes = [var.runtime]
  
  source_code_hash = filebase64sha256("${path.module}/${local.layer_filename}")
}

# IAM policy for Lambda functions using this layer
resource "aws_iam_policy" "ai_model_router_policy" {
  name        = "${var.layer_name}-policy-${var.environment}"
  description = "IAM policy for Lambda functions using AI Model Router layer"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.openai_api_key.arn,
          aws_secretsmanager_secret.claude_api_key.arn,
          aws_secretsmanager_secret.gemini_api_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
  
  tags = var.tags
}

# CloudWatch Log Group for monitoring AI Model Router usage
resource "aws_cloudwatch_log_group" "ai_model_router_metrics" {
  name              = "/aws/lambda/ai-model-router/${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = merge(var.tags, {
    Name = "${var.layer_name}-metrics"
    Component = "ai-model-router"
  })
}

# Outputs
output "layer_arn" {
  description = "ARN of the AI Model Router Lambda layer"
  value       = aws_lambda_layer_version.ai_model_router.arn
}

output "layer_version" {
  description = "Version of the AI Model Router Lambda layer"
  value       = aws_lambda_layer_version.ai_model_router.version
}

output "iam_policy_arn" {
  description = "ARN of the IAM policy for using this layer"
  value       = aws_iam_policy.ai_model_router_policy.arn
}

output "openai_secret_arn" {
  description = "ARN of the OpenAI API key secret"
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

output "claude_secret_arn" {
  description = "ARN of the Claude API key secret"
  value       = aws_secretsmanager_secret.claude_api_key.arn
}

output "gemini_secret_arn" {
  description = "ARN of the Gemini API key secret"
  value       = aws_secretsmanager_secret.gemini_api_key.arn
}

output "configuration" {
  description = "Environment variables for Lambda functions using this layer"
  value = {
    AI_ROUTER_LAYER_ARN = aws_lambda_layer_version.ai_model_router.arn
    REDIS_ENDPOINT = var.redis_endpoint
    DATABASE_URL = var.database_url
    ENABLE_COST_OPTIMIZATION = var.enable_cost_optimization
    DAILY_BUDGET_LIMIT = local.environment_config.daily_budget
    MONTHLY_BUDGET_LIMIT = local.environment_config.monthly_budget
    OPENAI_SECRET_ARN = aws_secretsmanager_secret.openai_api_key.arn
    CLAUDE_SECRET_ARN = aws_secretsmanager_secret.claude_api_key.arn
    GEMINI_SECRET_ARN = aws_secretsmanager_secret.gemini_api_key.arn
  }
}