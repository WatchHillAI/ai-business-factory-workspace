#!/bin/bash

# Quick Lambda deployment script

FUNCTION_NAME="ai-business-factory-ai-agent-orchestrator"
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="dist/lambda-handler.handler"
ROLE_NAME="ai-agent-orchestrator-role"

echo "🚀 Deploying AI Agent Orchestrator to AWS Lambda..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo "✅ Function exists, updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-deployment.zip \
        --region $REGION
else
    echo "❌ Function doesn't exist. Creating new function..."
    
    # Check if IAM role exists
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null)
    
    if [ -z "$ROLE_ARN" ]; then
        echo "Creating IAM role..."
        # Create basic Lambda execution role
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }'
        
        # Attach basic policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
        sleep 10 # Wait for role propagation
    fi
    
    echo "Creating Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --role $ROLE_ARN \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 900 \
        --memory-size 2048 \
        --environment Variables="{NODE_ENV=production}" \
        --region $REGION
fi

echo "✅ Deployment complete!"
echo "Function ARN: $(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)"