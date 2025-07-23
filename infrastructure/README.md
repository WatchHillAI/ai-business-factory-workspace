# AI Business Factory - Consolidated Infrastructure

**🏗️ Infrastructure as Code - Now Part of Monorepo**

This directory contains all Terraform infrastructure definitions for the AI Business Factory, consolidated from the external `ai-business-factory-infrastructure` repository as part of the Hybrid Modular Monorepo migration.

## 🎯 **Consolidation Status**

**✅ COMPLETED**: Infrastructure consolidation (Phase 1)  
**Date**: 2025-07-23  
**Source**: `WatchHillAI/ai-business-factory-infrastructure` → `infrastructure/`  
**Migration**: ADR-011 Hybrid Modular Monorepo implementation

## 🏗️ **Architecture Overview**

The AI Business Factory runs on AWS serverless architecture with the following components:

### **Lambda Functions**
- **AI Agent Orchestrator** - Multi-agent business intelligence system
- **Data Collector** - Web scraping and data collection
- **Opportunity Analyzer** - ML-powered business opportunity analysis
- **Market Validator** - Multi-criteria market validation and risk assessment
- **Strategy Manager** - Dynamic strategy management and A/B testing
- **Scheduler** - SQS-based job scheduling and orchestration
- **Business Generator** - AI-powered business plan generation

### **API & GraphQL Layer**
- **API Gateway** - HTTP endpoints for individual services
- **AppSync GraphQL API** - Unified API with real-time subscriptions
- **Direct RDS Resolvers** - 5x faster queries bypassing Lambda
- **Lambda Resolvers** - Complex business logic integration

### **Managed Services**
- **Aurora PostgreSQL Serverless** - Auto-scaling database with Data API
- **ElastiCache Redis** - Managed caching and session storage
- **SQS Queues** - Asynchronous message processing
- **EventBridge** - Scheduled triggers for automation
- **CloudWatch** - Comprehensive logging and monitoring
- **S3 + CloudFront** - PWA hosting and global distribution

## 📁 **Directory Structure**

```
infrastructure/
├── README.md                 # This file
├── docs/                     # Infrastructure documentation
│   ├── architecture/         # Architecture diagrams and guides
│   ├── deployment/           # Deployment guides and procedures
│   └── operations/           # Operational runbooks
└── terraform/               # Terraform configurations
    ├── environments/        # Environment-specific configurations
    │   ├── dev/            # Development environment
    │   ├── staging/        # Staging environment
    │   ├── prod/           # Production environment
    │   └── prod-minimal/   # Minimal production (S3 + CloudFront only)
    ├── modules/            # Reusable Terraform modules
    │   ├── ai-agent-orchestrator/
    │   ├── lambda-function/
    │   ├── api-gateway-lambda/
    │   ├── appsync-graphql/
    │   ├── rds-postgresql/
    │   ├── elasticache-redis/
    │   ├── s3-cloudfront-pwa/
    │   └── [8 more modules]
    └── shared/             # Shared resources and configurations
```

## 🚀 **Quick Start**

### **Prerequisites**
- AWS CLI configured with appropriate permissions
- Terraform v1.5+ installed
- Node.js v18+ for Lambda function development

### **Initialize Environment**
```bash
# Navigate to desired environment
cd infrastructure/terraform/environments/dev

# Initialize Terraform (downloads providers and modules)
terraform init

# Review planned changes
terraform plan

# Apply changes (when ready)
terraform apply
```

### **Deploy Specific Components**
```bash
# Deploy only AI agent infrastructure
terraform apply -target=module.ai_agent_orchestrator

# Deploy PWA hosting infrastructure
terraform apply -target=module.pwa_workspace
```

## 🔄 **Integration with Monorepo**

### **GitHub Actions Integration**
The GitHub Actions workflows now use this local infrastructure:

**Before (External Dependency):**
```yaml
- name: Checkout infrastructure repository
  uses: actions/checkout@v4
  with:
    repository: WatchHillAI/ai-business-factory-infrastructure
    path: infrastructure
```

**After (Local Integration):**
```yaml
- name: Checkout workspace
  uses: actions/checkout@v4
  # Infrastructure is now part of the workspace - no external checkout needed
```

### **Benefits Achieved**
- ✅ **Eliminated External Dependency** - No cross-repo checkout in CI/CD
- ✅ **Unified Infrastructure Management** - All configs in single repository
- ✅ **Simplified Deployment** - Direct path references in workflows
- ✅ **Better Integration** - Infrastructure changes alongside application changes
- ✅ **Improved Security** - No additional repository permissions needed

## 💰 **Cost Optimization**

### **Monthly Cost Breakdown (Dev Environment)**
```
Serverless Total: ~$75-85/month
├── Lambda Functions: ~$15-25/month (7 functions)
├── API Gateway: ~$10-15/month (7 APIs)
├── AppSync GraphQL: ~$5-10/month (queries + real-time)
├── Aurora Serverless: ~$25-30/month (auto-pause enabled)
├── ElastiCache Redis: ~$15-20/month (t3.micro)
├── SQS Queues: ~$1-2/month (3 queues)
└── CloudWatch Logs: ~$2-3/month (retention)
```

