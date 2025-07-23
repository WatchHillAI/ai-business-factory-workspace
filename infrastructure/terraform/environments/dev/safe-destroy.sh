#!/bin/bash

# AI Business Factory - Safe Destruction Script
# This script provides controlled, step-by-step infrastructure destruction

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper functions
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

log_critical() {
    echo -e "${RED}${BOLD}🚨 $1${NC}"
}

# Confirmation function
confirm() {
    local prompt="$1"
    local response
    
    while true; do
        echo -e "${YELLOW}${prompt} (yes/no): ${NC}"
        read -r response
        case $response in
            [Yy]|[Yy][Ee][Ss]) return 0 ;;
            [Nn]|[Nn][Oo]) return 1 ;;
            *) echo "Please answer yes or no." ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "main.tf" ]]; then
        log_error "main.tf not found. Please run this script from terraform/environments/dev/"
        exit 1
    fi
    
    # Check Terraform installation
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Please install Terraform."
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Display current environment info
show_environment_info() {
    echo ""
    log_info "Current Environment Information:"
    echo "=================================="
    echo "AWS Account: $(aws sts get-caller-identity --query 'Account' --output text)"
    echo "AWS Region: $(aws configure get region)"
    echo "Current Directory: $(pwd)"
    echo "Terraform Workspace: $(terraform workspace show 2>/dev/null || echo 'default')"
    echo ""
}

# Backup current state
backup_state() {
    log_info "Creating state backup..."
    
    local backup_file="terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [[ -f "terraform.tfstate" ]]; then
        cp terraform.tfstate "$backup_file"
        log_success "Local state backed up to: $backup_file"
    elif terraform state pull > /dev/null 2>&1; then
        terraform state pull > "$backup_file"
        log_success "Remote state backed up to: $backup_file"
    else
        log_warning "No state found to backup"
    fi
}

# Export CloudWatch logs
export_logs() {
    if confirm "Do you want to export CloudWatch logs before destruction?"; then
        log_info "Exporting CloudWatch logs..."
        
        local log_dir="./exported-logs-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$log_dir"
        
        # List of Lambda functions
        local functions=(
            "ai-business-factory-data-collector-dev"
            "ai-business-factory-opportunity-analyzer-dev"
            "ai-business-factory-market-validator-dev"
            "ai-business-factory-strategy-manager-dev"
            "ai-business-factory-scheduler-dev"
        )
        
        for func in "${functions[@]}"; do
            local log_group="/aws/lambda/$func"
            local output_file="$log_dir/$func.log"
            
            log_info "Exporting logs for $func..."
            
            # Get log streams
            local streams=$(aws logs describe-log-streams \
                --log-group-name "$log_group" \
                --order-by LastEventTime \
                --descending \
                --max-items 5 \
                --query 'logStreams[].logStreamName' \
                --output text 2>/dev/null || echo "")
            
            if [[ -n "$streams" ]]; then
                echo "# Logs for $func - Exported $(date)" > "$output_file"
                echo "# Log Group: $log_group" >> "$output_file"
                echo "=========================================" >> "$output_file"
                
                for stream in $streams; do
                    echo "" >> "$output_file"
                    echo "## Log Stream: $stream" >> "$output_file"
                    echo "---" >> "$output_file"
                    
                    aws logs get-log-events \
                        --log-group-name "$log_group" \
                        --log-stream-name "$stream" \
                        --query 'events[].message' \
                        --output text >> "$output_file" 2>/dev/null || true
                done
                
                log_success "Logs exported for $func"
            else
                log_warning "No logs found for $func"
            fi
        done
        
        log_success "Logs exported to: $log_dir"
    fi
}

# Show destruction plan
show_destruction_plan() {
    log_info "Generating destruction plan..."
    echo ""
    
    if terraform plan -destroy -out=destroy.tfplan; then
        log_success "Destruction plan created successfully"
        echo ""
        log_warning "Review the plan above carefully!"
    else
        log_error "Failed to create destruction plan"
        exit 1
    fi
}

# Controlled destruction options
destruction_menu() {
    echo ""
    log_info "Destruction Options:"
    echo "==================="
    echo "1. Complete Infrastructure Destruction (everything)"
    echo "2. Services Only (keep SQS queues)"
    echo "3. Individual Service Selection"
    echo "4. Emergency Shutdown (disable without destroying)"
    echo "5. Cancel"
    echo ""
    
    while true; do
        echo -e "${YELLOW}Select option (1-5): ${NC}"
        read -r choice
        
        case $choice in
            1) complete_destruction; break ;;
            2) services_only_destruction; break ;;
            3) individual_service_destruction; break ;;
            4) emergency_shutdown; break ;;
            5) log_info "Destruction cancelled"; exit 0 ;;
            *) echo "Please select 1-5" ;;
        esac
    done
}

# Complete destruction
complete_destruction() {
    log_critical "COMPLETE INFRASTRUCTURE DESTRUCTION"
    echo "This will permanently delete ALL resources including:"
    echo "- All Lambda functions"
    echo "- All API Gateways"
    echo "- All SQS queues and messages"
    echo "- All CloudWatch logs"
    echo "- All EventBridge schedules"
    echo ""
    
    if confirm "Are you ABSOLUTELY SURE you want to destroy everything?"; then
        if confirm "This action CANNOT be undone. Final confirmation?"; then
            log_info "Executing complete destruction..."
            terraform apply destroy.tfplan
            log_success "Complete destruction completed"
        else
            log_info "Destruction cancelled"
        fi
    else
        log_info "Destruction cancelled"
    fi
}

