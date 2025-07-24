# GitHub OIDC Setup for AWS Authentication

This guide explains how to set up secure GitHub Actions authentication with AWS using OpenID Connect (OIDC) instead of long-term access keys.

## Overview

GitHub OIDC allows GitHub Actions to securely authenticate with AWS without storing long-term credentials as secrets. This approach provides:

- **Enhanced Security**: No long-term access keys stored in GitHub
- **Automatic Rotation**: Temporary credentials are automatically rotated
- **Fine-grained Permissions**: IAM roles with specific permissions for each workflow
- **Audit Trail**: Better visibility into which workflows are accessing AWS resources

## Prerequisites

1. AWS CLI configured with administrative permissions
2. Terraform installed (version >= 1.0)
3. Repository admin access to configure GitHub variables

## Step 1: Deploy OIDC Infrastructure

The OIDC infrastructure is managed via Terraform and includes:
- GitHub OIDC Identity Provider
- IAM Role for GitHub Actions with appropriate policies
- Outputs for role ARN

### Deploy with Terraform

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

This will create:
- `aws_iam_openid_connect_provider.github` - OIDC identity provider
- `aws_iam_role.github_actions` - Role for GitHub Actions to assume
- IAM policies for database deployment, AI agent deployment, and PWA hosting

## Step 2: Configure GitHub Repository Variables

After deploying the Terraform configuration, you need to add the role ARN as a repository variable.

### Get the Role ARN

```bash
cd infrastructure/terraform/environments/dev
terraform output github_actions_role_arn
```

### Add to GitHub Repository

1. Go to your repository: https://github.com/WatchHillAI/ai-business-factory-workspace
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click on the **Variables** tab
4. Click **New repository variable**
5. Add:
   - **Name**: `AWS_GITHUB_ACTIONS_ROLE_ARN`
   - **Value**: The ARN from terraform output (e.g., `arn:aws:iam::123456789012:role/ai-business-factory-github-actions-dev`)

## Step 3: Verify Workflow Configuration

The GitHub Actions workflows have been updated to use OIDC authentication:

### Required Permissions in Workflows

```yaml
permissions:
  id-token: write  # Required for OIDC token
  contents: read   # Required to checkout code
  pull-requests: write  # Required for PR comments (plan jobs only)
```

### AWS Authentication Step

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ vars.AWS_GITHUB_ACTIONS_ROLE_ARN }}
    role-session-name: GitHubActions-DatabaseDeployment
    aws-region: us-east-1
```

## Step 4: Test the Setup

### Test Database Deployment Workflow

1. Push changes to a feature branch
2. Create a pull request to trigger the planning phase
3. Check that the workflow can authenticate with AWS and access Terraform state

### Test AI Agent Deployment Workflow

1. Make changes to AI agent code in `domains/ai-orchestration/packages/agent-orchestrator/`
2. Push to a feature branch and create a PR
3. Verify the workflow can build and plan deployment

## IAM Permissions

The GitHub Actions role has the following permissions:

### Database Deployment
- RDS cluster read access
- Secrets Manager access for database credentials
- Terraform state bucket access (S3 + DynamoDB locking)

### AI Agent Deployment
- Lambda function management
- API Gateway management
- IAM role management (for Lambda execution roles)
- CloudWatch Logs access

### PWA Deployment
- S3 bucket access for static hosting
- CloudFront invalidation permissions

## Security Considerations

1. **Repository Restrictions**: The OIDC role can only be assumed by the specific repository
2. **Branch Restrictions**: Only specified branches can assume the role (main, develop, feature/*)
3. **Least Privilege**: Each policy grants only the minimum required permissions
4. **Session Names**: Each workflow uses unique session names for better audit trails

## Troubleshooting

### Common Issues

#### "Credentials could not be loaded"
- Verify the repository variable `AWS_GITHUB_ACTIONS_ROLE_ARN` is set correctly
- Check that the workflow has `id-token: write` permission
- Ensure the role trust policy allows the repository and branch

#### "Access Denied" errors
- Verify the IAM policies attached to the role include required permissions
- Check that resource ARNs in policies match your actual resources
- Ensure Terraform state bucket and DynamoDB table exist and are accessible

#### "Role not found"
- Confirm the OIDC infrastructure has been deployed via Terraform
- Verify the role ARN in the repository variable matches the actual role

### Debugging Steps

1. **Check Terraform outputs**:
   ```bash
   cd infrastructure/terraform/environments/dev
   terraform output
   ```

2. **Verify role exists in AWS**:
   ```bash
   aws iam get-role --role-name ai-business-factory-github-actions-dev
   ```

3. **Test role assumption locally** (for debugging):
   ```bash
   aws sts assume-role-with-web-identity \
     --role-arn "arn:aws:iam::ACCOUNT:role/ai-business-factory-github-actions-dev" \
     --role-session-name "test-session" \
     --web-identity-token "GITHUB_TOKEN"
   ```

## Updating Permissions

To add new permissions to the GitHub Actions role:

1. Update the appropriate policy in `infrastructure/terraform/modules/github-oidc/main.tf`
2. Run `terraform plan` and `terraform apply`
3. The changes will be applied immediately to existing workflows

## Migration from Access Keys

If you were previously using access keys:

1. Deploy the OIDC infrastructure
2. Update workflows to use OIDC (already done)
3. Remove the old secrets: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
4. Test that workflows continue to work with OIDC

## References

- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS IAM OIDC Identity Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [configure-aws-credentials Action](https://github.com/aws-actions/configure-aws-credentials)