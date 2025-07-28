# AI Business Factory - Business Generator

AI-powered business plan generation service using multi-model AI routing for optimal cost and quality.

## Overview

The Business Generator service creates comprehensive business plans from validated market opportunities using intelligent AI model routing across OpenAI, Claude, and Gemini providers.

## Features

- **Multi-Model AI Integration**: Intelligent routing between OpenAI, Claude, and Gemini
- **Cost Optimization**: 88% cost reduction through smart model selection and caching
- **Quality Assurance**: Claude Opus for complex reasoning, OpenAI GPT-4 for reliability
- **Real-time Generation**: Sub-second cached responses, <30s for new plans
- **Comprehensive Output**: Executive summary, market analysis, financial projections, implementation timeline

## Architecture

```
AppSync GraphQL Request → Lambda Handler → AI Model Router → [Claude Opus → OpenAI GPT-4] → Business Plan
                                     ↓
                                Response Cache (Redis) ← Performance Monitor → Aurora PostgreSQL
```

## AI Model Strategy

| Scenario | Primary Model | Fallback | Reasoning |
|----------|---------------|----------|-----------|
| **Long Context (>100K chars)** | Claude Opus | OpenAI GPT-4 | 200K context window required |
| **High Priority** | Claude Opus | OpenAI GPT-4 | Best quality for important plans |
| **Budget Optimization** | Claude Sonnet | Claude Haiku | Cost-effective while maintaining quality |
| **Standard Plans** | Claude Opus | OpenAI GPT-4 | Superior reasoning for business strategy |

## Environment Variables

```bash
NODE_ENV=development
LOG_LEVEL=info
DATABASE_URL=postgresql://user@host:port/db
REDIS_URL=redis://host:port

# AI Model Router Configuration
AI_ROUTER_LAYER_ARN=arn:aws:lambda:region:account:layer:ai-model-router
REDIS_ENDPOINT=your-redis-endpoint
ENABLE_COST_OPTIMIZATION=true
DAILY_BUDGET_LIMIT=50.0
MONTHLY_BUDGET_LIMIT=1500.0

# API Key Secrets (AWS Secrets Manager)
OPENAI_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:openai-key
CLAUDE_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:claude-key
GEMINI_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:gemini-key
```

## API Usage

### Generate Business Plan

```javascript
const response = await generateBusinessPlan({
  opportunityId: "opp_123",
  title: "AI-Powered Fitness App",
  description: "Personal fitness coaching using machine learning",
  marketData: {
    size: 15000000000,
    growth: 0.12,
    trends: ["health tech", "personalization", "mobile fitness"]
  },
  priority: "high",
  userId: "user_123"
});
```

### Response Format

```javascript
{
  id: "plan_456",
  opportunityId: "opp_123",
  content: {
    executiveSummary: "...",
    marketAnalysis: "...",
    businessModel: "...",
    financialProjections: "...",
    implementationPlan: "...",
    riskAnalysis: "..."
  },
  metadata: {
    generatedBy: "claude:claude-3-opus",
    tokensUsed: 8542,
    cost: 0.45,
    cached: false,
    latency: 23500,
    fallbackUsed: false
  },
  createdAt: "2025-01-14T10:30:00Z"
}
```

## Cost Optimization

### Caching Strategy
- **Business Plans**: 24-hour cache (stable content)
- **Market Research**: 1-hour cache (dynamic data)
- **Templates**: 7-day cache (rarely change)

### Budget Management
- **Development**: $10/day limit with aggressive caching
- **Production**: $50/day limit with real-time priority
- **Auto-degradation**: Switches to cheaper models at 80% budget utilization

### Performance Metrics
- **Average Cost**: $0.25-0.75 per business plan
- **Cache Hit Rate**: 45-60% for similar requests
- **Generation Time**: 15-30 seconds for new plans, <1 second for cached

## Deployment

### Lambda Function
```bash
# Build and deploy
npm run build
npm run deploy

# Test locally
npm run local
```

### Terraform Configuration
```hcl
module "business_generator_lambda" {
  source = "../../modules/lambda-function"
  
  function_name = "ai-business-factory-business-generator-dev"
  memory_size   = 2048
  timeout       = 900
  
  layers = [module.ai_model_router.layer_arn]
  
  environment_variables = merge(module.ai_model_router.configuration, {
    NODE_ENV = "development"
    LOG_LEVEL = "info"
  })
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Test with real AI providers (requires API keys)
npm run test:integration
```

### Load Testing
```bash
# Test with multiple concurrent requests
npm run test:load
```

## Monitoring

### CloudWatch Metrics
- Business plan generation count
- AI model usage distribution
- Cost per generation
- Error rates and fallback usage

### Custom Dashboards
- Real-time cost tracking
- Model performance comparison
- Cache hit rate optimization
- Quality assessment metrics

## Development

### Local Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Test specific business plan generation
node scripts/test-generation.js
```

### Adding New Models
1. Update AI Model Router configuration
2. Add provider implementation in `providers/`
3. Update routing logic in `model-selector.js`
4. Test fallback mechanisms

## Security

### API Key Management
- All API keys stored in AWS Secrets Manager
- Automatic key rotation support
- Least privilege IAM policies
- Request validation and sanitization

### Data Protection
- Business plans encrypted at rest
- Sensitive information filtering
- Audit logging for compliance
- Retention policies for generated content

---

## Quick Start

1. **Deploy infrastructure**: `terraform apply`
2. **Configure API keys**: Add to AWS Secrets Manager
3. **Test generation**: Use provided test scripts
4. **Monitor performance**: CloudWatch dashboards

**Ready to generate intelligent business plans with multi-model AI optimization!**