#!/bin/bash

# =====================================================
# Deploy Business Ideas Schema to Aurora PostgreSQL
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/schemas/business_ideas_schema.sql"
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform/environments/dev"

# Check if schema file exists
if [[ ! -f "$SCHEMA_FILE" ]]; then
    log_error "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

log_info "Deploying Business Ideas Schema to Aurora PostgreSQL..."

# Get database connection details from environment or Terraform
if [[ -n "$DB_ENDPOINT" && -n "$DB_PORT" && -n "$DB_NAME" ]]; then
    log_info "Using database connection details from environment variables..."
    DB_USERNAME="${DB_USERNAME:-postgres}"
else
    log_info "Extracting database connection details from Terraform..."
    cd "$TERRAFORM_DIR"
    
    if [[ ! -f "terraform.tfstate" ]]; then
        log_error "Terraform state not found. Run 'terraform apply' first."
        exit 1
    fi
    
    # Extract database connection details using terraform output
    DB_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")
    DB_PORT=$(terraform output -raw rds_cluster_port 2>/dev/null || echo "5432")
    DB_NAME=$(terraform output -raw rds_database_name 2>/dev/null || echo "ai_business_factory")
    DB_USERNAME=$(terraform output -raw rds_master_username 2>/dev/null || echo "postgres")
fi

if [[ -z "$DB_ENDPOINT" ]]; then
    log_error "Could not extract database endpoint from Terraform output"
    log_info "Make sure Aurora database is deployed with: terraform apply"
    exit 1
fi

log_info "Database connection details:"
log_info "  Endpoint: $DB_ENDPOINT"
log_info "  Port: $DB_PORT"
log_info "  Database: $DB_NAME"
log_info "  Username: $DB_USERNAME"

# Check if AWS CLI is available for getting database password
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Please install AWS CLI to retrieve database password."
    exit 1
fi

# Get database password from AWS Secrets Manager
log_info "Retrieving database password from AWS Secrets Manager..."

# Use environment variable or get from terraform
if [[ -n "$SECRET_ARN" ]]; then
    log_info "Using secret ARN from environment variable..."
else
    SECRET_ARN=$(terraform output -raw rds_master_password_secret_arn 2>/dev/null || echo "")
    
    if [[ -z "$SECRET_ARN" ]]; then
        log_error "Could not find database password secret ARN"
        exit 1
    fi
fi

DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text | jq -r .password)

if [[ -z "$DB_PASSWORD" ]]; then
    log_error "Could not retrieve database password from Secrets Manager"
    exit 1
fi

# Construct connection string
CONNECTION_STRING="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Test database connection
log_info "Testing database connection..."
if ! psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    log_error "Failed to connect to database. Please check:"
    log_error "  1. Aurora database is running"
    log_error "  2. Security groups allow connection from your IP"
    log_error "  3. Database credentials are correct"
    exit 1
fi

log_success "Database connection successful!"

# Create backup of existing schema (if any)
BACKUP_FILE="${SCRIPT_DIR}/backups/schema_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "${SCRIPT_DIR}/backups"

log_info "Creating schema backup..."
psql "$CONNECTION_STRING" -c "\\dt" > "$BACKUP_FILE" 2>/dev/null || true

# Deploy the schema
log_info "Deploying business ideas schema..."
if psql "$CONNECTION_STRING" -f "$SCHEMA_FILE"; then
    log_success "Schema deployed successfully!"
else
    log_error "Schema deployment failed!"
    exit 1
fi

# Verify deployment
log_info "Verifying schema deployment..."

# Check if main table exists
TABLE_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'business_ideas';")
if [[ "$TABLE_COUNT" -gt 0 ]]; then
    log_success "business_ideas table created successfully"
else
    log_error "business_ideas table not found after deployment"
    exit 1
fi

# Check indexes
INDEX_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'business_ideas';")
log_info "Created $INDEX_COUNT indexes on business_ideas table"

# Check functions
FUNCTION_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%business_idea%';")
log_info "Created $FUNCTION_COUNT helper functions"

# Display schema summary
log_info "Schema deployment summary:"
psql "$CONNECTION_STRING" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('business_ideas', 'users')
ORDER BY tablename;
"

log_success "Business Ideas schema deployed successfully!"
log_info "Next steps:"
log_info "  1. Update Lambda functions to use the new database schema"
log_info "  2. Implement CRUD API endpoints for business ideas"
log_info "  3. Connect Ideas PWA to the database API"
log_info ""
log_info "Connection string (for development):"
log_info "  postgresql://${DB_USERNAME}:[PASSWORD]@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?sslmode=require"