# GitHub Actions CI/CD Setup Guide

## Overview

This guide sets up automated deployment pipelines for the AI Business Factory workspace using GitHub Actions with proper AWS OIDC authentication and infrastructure management.

## Prerequisites

- [x] AWS Account with appropriate permissions
- [x] GitHub repository with Actions enabled
- [x] Terraform infrastructure modules configured
- [x] GitHub OIDC provider configured in AWS

## GitHub Secrets Configuration

### Required Repository Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

#### 1. AWS_ROLE_ARN
```
arn:aws:iam::519284856023:role/ai-business-factory-github-actions-dev
```

This is the IAM role that GitHub Actions will assume for AWS operations.

### GitHub Environments

Create the following environment in GitHub repository settings:

#### Development Environment
- **Name**: `development`
- **Protection Rules**: 
  - ✅ Required reviewers: 1 (optional for dev)
  - ✅ Wait timer: 0 minutes
  - ✅ Branch protection: `main` branch only

## Workflow Overview

### 1. Infrastructure Deployment (`infrastructure-deployment.yml`)

**Triggers:**
- Push to `main` branch with changes in `infrastructure/` directory
- Pull requests to `main` branch with infrastructure changes
- Manual workflow dispatch

**Jobs:**
1. **Plan**: 
   - Validates Terraform configuration
   - Generates execution plan
   - Comments plan on PR (if applicable)
   - Uploads plan artifact

2. **Deploy**: 
   - Runs only on `main` branch when plan shows changes
   - Applies Terraform plan
   - Requires `development` environment approval

3. **State Backup**:
   - Backs up Terraform state to git
   - Runs after successful deployment

### 2. PWA Deployment (`pwa-deployment.yml`)

**Triggers:**
- Push to `main` branch with changes in `domains/` or `packages/` directories
- Pull requests with application changes
- Manual workflow dispatch

**Jobs:**
1. **Test**:
   - Installs dependencies
   - Runs tests, linting, and type checking
   - Builds both PWA applications
   - Uploads build artifacts

2. **Deploy**:
   - Downloads build artifacts
   - Syncs files to S3 buckets
   - Invalidates CloudFront caches
   - Performs health checks

3. **Notify**:
   - Provides deployment summary
   - Reports status of all jobs

## AWS Permissions

The GitHub Actions role has the following permissions:

### Infrastructure Deployment
- Full Terraform state management
- AWS resource creation/modification
- Secrets Manager access
- RDS and Lambda management
- API Gateway configuration

### PWA Deployment
- S3 bucket access for PWA hosting
- CloudFront distribution management
- Basic read permissions for health checks

## Security Features

### OIDC Authentication
- No long-lived AWS credentials stored in GitHub
- Time-limited tokens with specific permissions
- Branch-based access control

### Environment Protection
- Manual approval required for production deployments
- Branch protection for sensitive environments
- Audit trail for all deployments

### State Management
- Terraform state backed up to version control
- State drift detection in plans
- Automatic rollback on deployment failures

## Usage

### Infrastructure Changes

1. **Development Process:**
   ```bash
   # Make infrastructure changes
   git checkout -b feature/infrastructure-update
   # Edit Terraform files in infrastructure/
   git add infrastructure/
   git commit -m "feat(infra): add new API Gateway integration"
   git push origin feature/infrastructure-update
   ```

2. **Pull Request:**
   - Create PR to `main` branch
   - GitHub Actions will run Terraform plan
   - Review plan output in PR comments
   - Merge PR to trigger deployment

3. **Deployment:**
   - Automatic deployment to `development` environment
   - Manual approval for production deployments
   - Terraform state automatically backed up

### Application Changes

1. **Development Process:**
   ```bash
   # Make application changes
   git checkout -b feature/app-enhancement
   # Edit code in domains/ or packages/
   git add domains/ packages/
   git commit -m "feat(ideas-pwa): add database integration"
   git push origin feature/app-enhancement
   ```

2. **Pull Request:**
   - Create PR to `main` branch
   - GitHub Actions will run tests and build
   - Review test results and build artifacts
   - Merge PR to trigger deployment

3. **Deployment:**
   - Automatic deployment to development S3/CloudFront
   - Health checks verify deployment success
   - PWAs immediately available at production URLs

## Monitoring and Troubleshooting

### Deployment Status
- Monitor deployments in GitHub Actions tab
- Check job summaries for deployment details
- Review CloudWatch logs for Lambda functions

### Common Issues

#### Infrastructure Deployment Failures
1. **Terraform State Drift:**
   ```bash
   # Check plan output for resource conflicts
   # Use terraform import for existing resources
   ```

2. **Permission Issues:**
   ```bash
   # Verify AWS_ROLE_ARN in secrets
   # Check OIDC provider configuration
   ```

#### PWA Deployment Failures
1. **Build Failures:**
   ```bash
   # Check test and type checking results
   # Verify dependencies are up to date
   ```

2. **S3/CloudFront Issues:**
   ```bash
   # Verify S3 bucket permissions
   # Check CloudFront distribution configuration
   ```

## Best Practices

### Development Workflow
- ✅ Always work in feature branches
- ✅ Use conventional commit messages
- ✅ Review Terraform plans before merging
- ✅ Test changes locally before pushing

### Security
- ✅ Never commit AWS credentials
- ✅ Use least-privilege IAM policies
- ✅ Regularly rotate OIDC provider keys
- ✅ Monitor deployment logs for anomalies

### Infrastructure Management
- ✅ Follow ADR-004 state management protocol
- ✅ Backup state before major changes
- ✅ Use targeted applies for specific resources
- ✅ Document all infrastructure changes

## Emergency Procedures

### Rollback Infrastructure
```bash
# Local rollback (emergency only)
git revert <commit-hash>
git push origin main

# Or use terraform destroy for specific resources
terraform destroy -target=resource.name
```

### Rollback Application
```bash
# Revert application changes
git revert <commit-hash>
git push origin main

# Or manually upload previous build
aws s3 sync previous-build/ s3://bucket-name/
```

## Related Documentation
- [ADR-004: Terraform State Drift Resolution](./ADR-004-Terraform-State-Drift-Resolution.md)
- [GitHub OIDC Setup Guide](./GITHUB-OIDC-SETUP.md)
- [PWA Deployment Guide](./PWA-DEPLOYMENT-GUIDE.md)

---

**Last Updated**: July 30, 2025  
**Status**: ✅ Ready for Implementation  
**Next Steps**: Configure GitHub repository secrets and test workflows