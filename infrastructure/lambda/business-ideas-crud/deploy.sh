#!/bin/bash

set -e

echo "🚀 Deploying Business Ideas CRUD API..."

# Configuration
FUNCTION_NAME="ai-business-factory-business-ideas-crud-dev"
AWS_REGION="us-east-1"

# Get VPC configuration
echo "🔍 Getting VPC configuration..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text | tr '\t' ',')
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=*rds*" --query 'SecurityGroups[0].GroupId' --output text)

echo "VPC ID: $VPC_ID"
echo "Subnet IDs: $SUBNET_IDS"
echo "Security Group: $SECURITY_GROUP_ID"

# Get database configuration
echo "🗃️ Getting database configuration..."
DB_ENDPOINT=$(aws rds describe-db-clusters --db-cluster-identifier ai-business-factory-db-dev --query 'DBClusters[0].Endpoint' --output text)
SECRET_ARN=$(aws secretsmanager list-secrets --filters Key=name,Values=ai-business-factory-db-dev-credentials --query 'SecretList[0].ARN' --output text)

echo "Database endpoint: $DB_ENDPOINT"
echo "Secret ARN: $SECRET_ARN"

# Build the package
echo "🔨 Building Lambda package..."
./build.sh

# Create or update Lambda function
if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://lambda.zip
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment Variables="{DB_ENDPOINT=$DB_ENDPOINT,DB_PORT=5432,DB_NAME=ai_business_factory,DB_SECRET_ARN=$SECRET_ARN,NODE_ENV=dev}"
else
    echo "🆕 Creating new Lambda function..."
    
    # Create IAM role if it doesn't exist
    ROLE_NAME="${FUNCTION_NAME}-role"
    if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
        echo "Creating IAM role..."
        
        # Trust policy
        cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://trust-policy.json
        aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        
        # Custom policy for Secrets Manager
        cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "$SECRET_ARN"
    }
  ]
}
EOF
        
        aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "SecretsManagerAccess" --policy-document file://secrets-policy.json
        
        # Wait for role to be ready
        echo "Waiting for IAM role to be ready..."
        sleep 15
    fi
    
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
    
    # Create Lambda function
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs18.x \
        --role "$ROLE_ARN" \
        --handler index.handler \
        --zip-file fileb://lambda.zip \
        --timeout 30 \
        --memory-size 512 \
        --vpc-config SubnetIds="$SUBNET_IDS",SecurityGroupIds="$SECURITY_GROUP_ID" \
        --environment Variables="{DB_ENDPOINT=$DB_ENDPOINT,DB_PORT=5432,DB_NAME=ai_business_factory,DB_SECRET_ARN=$SECRET_ARN,NODE_ENV=dev}" \
        --description "CRUD API for AI-generated business ideas"
fi

echo "⏳ Waiting for Lambda function to be ready..."
aws lambda wait function-updated --function-name "$FUNCTION_NAME"

echo "✅ Lambda function deployed successfully!"

# Test the Lambda function
echo "🧪 Testing Lambda function..."

# Create test payload for listing ideas
TEST_PAYLOAD='{"httpMethod":"GET","pathParameters":null,"queryStringParameters":{"limit":"5"},"body":null}'

aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$TEST_PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    test-response.json

echo "Lambda test response:"
cat test-response.json | jq '.' 2>/dev/null || cat test-response.json

echo ""
echo "🎉 Business Ideas CRUD API deployment complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   Function Name: $FUNCTION_NAME"
echo "   Region: $AWS_REGION"
echo "   Runtime: Node.js 18.x"
echo "   VPC: $VPC_ID"
echo "   Database: $DB_ENDPOINT"
echo ""
echo "🔗 Next Steps:"
echo "   1. Deploy API Gateway for REST endpoints"
echo "   2. Test CRUD operations via API"
echo "   3. Integrate with Ideas PWA"

# Clean up temporary files
rm -f trust-policy.json secrets-policy.json test-response.json