#!/bin/bash

# AI Business Factory - Terraform Import Script
# This script imports existing AWS resources into Terraform state

set -e

echo "🔄 AI Business Factory - Terraform Resource Import"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "main.tf" ]]; then
    log_error "main.tf not found. Please run this script from the terraform/environments/dev directory."
    exit 1
fi

# Initialize Terraform if needed
if [[ ! -d ".terraform" ]]; then
    log_info "Initializing Terraform..."
    terraform init
fi

# =================== LAMBDA FUNCTIONS ===================

log_info "Importing Lambda functions..."

# Data Collector Lambda
log_info "Importing Data Collector Lambda..."
terraform import module.data_collector_lambda.aws_lambda_function.function ai-business-factory-data-collector || log_warning "Data Collector Lambda not found or already imported"

# Opportunity Analyzer Lambda  
log_info "Importing Opportunity Analyzer Lambda..."
terraform import module.opportunity_analyzer_lambda.aws_lambda_function.function ai-business-factory-opportunity-analyzer || log_warning "Opportunity Analyzer Lambda not found or already imported"

# Market Validator Lambda
log_info "Importing Market Validator Lambda..."
terraform import module.market_validator_lambda.aws_lambda_function.function ai-business-factory-market-validator || log_warning "Market Validator Lambda not found or already imported"

# Strategy Manager Lambda
log_info "Importing Strategy Manager Lambda..."
terraform import module.strategy_manager_lambda.aws_lambda_function.function ai-business-factory-strategy-manager || log_warning "Strategy Manager Lambda not found or already imported"

# Scheduler Lambda
log_info "Importing Scheduler Lambda..."
terraform import module.scheduler_lambda.aws_lambda_function.function ai-business-factory-scheduler || log_warning "Scheduler Lambda not found or already imported"

# =================== API GATEWAYS ===================

log_info "Importing API Gateways..."

# Note: You'll need to replace these IDs with your actual API Gateway IDs
# Data Collector API Gateway
log_info "Importing Data Collector API Gateway..."
terraform import module.data_collector_api.aws_api_gateway_rest_api.api 6pfrpp9myj || log_warning "Data Collector API Gateway not found or already imported"

# Opportunity Analyzer API Gateway
log_info "Importing Opportunity Analyzer API Gateway..."
terraform import module.opportunity_analyzer_api.aws_api_gateway_rest_api.api 8iu90se87h || log_warning "Opportunity Analyzer API Gateway not found or already imported"

# Market Validator API Gateway
log_info "Importing Market Validator API Gateway..."
terraform import module.market_validator_api.aws_api_gateway_rest_api.api cp5uz7gvhe || log_warning "Market Validator API Gateway not found or already imported"

# Strategy Manager API Gateway
log_info "Importing Strategy Manager API Gateway..."
terraform import module.strategy_manager_api.aws_api_gateway_rest_api.api yqiye90k5m || log_warning "Strategy Manager API Gateway not found or already imported"

# Scheduler API Gateway
log_info "Importing Scheduler API Gateway..."
terraform import module.scheduler_api.aws_api_gateway_rest_api.api 2a393dz4nf || log_warning "Scheduler API Gateway not found or already imported"

# =================== IAM ROLES ===================

log_info "Importing IAM roles..."

# Lambda execution role (shared role we created manually)
log_info "Importing Lambda execution role..."
terraform import module.data_collector_lambda.aws_iam_role.lambda_role lambda-execution-role || log_warning "Lambda execution role not found or already imported"

# =================== CLOUDWATCH LOG GROUPS ===================

log_info "Importing CloudWatch Log Groups..."

# Lambda log groups
terraform import module.data_collector_lambda.aws_cloudwatch_log_group.lambda_logs /aws/lambda/ai-business-factory-data-collector || log_warning "Data Collector log group not found or already imported"
terraform import module.opportunity_analyzer_lambda.aws_cloudwatch_log_group.lambda_logs /aws/lambda/ai-business-factory-opportunity-analyzer || log_warning "Opportunity Analyzer log group not found or already imported"
terraform import module.market_validator_lambda.aws_cloudwatch_log_group.lambda_logs /aws/lambda/ai-business-factory-market-validator || log_warning "Market Validator log group not found or already imported"
terraform import module.strategy_manager_lambda.aws_cloudwatch_log_group.lambda_logs /aws/lambda/ai-business-factory-strategy-manager || log_warning "Strategy Manager log group not found or already imported"
terraform import module.scheduler_lambda.aws_cloudwatch_log_group.lambda_logs /aws/lambda/ai-business-factory-scheduler || log_warning "Scheduler log group not found or already imported"

# =================== SUMMARY ===================

echo ""
log_success "Import process completed!"
echo ""
log_info "Next steps:"
echo "  1. Run 'terraform plan' to see what resources need to be created"
echo "  2. Review the plan carefully"
echo "  3. Run 'terraform apply' to create missing resources"
echo "  4. Update the source code paths in main.tf to match your directory structure"
echo ""
log_warning "Important notes:"
echo "  - Some resources may not import if they don't exist yet"
echo "  - You may need to adjust resource names to match your actual AWS resources"
echo "  - API Gateway IDs are hardcoded - verify they match your deployed gateways"
echo "  - IAM roles may need manual import if they have different names"
echo ""
log_info "To see the current state:"
echo "  terraform state list"
echo ""
log_info "To plan your infrastructure:"
echo "  terraform plan"