# Infrastructure Development Context - Claude Guide

**🤖 Claude Development Context for Infrastructure Management**

## 📋 **Context Scope**

When working on infrastructure tasks, this context guide provides Claude with the essential information for efficient AI-assisted development.

### **Primary Focus Areas:**
- Terraform module development and maintenance
- AWS resource configuration and optimization
- Infrastructure deployment and troubleshooting
- Environment-specific configurations
- Cost optimization and security hardening

---

## 🎯 **Key Files for Infrastructure Work**

### **Essential Files to Read:**
```bash
# Infrastructure overview and architecture
infrastructure/README.md

# Environment configurations
infrastructure/terraform/environments/dev/main.tf
infrastructure/terraform/environments/prod/main.tf

# Core modules (read as needed)
infrastructure/terraform/modules/ai-agent-orchestrator/main.tf
infrastructure/terraform/modules/lambda-function/main.tf
infrastructure/terraform/modules/s3-cloudfront-pwa/main.tf
```

### **Configuration Files:**
```bash
# Environment-specific variables
infrastructure/terraform/environments/dev/terraform.tfvars
infrastructure/terraform/environments/prod/terraform.tfvars

# Module-specific configurations
infrastructure/terraform/modules/[module-name]/main.tf
infrastructure/terraform/modules/[module-name]/variables.tf
infrastructure/terraform/modules/[module-name]/outputs.tf
```

### **Documentation References:**
```bash
# Migration context and decisions
../docs/MIGRATION-STATUS-GUIDE.md
../docs/ADR-011-Hybrid-Modular-Monorepo-Consolidation.md

# GitHub Actions integration
../.github/workflows/deploy-ai-agents.yml
```

---

## 🏗️ **Infrastructure Architecture Context**

### **Current Environment Status:**
- **Development**: `infrastructure/terraform/environments/dev/` - Active, ready for deployment
- **Production**: `infrastructure/terraform/environments/prod/` - Live services, requires careful changes
- **Staging**: `infrastructure/terraform/environments/staging/` - Available for testing
- **Prod-Minimal**: `infrastructure/terraform/environments/prod-minimal/` - S3 + CloudFront only

### **Key AWS Services:**
```hcl
# Core services managed by this infrastructure
- Lambda Functions (7 functions)
- API Gateway (HTTP endpoints for each Lambda)
- AppSync GraphQL (unified API layer)
- Aurora PostgreSQL Serverless (auto-scaling database)
- ElastiCache Redis (caching and sessions)
- S3 + CloudFront (PWA hosting)
- SQS Queues (async message processing)
- EventBridge (scheduled automation)
```

### **Production URLs (DO NOT BREAK):**
- **Ideas PWA**: https://dc275i5wdcepx.cloudfront.net
- **BMC PWA**: https://d1u91xxklexz0v.cloudfront.net
- **AI Agent API**: Various Lambda function URLs

---

## 🔧 **Common Development Tasks**

### **1. Adding New Lambda Function**
```bash
# Files to modify:
1. Create new module: infrastructure/terraform/modules/new-lambda-function/
2. Add to environment: infrastructure/terraform/environments/dev/main.tf
3. Update variables: infrastructure/terraform/environments/dev/terraform.tfvars
4. Test deployment: terraform plan && terraform apply
```

### **2. Modifying Existing Resources**
```bash
# Workflow for changes:
1. Read current configuration in relevant environment
2. Identify module dependencies in infrastructure/terraform/modules/
3. Test changes in dev environment first
4. Apply to staging for validation
5. Deploy to production with approval
```

### **3. Environment-Specific Configuration**
```bash
# Each environment has specific settings:
- Dev: Lower resource allocation, test data, debug logging
- Staging: Production-like resources, real data for testing
- Prod: Optimized resources, production data, minimal logging
```

### **4. Cost Optimization Tasks**
```bash
# Common optimization areas:
- Lambda memory/timeout settings
- Aurora serverless capacity settings
- Redis instance sizes
- S3 lifecycle policies
- CloudWatch log retention
```

---

## ⚠️ **Critical Safety Guidelines**

### **Production Safety Rules:**
1. **NEVER** run `terraform destroy` in production without explicit approval
2. **ALWAYS** test changes in dev environment first
3. **REVIEW** terraform plan output before applying any changes
4. **PRESERVE** all existing resource names and configurations
5. **MAINTAIN** zero-downtime deployment patterns

### **State Management:**
```bash
# Important state considerations:
- State files are managed remotely (S3 backend)
- State locking prevents concurrent modifications
- Always run terraform refresh before making changes
- Backup state before major infrastructure changes
```