# Services only destruction
services_only_destruction() {
    log_warning "SERVICES ONLY DESTRUCTION"
    echo "This will destroy:"
    echo "- Lambda functions and API Gateways"
    echo "- EventBridge schedules"
    echo "But preserve:"
    echo "- SQS queues (and any pending messages)"
    echo "- CloudWatch logs"
    echo ""
    
    if confirm "Proceed with services-only destruction?"; then
        log_info "Destroying EventBridge schedules..."
        terraform destroy -target=module.hourly_scraping_schedule -auto-approve
        terraform destroy -target=module.daily_analysis_schedule -auto-approve
        
        log_info "Destroying API Gateways..."
        terraform destroy -target=module.data_collector_api -auto-approve
        terraform destroy -target=module.opportunity_analyzer_api -auto-approve
        terraform destroy -target=module.market_validator_api -auto-approve
        terraform destroy -target=module.strategy_manager_api -auto-approve
        terraform destroy -target=module.scheduler_api -auto-approve
        
        log_info "Destroying Lambda functions..."
        terraform destroy -target=module.data_collector_lambda -auto-approve
        terraform destroy -target=module.opportunity_analyzer_lambda -auto-approve
        terraform destroy -target=module.market_validator_lambda -auto-approve
        terraform destroy -target=module.strategy_manager_lambda -auto-approve
        terraform destroy -target=module.scheduler_lambda -auto-approve
        
        log_success "Services-only destruction completed"
        log_info "SQS queues and logs preserved"
    fi
}

# Individual service destruction
individual_service_destruction() {
    log_info "INDIVIDUAL SERVICE DESTRUCTION"
    echo ""
    
    local services=(
        "data_collector:Data Collector (Web Scraper)"
        "opportunity_analyzer:Opportunity Analyzer"
        "market_validator:Market Validator"
        "strategy_manager:Strategy Manager"
        "scheduler:Scheduler"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_key service_name <<< "$service_info"
        
        if confirm "Destroy $service_name?"; then
            log_info "Destroying $service_name..."
            terraform destroy -target=module.${service_key}_lambda -auto-approve
            terraform destroy -target=module.${service_key}_api -auto-approve
            log_success "$service_name destroyed"
        fi
    done
    
    if confirm "Destroy EventBridge schedules?"; then
        terraform destroy -target=module.hourly_scraping_schedule -auto-approve
        terraform destroy -target=module.daily_analysis_schedule -auto-approve
        log_success "EventBridge schedules destroyed"
    fi
    
    if confirm "Destroy SQS queues?"; then
        terraform destroy -target=module.scraping_queue -auto-approve
        terraform destroy -target=module.analysis_queue -auto-approve
        terraform destroy -target=module.validation_queue -auto-approve
        log_success "SQS queues destroyed"
    fi
}

# Emergency shutdown
emergency_shutdown() {
    log_critical "EMERGENCY SHUTDOWN"
    echo "This will immediately disable all services without destroying them:"
    echo "- Disable EventBridge schedules"
    echo "- Set Lambda reserved concurrency to 0"
    echo "- Services can be re-enabled later"
    echo ""
    
    if confirm "Proceed with emergency shutdown?"; then
        log_info "Disabling EventBridge schedules..."
        aws events disable-rule --name ai-business-factory-hourly-scraping-dev 2>/dev/null || true
        aws events disable-rule --name ai-business-factory-daily-analysis-dev 2>/dev/null || true
        
        log_info "Disabling Lambda functions..."
        local functions=(
            "ai-business-factory-data-collector-dev"
            "ai-business-factory-opportunity-analyzer-dev"
            "ai-business-factory-market-validator-dev"
            "ai-business-factory-strategy-manager-dev"
            "ai-business-factory-scheduler-dev"
        )
        
        for func in "${functions[@]}"; do
            aws lambda update-function-configuration \
                --function-name "$func" \
                --reserved-concurrency 0 2>/dev/null || true
            log_info "Disabled $func"
        done
        
        log_success "Emergency shutdown completed"
        log_info "To re-enable, remove reserved concurrency and enable EventBridge rules"
    fi
}

# Cleanup after destruction
post_destruction_cleanup() {
    log_info "Post-destruction cleanup..."
    
    # Remove plan file
    rm -f destroy.tfplan
    
    # Check for remaining resources
    log_info "Checking for remaining resources..."
    
    # Check Lambda functions
    local remaining_lambdas=$(aws lambda list-functions \
        --query 'Functions[?contains(FunctionName, `ai-business-factory`)].FunctionName' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$remaining_lambdas" ]]; then
        log_warning "Remaining Lambda functions found:"
        echo "$remaining_lambdas"
    fi
    
    # Check API Gateways
    local remaining_apis=$(aws apigateway get-rest-apis \
        --query 'items[?contains(name, `ai-business-factory`)].{Name:name,Id:id}' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$remaining_apis" ]]; then
        log_warning "Remaining API Gateways found:"
        echo "$remaining_apis"
    fi
    
    log_success "Cleanup completed"
}

# Main execution
main() {
    echo -e "${BOLD}🔥 AI Business Factory - Safe Destruction Script${NC}"
    echo "=================================================="
    echo ""
    
    check_prerequisites
    show_environment_info
    
    log_critical "⚠️  WARNING: This script will destroy AWS resources ⚠️"
    echo ""
    
    if ! confirm "Do you want to proceed with the destruction process?"; then
        log_info "Destruction cancelled by user"
        exit 0
    fi
    
    backup_state
    export_logs
    show_destruction_plan
    destruction_menu
    post_destruction_cleanup
    
    echo ""
    log_success "🎉 Destruction process completed successfully!"
    echo ""
    log_info "Remember to:"
    echo "- Update any external systems that depended on the destroyed services"
    echo "- Remove any DNS records pointing to destroyed API Gateways"
    echo "- Clean up any local terraform files if desired"
}

# Run main function
main "$@"