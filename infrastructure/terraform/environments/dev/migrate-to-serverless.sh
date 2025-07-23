#!/bin/bash
# AI Business Factory - Migration to Serverless Infrastructure
# This script migrates the existing Docker-based system to AWS serverless architecture

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-business-factory"
ENVIRONMENT="dev"
AWS_REGION="us-east-1"

# Paths
ORIGINAL_PROJECT_PATH="../../../ai-business-factory"
INFRASTRUCTURE_PATH="."
BACKUP_PATH="./migration-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Business Factory - Serverless Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Pre-migration checks
echo -e "${YELLOW}🔍 Running pre-migration checks...${NC}"

# Check if original project exists
if [ ! -d "$ORIGINAL_PROJECT_PATH" ]; then
    echo -e "${RED}❌ Original project not found at $ORIGINAL_PROJECT_PATH${NC}"
    exit 1
fi

# Check if Docker is running (for data export)
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Will skip data export.${NC}"
    SKIP_DATA_EXPORT=true
else
    echo -e "${GREEN}✅ Docker is running${NC}"
    SKIP_DATA_EXPORT=false
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Please install Terraform.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-migration checks passed${NC}"
echo

# Create backup directory
echo -e "${YELLOW}📦 Creating migration backup...${NC}"
mkdir -p "$BACKUP_PATH"

# Backup existing data if Docker is running
if [ "$SKIP_DATA_EXPORT" = false ]; then
    echo -e "${YELLOW}💾 Exporting existing database data...${NC}"
    
    # Check if postgres container is running
    if docker ps --format "table {{.Names}}" | grep -q "postgres"; then
        echo "Exporting PostgreSQL data..."
        docker exec ai-business-factory-postgres-1 pg_dump -U postgres ai_business_factory > "$BACKUP_PATH/postgresql_backup.sql" || true
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container not running, skipping database backup${NC}"
    fi
    
    # Check if redis container is running
    if docker ps --format "table {{.Names}}" | grep -q "redis"; then
        echo "Exporting Redis data..."
        docker exec ai-business-factory-redis-1 redis-cli --rdb /tmp/redis_backup.rdb || true
        docker cp ai-business-factory-redis-1:/tmp/redis_backup.rdb "$BACKUP_PATH/" || true
    else
        echo -e "${YELLOW}⚠️  Redis container not running, skipping Redis backup${NC}"
    fi
fi

# Backup configuration files
echo "Backing up configuration files..."
cp -r "$ORIGINAL_PROJECT_PATH/docker-compose.yml" "$BACKUP_PATH/" 2>/dev/null || true
cp -r "$ORIGINAL_PROJECT_PATH/.env"* "$BACKUP_PATH/" 2>/dev/null || true
cp -r "$ORIGINAL_PROJECT_PATH/nginx" "$BACKUP_PATH/" 2>/dev/null || true
cp -r "$ORIGINAL_PROJECT_PATH/monitoring" "$BACKUP_PATH/" 2>/dev/null || true

echo -e "${GREEN}✅ Backup created at $BACKUP_PATH${NC}"
echo

# Generate database schema for RDS
echo -e "${YELLOW}🗄️  Generating database schema for RDS Aurora...${NC}"
cat > "$BACKUP_PATH/aurora_schema.sql" << 'EOF'
-- AI Business Factory Database Schema for Aurora PostgreSQL
-- Auto-generated for serverless migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    source VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    content TEXT,
    sentiment DECIMAL(3,2),
    relevance_score DECIMAL(3,2),
    market_size DECIMAL(15,2),
    growth_rate DECIMAL(5,2),
    competition_level VARCHAR(50),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Validation results table
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    market_score DECIMAL(5,2),
    competitive_score DECIMAL(5,2),
    technical_score DECIMAL(5,2),
    financial_score DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    recommendation TEXT,
    risk_assessment JSONB,
    validation_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business plans table
CREATE TABLE IF NOT EXISTS business_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    executive_summary TEXT,
    market_analysis TEXT,
    business_model TEXT,
    financial_projections JSONB,
    implementation_plan TEXT,
    risk_mitigation TEXT,
    generated_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy configurations table
