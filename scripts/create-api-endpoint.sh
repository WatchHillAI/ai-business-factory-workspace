#!/bin/bash

API_ID="bmh6tskmv4"
FUNCTION_NAME="ai-business-factory-ai-agent-orchestrator"
REGION="us-east-1"

echo "🔗 Creating API Gateway endpoint for AI Agent Orchestrator..."

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text)
echo "Root resource ID: $ROOT_ID"

# Create /ai-agents resource
RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "ai-agents" \
    --query 'id' --output text 2>/dev/null || \
    aws apigateway get-resources --rest-api-id $API_ID --query "items[?pathPart=='ai-agents'].id" --output text)

echo "AI agents resource ID: $RESOURCE_ID"

# Create ANY method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE 2>/dev/null || echo "Method already exists"

# Set up integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:519284856023:function:${FUNCTION_NAME}/invocations

# Give API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:519284856023:${API_ID}/*/*/*" 2>/dev/null || echo "Permission already exists"

# Deploy API
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --query 'id' --output text)

echo "✅ Deployed! API endpoint:"
echo "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/ai-agents"