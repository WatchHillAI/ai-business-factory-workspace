# AI Agent System - AWS Deployment Setup Guide

Complete guide for deploying and configuring the AI Business Factory AI Agent System on AWS infrastructure.

## 🏗️ **Overview**

The AI Agent System extends your existing AWS serverless infrastructure with:
- **AI Agent Orchestrator Lambda** - Coordinates multiple AI agents
- **Market Research Agent** - Problem validation and market intelligence
- **Database Schema** - Stores detailed analysis results
- **GraphQL Resolvers** - Real-time API endpoints
- **External Data Sources** - Google Trends, Crunchbase, SEMrush integration

## 📋 **Prerequisites**

### **Required Tools**
```bash
# Verify installations
node --version          # ≥18.0.0
npm --version           # ≥9.0.0
terraform --version     # ≥1.5.0
aws --version           # ≥2.0.0

# AWS CLI configuration
aws configure list
aws sts get-caller-identity
```

### **Required Permissions**
Your AWS user/role needs:
- Lambda function creation and management
- API Gateway management
- AppSync GraphQL API management
- RDS/Aurora access
- Secrets Manager read/write
- IAM role creation
- CloudWatch Logs access

## 🚀 **Phase 1: Core Infrastructure Deployment**

### **Step 1: Deploy AI Agent Infrastructure**

```bash
# Navigate to workspace
cd /Users/cnorton/Development/ai-business-factory-workspace

# Run deployment script
./scripts/deploy-ai-agents.sh

# Or manual deployment:
cd /Users/cnorton/Development/ai-business-factory-infrastructure/terraform/environments/dev
terraform init
terraform plan -out=tfplan-ai-agents
terraform apply tfplan-ai-agents
```

### **Step 2: Verify Infrastructure Deployment**

```bash
# Check deployed resources
terraform output lambda_functions
terraform output api_endpoints

# Expected outputs:
# - ai_agent_orchestrator.name
# - ai_agent_orchestrator.api_url
# - ai_agent_orchestrator.arn
```

### **Step 3: Run Database Migration**

```bash
# Connect to Aurora Serverless cluster
aws rds-data execute-statement \
  --resource-arn "arn:aws:rds:us-east-1:ACCOUNT:cluster:ai-business-factory-db-dev" \
  --secret-arn "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ai-business-factory-db-dev-secret" \
  --database "ai_business_factory" \
  --sql "$(cat /Users/cnorton/Development/ai-business-factory-infrastructure/database/migrations/003_ai_agent_detailed_ideas.sql)"

# Or run via psql if you have database access
```

## 🔑 **Phase 2: External API Configuration**

### **Step 1: Create API Key Secrets**

The AI Agent System integrates with external data sources. Configure API keys in AWS Secrets Manager:

#### **Google Trends API**
```bash
# Create secret for Google Trends API key
aws secretsmanager create-secret \
  --name "ai-business-factory/google-trends-api-key" \
  --description "Google Trends API key for market signal analysis" \
  --secret-string "YOUR_GOOGLE_TRENDS_API_KEY_HERE"
```

#### **Crunchbase API**
```bash
# Create secret for Crunchbase API key
aws secretsmanager create-secret \
  --name "ai-business-factory/crunchbase-api-key" \
  --description "Crunchbase API key for funding and company data" \
  --secret-string "YOUR_CRUNCHBASE_API_KEY_HERE"
```

#### **SEMrush API**
```bash
# Create secret for SEMrush API key
aws secretsmanager create-secret \
  --name "ai-business-factory/semrush-api-key" \
  --description "SEMrush API key for competitive analysis and market research" \
  --secret-string "YOUR_SEMRUSH_API_KEY_HERE"
```

### **Step 2: Verify API Key Configuration**

```bash
# Test secret retrieval
aws secretsmanager get-secret-value \
  --secret-id "ai-business-factory/google-trends-api-key" \
  --query "SecretString" --output text

aws secretsmanager get-secret-value \
  --secret-id "ai-business-factory/crunchbase-api-key" \
  --query "SecretString" --output text

aws secretsmanager get-secret-value \
  --secret-id "ai-business-factory/semrush-api-key" \
  --query "SecretString" --output text
```