### **Resource Naming Conventions:**
```bash
# Consistent naming pattern:
{project_name}-{service_name}-{environment}

# Examples:
ai-business-factory-data-collector-dev
ai-business-factory-pwa-workspace-prod
```

---

## 🚀 **Development Workflow**

### **Standard Infrastructure Change Process:**

#### **Phase 1: Planning**
```bash
# 1. Understand the change requirements
# 2. Read current infrastructure configuration
# 3. Identify affected resources and dependencies
# 4. Plan testing strategy
```

#### **Phase 2: Development**
```bash
# 1. Create feature branch for infrastructure changes
cd infrastructure/terraform/environments/dev

# 2. Make changes to appropriate files
# 3. Format and validate Terraform code
terraform fmt -recursive
terraform validate

# 4. Review planned changes
terraform plan -no-color > terraform-plan.txt
# Review terraform-plan.txt for expected changes
```

#### **Phase 3: Testing**
```bash
# 1. Apply changes to dev environment
terraform apply

# 2. Test affected services and endpoints
# 3. Validate resource configuration and costs
# 4. Document any issues or unexpected behavior
```

#### **Phase 4: Deployment**
```bash
# 1. Apply changes to staging (if applicable)
# 2. Validate staging deployment
# 3. Apply to production with proper approval
# 4. Monitor deployment and resource health
```

---

## 📊 **Common Troubleshooting**

### **Terraform Issues:**
```bash
# State lock issues
terraform force-unlock [LOCK_ID]

# Provider version conflicts
terraform init -upgrade

# Module changes not detected
terraform get -update

# Resource drift detection
terraform refresh
terraform plan -detailed-exitcode
```

### **AWS Service Issues:**
```bash
# Lambda function problems
- Check CloudWatch logs: /aws/lambda/[function-name]
- Verify IAM permissions and roles
- Check environment variables and configuration

# Database connectivity issues
- Verify security group settings
- Check VPC configuration
- Validate connection strings and credentials

# API Gateway issues
- Check CORS configuration
- Verify Lambda integration settings
- Review API Gateway logs
```

### **Cost Optimization Checks:**
```bash
# Regular cost review items:
- Lambda memory allocations and execution times
- Aurora serverless min/max capacity settings
- Redis instance utilization
- S3 storage class optimization
- CloudWatch log retention periods
```

---

## 🎯 **Context-Specific Guidelines**

### **When Working on Lambda Functions:**
- Always check existing IAM roles and permissions
- Verify environment variable configurations
- Consider memory and timeout optimizations
- Test both cold start and warm execution paths

### **When Working on Database Resources:**
- Review backup and restore procedures
- Consider data migration requirements
- Validate security group and VPC settings
- Test connection from Lambda functions

### **When Working on API Gateway:**
- Verify CORS settings for PWA integration
- Check rate limiting and throttling settings
- Test integration with Lambda functions
- Validate request/response mappings

### **When Working on S3/CloudFront:**
- Consider cache invalidation requirements
- Review security headers and access policies
- Test PWA functionality after changes
- Verify proper SPA routing configuration

---

## 📋 **Pre-Change Checklist**

Before making any infrastructure changes:

- [ ] **Read current configuration** - Understand existing setup
- [ ] **Check dependencies** - Identify resources that might be affected
- [ ] **Review costs** - Estimate impact of changes on monthly costs
- [ ] **Plan testing** - Define how to validate changes work correctly
- [ ] **Check production impact** - Ensure changes won't break live services
- [ ] **Prepare rollback** - Know how to revert changes if needed
- [ ] **Update documentation** - Plan to update relevant docs after changes

---

## 🔗 **Related Documentation**

### **Must-Read Context:**
- [Migration Status Guide](../docs/MIGRATION-STATUS-GUIDE.md) - Current migration phase and status
- [ADR-011](../docs/ADR-011-Hybrid-Modular-Monorepo-Consolidation.md) - Architectural decisions
- [Infrastructure README](./README.md) - Complete infrastructure overview

### **Reference Documentation:**
- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**💡 Quick Context Summary for Claude:**

When working on infrastructure tasks:
1. **Infrastructure is now part of monorepo** (consolidated from external repo)
2. **Production services are live** - be extremely careful with changes
3. **Use dev environment** for testing changes first
4. **Terraform state is managed remotely** with S3 backend
5. **GitHub Actions deploy automatically** from this local infrastructure
6. **Cost optimization is important** - AWS spend ~$75-85/month for dev
7. **Zero-downtime deployments required** for production changes

**Current Phase**: Phase 1 complete (infrastructure consolidated) ✅  
**Next Phase**: Repository consolidation with domain boundaries  
**Production Status**: All services healthy and operational