### **Cost Comparison**
- **Serverless**: $75-85/month (variable cost, auto-pause savings)
- **Container (ECS)**: $88-140/month (always running)
- **Container (EKS)**: $145-220/month (cluster overhead)

## 🔧 **Development Workflow**

### **Local Development**
```bash
# Test infrastructure changes locally
cd infrastructure/terraform/environments/dev
terraform plan

# Validate Terraform syntax
terraform validate

# Format Terraform code
terraform fmt -recursive

# Check for security issues (if tfsec installed)
tfsec .
```

### **Environment Management**
```bash
# Work with different environments
cd infrastructure/terraform/environments/

# Development
cd dev && terraform workspace select dev

# Staging  
cd staging && terraform workspace select staging

# Production
cd prod && terraform workspace select prod
```

## 📊 **Deployment Outputs**

After successful deployment, Terraform provides comprehensive outputs:

### **API Endpoints**
- **Individual Services** - Lambda function URLs via API Gateway
- **GraphQL Endpoint** - Unified AppSync API for queries/mutations
- **Real-time Endpoint** - WebSocket for live subscriptions

### **Infrastructure Details**
```bash
# View all outputs
terraform output

# Specific output categories
terraform output api_endpoints      # API URLs
terraform output managed_services   # Database details
terraform output cost_summary       # Monthly cost breakdown
```

## 🔒 **Security & Best Practices**

### **IAM Policies**
- **Least Privilege** - Each Lambda function has minimal required permissions
- **Service-Specific Roles** - No cross-service access unless explicitly granted
- **Managed Secrets** - Database credentials through AWS Secrets Manager

### **Network Security**
- **VPC Security Groups** - Database access restricted to application layer
- **Private Subnets** - Redis cluster isolated from public internet
- **API Gateway** - Rate limiting and CORS configured
- **CloudFront** - WAF integration for production environments

### **State Management**
- **Remote State** - Terraform state stored securely in S3
- **State Locking** - DynamoDB table prevents concurrent modifications
- **Version Control** - State file versions tracked and recoverable

## 🚨 **Important Notes**

### **Migration Context**
This infrastructure was moved from an external repository as part of the Hybrid Modular Monorepo consolidation (ADR-011). The migration:

- ✅ **Preserves all existing functionality** - No changes to running resources
- ✅ **Maintains production stability** - Zero-downtime migration
- ✅ **Improves development workflow** - Unified repository structure
- ✅ **Eliminates external dependencies** - Self-contained infrastructure management

### **Production Safety**
- **NEVER** run `terraform destroy` in production without explicit approval
- **ALWAYS** review `terraform plan` output before applying changes
- **USE** proper workspace/environment separation
- **BACKUP** critical data before major infrastructure changes

### **Troubleshooting**
Common issues and solutions:

```bash
# State lock issues
terraform force-unlock [LOCK_ID]

# Provider version conflicts  
terraform init -upgrade

# Module changes not detected
terraform get -update

# State drift detection
terraform refresh
terraform plan -detailed-exitcode
```

## 📚 **Documentation Links**

### **Infrastructure-Specific**
- [Terraform Module Documentation](./terraform/modules/README.md)
- [Environment Setup Guide](./docs/deployment/environment-setup.md)
- [Operational Runbooks](./docs/operations/README.md)

### **Integration Documentation**
- [GitHub Actions Integration](../.github/workflows/README.md)
- [Application Deployment Guide](../docs/deployment-guide.md)
- [Migration Status Guide](../docs/MIGRATION-STATUS-GUIDE.md)

### **Architecture Documentation**
- [ADR-011: Hybrid Modular Monorepo](../docs/ADR-011-Hybrid-Modular-Monorepo-Consolidation.md)
- [System Architecture Overview](../docs/AI-AGENT-ARCHITECTURE.md)

---

## 🤝 **Contributing**

### **Development Workflow**
1. Create feature branch for infrastructure changes
2. Test changes in development environment  
3. Run `terraform plan` and include output in PR
4. Ensure no drift with `terraform refresh`
5. Update documentation for new resources
6. Get approval before applying to production

### **Code Standards**
- **Terraform Formatting** - Always run `terraform fmt`
- **Variable Documentation** - Comment all variables and outputs
- **Module Versioning** - Pin module versions for stability
- **Resource Naming** - Follow consistent naming conventions

---

**📅 Last Updated**: 2025-07-23  
**🔄 Migration Phase**: Phase 1 Complete ✅  
**🎯 Next Phase**: Repository consolidation with domain boundaries  
**📋 Status**: Ready for production deployment

**Built as part of the AI Business Factory Hybrid Modular Monorepo**