CREATE TABLE IF NOT EXISTS strategy_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job tracking table for scheduler
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    job_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX IF NOT EXISTS idx_market_data_opportunity_id ON market_data(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_market_data_scraped_at ON market_data(scraped_at);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(source);
CREATE INDEX IF NOT EXISTS idx_validation_results_opportunity_id ON validation_results(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_opportunity_id ON business_plans(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_scheduled_at ON scheduled_jobs(scheduled_at);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_validation_results_updated_at BEFORE UPDATE ON validation_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plans_updated_at BEFORE UPDATE ON business_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_configs_updated_at BEFORE UPDATE ON strategy_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default strategy configurations
INSERT INTO strategy_configs (name, description, config) VALUES 
(
    'default_scraping',
    'Default web scraping strategy',
    '{
        "sources": ["news", "social", "patents", "research"],
        "keywords": ["business opportunity", "market trend", "startup", "innovation"],
        "frequency": "hourly",
        "max_results_per_source": 100
    }'::jsonb
),
(
    'comprehensive_analysis',
    'Comprehensive market analysis strategy',
    '{
        "analysis_depth": "full",
        "include_sentiment": true,
        "include_competition": true,
        "include_market_size": true,
        "ml_models": ["tfidf", "clustering", "sentiment"]
    }'::jsonb
),
(
    'risk_assessment',
    'Default risk assessment criteria',
    '{
        "market_risk_weight": 0.3,
        "competitive_risk_weight": 0.25,
        "technical_risk_weight": 0.25,
        "financial_risk_weight": 0.2,
        "min_score_threshold": 0.6
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE opportunities IS 'Business opportunities identified by the AI system';
COMMENT ON TABLE market_data IS 'Scraped market data related to opportunities';
COMMENT ON TABLE validation_results IS 'Validation and risk assessment results';
COMMENT ON TABLE business_plans IS 'Generated business plans for validated opportunities';
COMMENT ON TABLE strategy_configs IS 'Configuration strategies for different system components';
COMMENT ON TABLE scheduled_jobs IS 'Job tracking for the scheduler service';
EOF

echo -e "${GREEN}✅ Database schema generated${NC}"
echo

# Initialize Terraform
echo -e "${YELLOW}🏗️  Initializing Terraform infrastructure...${NC}"
terraform init

# Validate Terraform configuration
echo -e "${YELLOW}🔍 Validating Terraform configuration...${NC}"
terraform validate

# Plan the infrastructure
echo -e "${YELLOW}📋 Planning infrastructure deployment...${NC}"
terraform plan -out=migration.tfplan

# Confirm deployment
echo
echo -e "${YELLOW}🤔 Ready to deploy serverless infrastructure?${NC}"
echo -e "This will create:"
echo -e "  • 6 Lambda functions (including business generator)"
echo -e "  • 6 API Gateway endpoints"
echo -e "  • 1 AppSync GraphQL API"
echo -e "  • 1 Aurora PostgreSQL Serverless cluster"
echo -e "  • 1 ElastiCache Redis cluster"
echo -e "  • 3 SQS queues"
echo -e "  • 2 EventBridge schedules"
echo -e "  • IAM roles and policies"
echo -e "  • CloudWatch log groups"
echo
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment cancelled${NC}"
    exit 0
fi

# Deploy infrastructure
echo -e "${YELLOW}🚀 Deploying serverless infrastructure...${NC}"
terraform apply migration.tfplan

# Get outputs
echo -e "${YELLOW}📊 Retrieving deployment information...${NC}"
terraform output -json > "$BACKUP_PATH/terraform_outputs.json"

# Display deployment summary
echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "Environment: $ENVIRONMENT"
echo -e "AWS Region: $AWS_REGION"
echo
echo -e "${BLUE}🔗 New Endpoints:${NC}"
terraform output -json | jq -r '.api_endpoints.value | to_entries[] | "  \(.key): \(.value)"'

echo
echo -e "${BLUE}🔑 GraphQL API:${NC}"
echo -e "  Endpoint: $(terraform output -json | jq -r '.managed_services.value.graphql.graphql_endpoint')"
echo -e "  Real-time: $(terraform output -json | jq -r '.managed_services.value.graphql.realtime_endpoint')"
echo -e "  API Key: [SENSITIVE - see terraform output for details]"

echo
echo -e "${BLUE}🗄️  Database:${NC}"
echo -e "  PostgreSQL Endpoint: $(terraform output -json | jq -r '.managed_services.value.postgresql.cluster_endpoint')"
echo -e "  Redis Endpoint: $(terraform output -json | jq -r '.managed_services.value.redis.cluster_endpoint')"

echo
echo -e "${BLUE}💰 Estimated Monthly Cost:${NC}"
terraform output -json | jq -r '.cost_summary.value.serverless_total'

echo
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Run the schema migration:"
echo "   aws rds-data execute-statement \\"
echo "     --resource-arn \$(terraform output -json | jq -r '.managed_services.value.postgresql.cluster_arn') \\"
echo "     --secret-arn \$(terraform output -json | jq -r '.managed_services.value.postgresql.secret_arn') \\"
echo "     --database ai_business_factory \\"
echo "     --sql \"\$(cat $BACKUP_PATH/aurora_schema.sql)\""
echo
echo "2. Test the new endpoints:"
echo "   curl \$(terraform output -json | jq -r '.api_endpoints.value.data_collector')/health"
echo
echo "3. Import existing data (if available):"
echo "   # Use the backup files in $BACKUP_PATH"
echo
echo "4. Update application configurations to use new endpoints"
echo
echo "5. Gradually migrate traffic from Docker to serverless"
echo
echo -e "${GREEN}✨ Serverless migration completed successfully!${NC}"