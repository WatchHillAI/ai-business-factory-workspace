# AI Model Router - API Keys Setup Guide

This guide explains how to configure API keys for the AI Model Router multi-provider integration.

## Overview

The AI Model Router integrates with three AI providers:
- **OpenAI** (GPT-4 Turbo) - Primary for sentiment analysis
- **Claude** (Opus/Sonnet/Haiku) - Primary for business plan generation
- **Gemini** (Pro/Flash) - Primary for market analysis

## API Key Requirements

### 1. OpenAI API Key
- **Provider**: OpenAI
- **Sign up**: https://platform.openai.com/signup
- **API Key**: https://platform.openai.com/account/api-keys
- **Models needed**: `gpt-4-turbo`, `gpt-3.5-turbo`
- **Rate limits**: 500 RPM, 40K TPM (typical for tier 1)

### 2. Claude API Key
- **Provider**: Anthropic
- **Sign up**: https://console.anthropic.com/
- **API Key**: https://console.anthropic.com/account/keys
- **Models needed**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **Rate limits**: 4,000 RPM, 400K TPM (typical for tier 1)

### 3. Gemini API Key
- **Provider**: Google AI
- **Sign up**: https://makersuite.google.com/
- **API Key**: https://aistudio.google.com/app/apikey
- **Models needed**: `gemini-pro`, `gemini-pro-vision`
- **Rate limits**: 1,000 RPM, 1M TPM (free tier)

## Deployment Steps

### Step 1: Deploy Infrastructure
```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

This creates the AWS Secrets Manager secrets with placeholder values.

### Step 2: Update API Keys via AWS Console

1. **OpenAI API Key**:
   ```bash
   aws secretsmanager update-secret \
     --secret-id ai-model-router-openai-key-dev \
     --secret-string "sk-your-openai-api-key-here"
   ```

2. **Claude API Key**:
   ```bash
   aws secretsmanager update-secret \
     --secret-id ai-model-router-claude-key-dev \
     --secret-string "sk-ant-your-claude-api-key-here"
   ```

3. **Gemini API Key**:
   ```bash
   aws secretsmanager update-secret \
     --secret-id ai-model-router-gemini-key-dev \
     --secret-string "your-gemini-api-key-here"
   ```

### Step 3: Verify Configuration
```bash
# Check Lambda function has access to secrets
aws lambda get-function-configuration \
  --function-name ai-business-factory-opportunity-analyzer-dev \
  --query 'Environment.Variables'

# Test AI Model Router layer
aws lambda invoke \
  --function-name ai-business-factory-business-generator-dev \
  --payload '{"taskType": "business_plan", "prompt": "Test prompt"}' \
  response.json
```

## Cost Optimization Settings

### Development Environment
- **Daily Budget**: $10.00 (set in terraform/environments/dev/main.tf)
- **Monthly Budget**: $300.00
- **Cache TTL Multiplier**: 2.0 (longer caching for cost savings)
- **Batch Processing**: Enabled

### Production Environment (Planned)
- **Daily Budget**: $50.00
- **Monthly Budget**: $1,500.00
- **Cache TTL Multiplier**: 1.0 (normal caching)
- **Batch Processing**: Disabled (real-time priority)

## Budget Monitoring

### Real-time Cost Tracking
```bash
# Check current spend
aws logs filter-log-events \
  --log-group-name /aws/lambda/ai-model-router/dev \
  --filter-pattern "AI Request" \
  --start-time $(date -d '1 day ago' +%s)000

# Check budget utilization
redis-cli -h your-redis-endpoint get "cost:daily:$(date +%Y-%m-%d)"
```

### Budget Alerts
The AI Model Router automatically:
- **80% budget**: Switches to cheaper models
- **95% budget**: Triggers critical alerts
- **100% budget**: Blocks new requests

## Testing API Integration

### Test Script
```javascript
// test-ai-router.js
const { createRouter } = require('/opt/nodejs/index');

const router = createRouter({
  redisEndpoint: process.env.REDIS_ENDPOINT,
  enableCostOptimization: true
});

async function testRouting() {
  // Test business plan generation (Claude)
  const businessPlan = await router.route({
    taskType: 'business_plan',
    prompt: 'Create a business plan for a AI-powered fitness app',
    priority: 'high'
  });
  console.log('Business Plan:', businessPlan);
  
  // Test market analysis (Gemini)
  const marketAnalysis = await router.route({
    taskType: 'market_analysis',
    prompt: 'Analyze the fitness app market in 2024',
    priority: 'medium'
  });
  console.log('Market Analysis:', marketAnalysis);
  
  // Test sentiment analysis (OpenAI)
  const sentiment = await router.route({
    taskType: 'sentiment_analysis',
    prompt: 'This fitness app is amazing and changed my life!',
    priority: 'low'
  });
  console.log('Sentiment:', sentiment);
}

testRouting().catch(console.error);
```

### Lambda Test Event
```json
{
  "taskType": "business_plan",
  "prompt": "Generate a business plan for a sustainable energy startup",
  "context": "Focus on solar energy solutions for residential customers",
  "priority": "high",
  "userId": "test-user-123"
}
```

## Troubleshooting

### Common Issues

1. **API Key Authentication Failed**
   - Verify API key is correctly set in AWS Secrets Manager
   - Check IAM permissions for Lambda to access secrets
   - Ensure API key has correct permissions with provider

2. **Rate Limit Exceeded**
   - Check provider rate limits in console
   - Verify fallback logic is working
   - Consider upgrading provider tier

3. **High Costs**
   - Check cost optimization settings
   - Verify caching is enabled
   - Review model selection logic

### Debug Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/ai-business-factory-opportunity-analyzer-dev --follow

# Check AI Model Router metrics
aws logs tail /aws/lambda/ai-model-router/dev --follow

# Test secrets access
aws secretsmanager get-secret-value --secret-id ai-model-router-openai-key-dev
```

## Security Best Practices

### API Key Management
- **Rotate keys regularly** (every 90 days)
- **Use separate keys** for dev/staging/prod
- **Monitor usage** for unusual patterns
- **Implement least privilege** IAM policies

### Request Validation
- **Sanitize inputs** to prevent prompt injection
- **Validate request sizes** to prevent resource exhaustion
- **Implement rate limiting** per user/session
- **Log all requests** for audit trails

## Monitoring and Alerts

### CloudWatch Metrics
- AI model request count by provider
- Average response latency
- Error rates and fallback usage
- Cost per request by task type

### Custom Metrics
- Budget utilization percentage
- Cache hit rates
- Model selection distribution
- Quality scores by provider

---

## Next Steps

1. **Deploy infrastructure** with `terraform apply`
2. **Configure API keys** using AWS CLI or console
3. **Test integration** with provided test scripts
4. **Monitor costs** and adjust budgets as needed
5. **Scale to production** with higher rate limits

**Ready to deploy the AI Model Router with multi-provider intelligence and cost optimization!**