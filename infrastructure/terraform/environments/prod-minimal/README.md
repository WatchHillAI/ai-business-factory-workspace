# Minimal Production Terraform Configuration

This configuration manages only the essential S3 + CloudFront infrastructure needed for PWA deployment in production.

## Purpose

This minimal configuration was created to:
1. **Avoid complexity**: Focus only on needed infrastructure (S3 + CloudFront)
2. **Prevent dependency issues**: Don't deploy Lambda/RDS/Redis until needed
3. **Enable proper IaC**: Manage production infrastructure through Terraform
4. **Maintain rollback capability**: Simple configuration is easier to troubleshoot

## What This Manages

- ✅ S3 bucket: `ai-business-factory-pwa-workspace-prod`
- ✅ CloudFront distributions for Ideas and BMC PWAs
- ✅ Origin Access Control (OAC) security
- ✅ Cache policies optimized for SPAs
- ✅ CloudFront functions for SPA routing

## What This DOESN'T Manage

- ❌ Lambda functions (not needed for static PWAs)
- ❌ RDS PostgreSQL (not deployed in production yet)
- ❌ Redis clusters (not deployed in production yet)
- ❌ API Gateway (not deployed in production yet)
- ❌ SQS queues (not deployed in production yet)

## Usage

```bash
# Initialize
terraform init

# Plan
terraform plan

# Apply (if already done via dev environment migration)
terraform apply

# Verify outputs
terraform output
```

## Migration Path

When ready to add backend services:
1. Use the full configuration in `../prod/main.tf`
2. Import existing S3/CloudFront resources to prevent recreation
3. Add Lambda/RDS/Redis modules incrementally

## Resource Names

- **S3 Bucket**: `ai-business-factory-pwa-workspace-prod`
- **CloudFront (Ideas)**: Auto-generated, outputs available
- **CloudFront (BMC)**: Auto-generated, outputs available

## Security

- OAC restricts S3 access to CloudFront only
- No public S3 bucket access
- HTTPS enforced on all distributions
- Security headers applied via CloudFront functions