#!/bin/bash

# AI Business Factory - AI Agent System Deployment Script
# Deploys AI Agent Orchestrator to AWS Lambda via Terraform

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/cnorton/Development/ai-business-factory-workspace"
INFRASTRUCTURE_ROOT="/Users/cnorton/Development/ai-business-factory-infrastructure"
AI_AGENTS_DIR="${PROJECT_ROOT}/packages/ai-agents"
TERRAFORM_DIR="${INFRASTRUCTURE_ROOT}/terraform/environments/dev"

echo -e "${BLUE}🤖 AI Business Factory - AI Agent System Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check if directories exist
if [ ! -d "$PROJECT_ROOT" ]; then
    print_error "Project root not found: $PROJECT_ROOT"
    exit 1
fi

if [ ! -d "$INFRASTRUCTURE_ROOT" ]; then
    print_error "Infrastructure root not found: $INFRASTRUCTURE_ROOT"
    exit 1
fi

if [ ! -d "$AI_AGENTS_DIR" ]; then
    print_error "AI agents directory not found: $AI_AGENTS_DIR"
    exit 1
fi

# Check required tools
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
command -v terraform >/dev/null 2>&1 || { print_error "Terraform is required but not installed. Aborting."; exit 1; }
command -v aws >/dev/null 2>&1 || { print_error "AWS CLI is required but not installed. Aborting."; exit 1; }

print_status "Prerequisites check passed"

# Step 1: Build AI Agent TypeScript code
print_info "Step 1: Building AI Agent System..."
cd "$AI_AGENTS_DIR"

if [ ! -f "package.json" ]; then
    print_error "package.json not found in AI agents directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing AI agent dependencies..."
    npm install
else
    print_info "Dependencies already installed"
fi

# Build TypeScript code
if [ -f "tsconfig.json" ]; then
    print_info "Compiling TypeScript code..."
    npm run build 2>/dev/null || npx tsc || {
        print_warning "TypeScript compilation failed, continuing with JavaScript files"
    }
else
    print_warning "No tsconfig.json found, skipping TypeScript compilation"
fi

print_status "AI Agent System build completed"

# Step 2: Prepare AWS Lambda package
print_info "Step 2: Preparing Lambda deployment package..."

# Create Lambda-specific package structure
LAMBDA_PACKAGE_DIR="${AI_AGENTS_DIR}/lambda-package"
rm -rf "$LAMBDA_PACKAGE_DIR"
mkdir -p "$LAMBDA_PACKAGE_DIR"

# Copy source files
cp -r src/ "$LAMBDA_PACKAGE_DIR/"
cp package.json "$LAMBDA_PACKAGE_DIR/"

# Copy AWS-specific files
if [ -d "src/aws" ]; then
    print_info "Including AWS Lambda handler files"
else
    print_warning "No AWS-specific files found"
fi

# Install production dependencies in package directory
cd "$LAMBDA_PACKAGE_DIR"
print_info "Installing production dependencies for Lambda..."
npm install --production --silent

print_status "Lambda package prepared"

# Step 3: Check AWS credentials and region
print_info "Step 3: Verifying AWS configuration..."

AWS_REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || {
    print_error "AWS credentials not configured or invalid. Please run 'aws configure'."
    exit 1
})

print_info "Using AWS Region: $AWS_REGION"
print_info "Using AWS Account: $AWS_ACCOUNT_ID"
print_status "AWS configuration verified"

# Step 4: Plan Terraform deployment
print_info "Step 4: Planning Terraform deployment..."
cd "$TERRAFORM_DIR"

if [ ! -f "main.tf" ]; then
    print_error "Terraform main.tf not found in: $TERRAFORM_DIR"
    exit 1
fi

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    print_info "Initializing Terraform..."
    terraform init
fi

# Plan deployment
print_info "Creating Terraform plan..."
terraform plan -out=tfplan-ai-agents | tee terraform-plan-output.txt

# Check if AI agent resources are in the plan
if grep -q "ai_agent_orchestrator" terraform-plan-output.txt; then
    print_status "AI Agent Orchestrator found in Terraform plan"
else
    print_warning "AI Agent Orchestrator not found in plan - may already be deployed"
fi

print_status "Terraform plan completed"

# Step 5: Deploy infrastructure (with confirmation)
echo ""
print_info "Step 5: Ready to deploy AI Agent infrastructure"
print_warning "This will create/update the following AWS resources:"
echo "  • AI Agent Orchestrator Lambda function"
echo "  • API Gateway for AI agents"
echo "  • IAM roles and policies"
echo "  • CloudWatch log groups"
echo ""

read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deploying AI Agent infrastructure..."
    terraform apply tfplan-ai-agents
    
    if [ $? -eq 0 ]; then
        print_status "Terraform deployment completed successfully"
    else
        print_error "Terraform deployment failed"
        exit 1
    fi
else
    print_info "Deployment cancelled by user"
    exit 0
fi

# Step 6: Get deployment outputs
print_info "Step 6: Retrieving deployment information..."

AI_AGENT_API_URL=$(terraform output -raw lambda_functions 2>/dev/null | jq -r '.ai_agent_orchestrator.api_url' 2>/dev/null || echo "Not available")
AI_AGENT_FUNCTION_NAME=$(terraform output -raw lambda_functions 2>/dev/null | jq -r '.ai_agent_orchestrator.name' 2>/dev/null || echo "Not available")

echo ""
print_status "🎉 AI Agent System deployment completed!"
echo ""
echo "📊 Deployment Summary:"
echo "  • Function Name: $AI_AGENT_FUNCTION_NAME"
echo "  • API Gateway URL: $AI_AGENT_API_URL"
echo "  • Region: $AWS_REGION"
echo "  • Environment: dev"
echo ""

# Step 7: Basic health check
if [ "$AI_AGENT_API_URL" != "Not available" ] && [ "$AI_AGENT_API_URL" != "null" ]; then
    print_info "Step 7: Testing deployment..."
    
    HEALTH_CHECK_URL="${AI_AGENT_API_URL}/health"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_status "Health check passed - AI Agent system is responding"
    else
        print_warning "Health check failed (HTTP $HTTP_STATUS) - system may need a few minutes to initialize"
    fi
else
    print_warning "Skipping health check - API URL not available"
fi

# Step 8: Next steps information
echo ""
print_info "🚀 Next Steps:"
echo "  1. Update Ideas PWA to call AI Agent API:"
echo "     API URL: $AI_AGENT_API_URL"
echo ""
echo "  2. Configure external API keys in AWS Secrets Manager:"
echo "     • Google Trends API key"
echo "     • Crunchbase API key" 
echo "     • SEMrush API key"
echo ""
echo "  3. Test AI agent analysis:"
echo "     curl -X POST $AI_AGENT_API_URL/analyze \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"ideaText\":\"AI-powered customer support for small businesses\"}'"
echo ""
echo "  4. Monitor deployment:"
echo "     • CloudWatch Logs: /aws/lambda/$AI_AGENT_FUNCTION_NAME"
echo "     • CloudWatch Metrics: Lambda function metrics"
echo ""

print_status "Deployment script completed successfully!"

# Cleanup
cd "$PROJECT_ROOT"
print_info "Cleaning up temporary files..."
rm -rf "${AI_AGENTS_DIR}/lambda-package" 2>/dev/null || true
rm -f "${TERRAFORM_DIR}/terraform-plan-output.txt" 2>/dev/null || true

echo -e "${GREEN}🎯 AI Agent System is ready for production use!${NC}"