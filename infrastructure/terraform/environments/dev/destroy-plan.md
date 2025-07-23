# AI Business Factory - Safe Destruction Guide

This document outlines the safe procedures for terminating and deleting AI Business Factory services.

## ⚠️ **CRITICAL WARNING**

Destroying infrastructure will permanently delete:
- All Lambda functions and their code
- API Gateway endpoints (breaking external integrations)
- SQS queues and any pending messages
- CloudWatch logs (if retention period expires)
- EventBridge schedules

**This action cannot be undone.**

## 🛡️ **Pre-Destruction Checklist**

### 1. Data Backup
- [ ] Export important CloudWatch logs
- [ ] Backup any persistent data (if applicable)
- [ ] Document current API Gateway URLs for migration
- [ ] Save current Lambda function configurations

### 2. Stakeholder Notification
- [ ] Notify dependent systems of API endpoint changes
- [ ] Coordinate with team members
- [ ] Schedule maintenance window if needed
- [ ] Update external documentation

### 3. Validation
- [ ] Confirm you're in the correct environment (dev/staging/prod)
- [ ] Verify AWS credentials and region
- [ ] Double-check Terraform workspace/state

## 🗂️ **Destruction Options**

### Option 1: Complete Infrastructure Destruction
Destroys everything managed by Terraform.

```bash
# Navigate to environment
cd terraform/environments/dev

# Review what will be destroyed
terraform plan -destroy

# Destroy all resources (requires confirmation)
terraform destroy

# Or use npm script
npm run dev:destroy
```

### Option 2: Selective Resource Removal
Remove specific services while keeping others.

```bash
# Remove only specific Lambda function
terraform destroy -target=module.data_collector_lambda

# Remove specific API Gateway
terraform destroy -target=module.data_collector_api

# Remove specific SQS queue
terraform destroy -target=module.scraping_queue
```

### Option 3: Individual Service Termination
Terminate services one by one for controlled shutdown.

```bash
# 1. Remove EventBridge schedules first (stop new jobs)
terraform destroy -target=module.hourly_scraping_schedule
terraform destroy -target=module.daily_analysis_schedule

# 2. Remove API Gateways (stop external access)
terraform destroy -target=module.data_collector_api
terraform destroy -target=module.opportunity_analyzer_api
terraform destroy -target=module.market_validator_api
terraform destroy -target=module.strategy_manager_api
terraform destroy -target=module.scheduler_api

# 3. Remove Lambda functions
terraform destroy -target=module.data_collector_lambda
terraform destroy -target=module.opportunity_analyzer_lambda
terraform destroy -target=module.market_validator_lambda
terraform destroy -target=module.strategy_manager_lambda
terraform destroy -target=module.scheduler_lambda

# 4. Remove SQS queues last (after processing stops)
terraform destroy -target=module.scraping_queue
terraform destroy -target=module.analysis_queue
terraform destroy -target=module.validation_queue
```

## 🚨 **Emergency Shutdown**

For immediate service termination:

```bash
# Quick disable all EventBridge rules (stops scheduling)
aws events disable-rule --name ai-business-factory-hourly-scraping-dev
aws events disable-rule --name ai-business-factory-daily-analysis-dev

# Quick disable all Lambda functions
aws lambda update-function-configuration --function-name ai-business-factory-data-collector-dev --reserved-concurrency 0
aws lambda update-function-configuration --function-name ai-business-factory-opportunity-analyzer-dev --reserved-concurrency 0
aws lambda update-function-configuration --function-name ai-business-factory-market-validator-dev --reserved-concurrency 0
aws lambda update-function-configuration --function-name ai-business-factory-strategy-manager-dev --reserved-concurrency 0
aws lambda update-function-configuration --function-name ai-business-factory-scheduler-dev --reserved-concurrency 0
```

## 🔄 **State Management During Destruction**

### Backup Terraform State
```bash
# Backup current state before destruction
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)

# Or if using remote state
terraform state pull > terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)
```

### Handle Stuck Resources
```bash
# Remove resource from state without destroying
terraform state rm module.stuck_resource.aws_lambda_function.function

# Force unlock state if needed
terraform force-unlock LOCK_ID
```

## 🧹 **Post-Destruction Cleanup**

### Manual Cleanup (if needed)
Some resources may need manual cleanup:

```bash
# Check for remaining Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `ai-business-factory`)].FunctionName'

# Check for remaining API Gateways
aws apigateway get-rest-apis --query 'items[?contains(name, `ai-business-factory`)].{Name:name,Id:id}'

# Check for remaining SQS queues
aws sqs list-queues --queue-name-prefix ai-business-factory

# Check for remaining CloudWatch log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/ai-business-factory
```

### State File Cleanup
```bash
# Remove Terraform state files
rm -f terraform.tfstate*
rm -f .terraform.lock.hcl
rm -rf .terraform/

# Clear cached modules
terraform get -update
```

## 🏗️ **Recreation After Destruction**

To rebuild the infrastructure:

```bash
# Reinitialize Terraform
terraform init

# Plan the recreation
terraform plan

# Apply to recreate
terraform apply
```

## 📋 **Cost Considerations**

### Immediate Cost Savings
- Lambda functions: $0 (pay-per-execution)
- API Gateway: $0 (pay-per-request)
- SQS: $0 (pay-per-message)
- CloudWatch: Minimal (logs with retention)

### Potential Costs During Destruction
- Data transfer charges for log exports
- Snapshot costs if backing up data
- Temporary Lambda charges during shutdown process

## 🔐 **Security Notes**

### Access Control
- Ensure only authorized personnel can run destroy commands
- Use separate AWS accounts for environments
- Consider IAM policies that prevent accidental destruction

### API Security
- API Gateway URLs will become invalid immediately
- Any hardcoded URLs in external systems will break
- Consider using custom domains for production

## 📞 **Support**

If destruction fails or gets stuck:
1. Check AWS CloudFormation for stuck stacks
2. Review Terraform state for inconsistencies
3. Contact AWS support for resource-specific issues
4. Use AWS CLI for manual resource cleanup if needed