## 🧪 **Phase 3: Testing and Validation**

### **Step 1: Health Check**

```bash
# Get API Gateway URL from Terraform output
API_URL=$(terraform output -raw lambda_functions | jq -r '.ai_agent_orchestrator.api_url')

# Test health endpoint
curl -X GET "${API_URL}/health"

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-07-21T...",
#   "agents": { "market-research": { "status": "ready" } },
#   "version": "1.0.0"
# }
```

### **Step 2: AI Agent Analysis Test**

```bash
# Test idea analysis
curl -X POST "${API_URL}/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "ideaText": "AI-powered customer support platform for small businesses that provides 24/7 automated responses, ticket routing, and sentiment analysis",
    "userContext": {
      "industry": "B2B SaaS",
      "budget": "moderate",
      "timeline": "6-12 months",
      "experienceLevel": "intermediate"
    }
  }'

# Expected response structure:
# {
#   "success": true,
#   "data": {
#     "id": "ai-1642781234567",
#     "title": "AI-powered customer support platform...",
#     "marketAnalysis": { ... },
#     "overview": { "confidenceScore": 0.87 }
#   },
#   "metadata": {
#     "processingTime": 4200,
#     "confidence": 0.87,
#     "agentsExecuted": ["market-research"]
#   }
# }
```

### **Step 3: GraphQL API Testing**

```bash
# Get GraphQL endpoint
GRAPHQL_URL=$(terraform output -raw managed_services | jq -r '.graphql.graphql_endpoint')
API_KEY=$(terraform output -raw managed_services | jq -r '.graphql.api_key')

# Test GraphQL query
curl -X POST "${GRAPHQL_URL}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "query": "query { aiAgentHealth { status timestamp agents { agentId status } } }"
  }'

# Test GraphQL mutation
curl -X POST "${GRAPHQL_URL}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "query": "mutation AnalyzeIdea($input: IdeaAnalysisInput!) { analyzeIdea(input: $input) { success analysisId confidence marketResearch { confidence problemStatement { summary } } } }",
    "variables": {
      "input": {
        "ideaText": "AI-powered inventory management for restaurants",
        "userContext": { "industry": "Restaurant Tech" }
      }
    }
  }'
```

## 📊 **Phase 4: Ideas PWA Integration**

### **Step 1: Update Ideas PWA Configuration**

Update the Ideas PWA to use the AI Agent API:

```typescript
// apps/idea-cards-pwa/src/config/api.ts
export const API_CONFIG = {
  // Existing configuration...
  
  // AI Agent System
  AI_AGENT_API_URL: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev',
  GRAPHQL_ENDPOINT: 'https://your-appsync-graphql-url.appsync-api.us-east-1.amazonaws.com/graphql',
  GRAPHQL_API_KEY: 'your-appsync-api-key-here'
};
```

### **Step 2: Create AI Analysis Service**

```typescript
// apps/idea-cards-pwa/src/services/aiAnalysisService.ts
import { API_CONFIG } from '../config/api';
import { DetailedIdea } from '../types/detailedIdea';

export class AIAnalysisService {
  static async analyzeIdea(ideaText: string, userContext?: any): Promise<DetailedIdea> {
    const response = await fetch(`${API_CONFIG.AI_AGENT_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ideaText,
        userContext: userContext || {}
      })
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'AI analysis failed');
    }

    return result.data;
  }

  static async getAnalysisStatus(): Promise<any> {
    const response = await fetch(`${API_CONFIG.AI_AGENT_API_URL}/health`);
    return response.json();
  }
}
```

### **Step 3: Update UI Components**

```typescript
// apps/idea-cards-pwa/src/components/IdeaGenerationForm.tsx
import { AIAnalysisService } from '../services/aiAnalysisService';

// Add AI-powered idea generation
const handleAIGeneration = async (userInput: string) => {
  setLoading(true);
  try {
    const detailedIdea = await AIAnalysisService.analyzeIdea(userInput, {
      industry: selectedIndustry,
      budget: selectedBudget,
      timeline: selectedTimeline
    });
    
    // Navigate to detail view with AI-generated idea
    navigate(`/idea/${detailedIdea.id}`, { state: { idea: detailedIdea } });
  } catch (error) {
    console.error('AI analysis failed:', error);
    showErrorNotification('AI analysis failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

## 📈 **Phase 5: Monitoring and Optimization**

### **Step 1: CloudWatch Monitoring Setup**

```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ai-business-factory-ai-agent-orchestrator"

# Stream logs in real-time
aws logs tail /aws/lambda/ai-business-factory-ai-agent-orchestrator-dev --follow

# Create CloudWatch dashboard for AI agents
aws cloudwatch put-dashboard \
  --dashboard-name "AI-Agent-System-Monitor" \
  --dashboard-body file://monitoring/ai-agent-dashboard.json
```

### **Step 2: Performance Monitoring**

```bash
# Check Lambda performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=ai-business-factory-ai-agent-orchestrator-dev \
  --statistics Average \
  --start-time 2025-07-21T00:00:00Z \
  --end-time 2025-07-21T23:59:59Z \
  --period 300

# Monitor error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=ai-business-factory-ai-agent-orchestrator-dev \
  --statistics Sum \
  --start-time 2025-07-21T00:00:00Z \
  --end-time 2025-07-21T23:59:59Z \
  --period 300
```

### **Step 3: Cost Monitoring**

```bash
# Check estimated costs
aws ce get-cost-and-usage \
  --time-period Start=2025-07-01,End=2025-07-21 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔧 **Troubleshooting Guide**

### **Common Issues**

#### **Lambda Function Not Found**
```bash
# Check if function was deployed
aws lambda list-functions --query 'Functions[?contains(FunctionName, `ai-agent-orchestrator`)].FunctionName'

# If missing, redeploy
terraform plan -target=module.ai_agent_orchestrator
terraform apply -target=module.ai_agent_orchestrator
```

#### **API Gateway 500 Errors**
```bash
# Check Lambda logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ai-business-factory-ai-agent-orchestrator-dev" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check API Gateway execution logs
aws apigateway get-method-response \
  --rest-api-id YOUR_API_ID \
  --resource-id YOUR_RESOURCE_ID \
  --http-method POST \
  --status-code 500
```

#### **Database Connection Issues**
```bash
# Test RDS Data API connection
aws rds-data execute-statement \
  --resource-arn "$(terraform output -raw managed_services | jq -r '.postgresql.cluster_arn')" \
  --secret-arn "$(terraform output -raw managed_services | jq -r '.postgresql.secret_arn')" \
  --database "ai_business_factory" \
  --sql "SELECT 1 as test"
```

#### **Missing API Keys**
```bash
# Verify all secrets exist
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `ai-business-factory`)].Name'

# Create missing secrets
aws secretsmanager create-secret \
  --name "ai-business-factory/missing-api-key" \
  --secret-string "your-api-key-value"
```

## 📚 **Additional Resources**

### **Documentation**
- [AI Agent Architecture](./AI-AGENT-ARCHITECTURE.md)
- [Implementation Specifications](./AGENT-IMPLEMENTATION-SPECS.md)
- [ADR-001: AI Agent System](./ADR-001-AI-Agent-System-Implementation.md)

### **API References**
- **REST API**: `{API_GATEWAY_URL}/analyze` (POST)
- **GraphQL API**: Use AppSync endpoint with `analyzeIdea` mutation
- **Health Check**: `{API_GATEWAY_URL}/health` (GET)

### **Support Channels**
- **CloudWatch Logs**: Detailed execution logs
- **AWS X-Ray**: Distributed tracing (if enabled)
- **GitHub Issues**: Bug reports and feature requests

## 🎯 **Next Steps**

1. **Phase 2 Agents**: Deploy Financial Modeling, Founder Fit, and Risk Assessment agents
2. **Production Scaling**: Move to production environment with enhanced monitoring
3. **Custom Training**: Fine-tune agents with your specific business domain data
4. **API Rate Limiting**: Implement usage quotas and throttling
5. **Multi-region**: Deploy across multiple AWS regions for global availability

---

**🚀 Your AI Agent System is now ready to transform simple business ideas into comprehensive market intelligence!**