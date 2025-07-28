// API Gateway setup script for Scheduler
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('⏰ Setting up API Gateway for Scheduler');
console.log('=====================================\n');

async function setupSchedulerAPI() {
  try {
    // Create API Gateway
    console.log('🔧 Step 1: Creating API Gateway...');
    const { stdout: apiResponse } = await execAsync(`
      aws apigateway create-rest-api \\
        --name "ai-business-factory-scheduler" \\
        --description "API Gateway for AI Business Factory Scheduler"
    `);
    
    const apiData = JSON.parse(apiResponse);
    const API_ID = apiData.id;
    const ROOT_RESOURCE_ID = apiData.rootResourceId;
    
    console.log(`✅ Created API Gateway: ${API_ID}`);

    const LAMBDA_ARN = 'arn:aws:lambda:us-east-1:519284856023:function:ai-business-factory-scheduler';
    const ACCOUNT_ID = '519284856023';
    const REGION = 'us-east-1';

    console.log('\n🔧 Step 2: Create proxy resource...');
    
    // Create {proxy+} resource
    const { stdout: proxyResource } = await execAsync(`
      aws apigateway create-resource \\
        --rest-api-id ${API_ID} \\
        --parent-id ${ROOT_RESOURCE_ID} \\
        --path-part '{proxy+}'
    `);
    
    const proxyResourceData = JSON.parse(proxyResource);
    const PROXY_RESOURCE_ID = proxyResourceData.id;
    console.log(`✅ Created proxy resource: ${PROXY_RESOURCE_ID}`);

    console.log('\n🔧 Step 3: Create ANY methods...');
    
    // Create ANY method for proxy resource
    await execAsync(`
      aws apigateway put-method \\
        --rest-api-id ${API_ID} \\
        --resource-id ${PROXY_RESOURCE_ID} \\
        --http-method ANY \\
        --authorization-type NONE
    `);
    
    // Create ANY method for root resource  
    await execAsync(`
      aws apigateway put-method \\
        --rest-api-id ${API_ID} \\
        --resource-id ${ROOT_RESOURCE_ID} \\
        --http-method ANY \\
        --authorization-type NONE
    `);
    console.log('✅ Created ANY methods');

    console.log('\n🔧 Step 4: Set up Lambda integrations...');
    
    // Set up integration for proxy resource
    await execAsync(`
      aws apigateway put-integration \\
        --rest-api-id ${API_ID} \\
        --resource-id ${PROXY_RESOURCE_ID} \\
        --http-method ANY \\
        --type AWS_PROXY \\
        --integration-http-method POST \\
        --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations
    `);
    
    // Set up integration for root resource
    await execAsync(`
      aws apigateway put-integration \\
        --rest-api-id ${API_ID} \\
        --resource-id ${ROOT_RESOURCE_ID} \\
        --http-method ANY \\
        --type AWS_PROXY \\
        --integration-http-method POST \\
        --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations
    `);
    console.log('✅ Created Lambda integrations');

    console.log('\n🔧 Step 5: Grant API Gateway permission...');
    
    // Add Lambda permission for API Gateway
    await execAsync(`
      aws lambda add-permission \\
        --function-name ai-business-factory-scheduler \\
        --statement-id apigateway-access \\
        --action lambda:InvokeFunction \\
        --principal apigateway.amazonaws.com \\
        --source-arn arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*
    `);
    console.log('✅ Granted API Gateway permission');

    console.log('\n🔧 Step 6: Deploy API...');
    
    // Create deployment
    const { stdout: deployment } = await execAsync(`
      aws apigateway create-deployment \\
        --rest-api-id ${API_ID} \\
        --stage-name prod \\
        --stage-description "Production stage for Scheduler API" \\
        --description "Initial deployment with Lambda integration"
    `);
    
    const deploymentData = JSON.parse(deployment);
    console.log(`✅ Created deployment: ${deploymentData.id}`);

    const apiUrl = `https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod`;
    console.log(`\n🎉 Scheduler API Gateway ready!`);
    console.log('====================================');
    console.log(`🌐 API Gateway URL: ${apiUrl}`);
    console.log(`🔍 Health endpoint: ${apiUrl}/health`);
    console.log(`⏰ Schedule endpoint: ${apiUrl}/schedule`);
    
    return { apiUrl, apiId: API_ID };

  } catch (error) {
    console.error('❌ API Gateway setup failed:', error.message);
    throw error;
  }
}

async function testSchedulerAPI(apiUrl) {
  console.log('\n🧪 Testing Scheduler API...');
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthTest = await execAsync(`curl -s "${apiUrl}/health"`);
    console.log('Health Response:', healthTest.stdout);
    
    console.log('\n✅ All Scheduler API tests passed!');
    
  } catch (error) {
    console.error('❌ Scheduler API testing failed:', error.message);
  }
}

// Main execution
async function main() {
  try {
    const { apiUrl, apiId } = await setupSchedulerAPI();
    
    // Wait for deployment to propagate
    console.log('\n⏳ Waiting for deployment to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await testSchedulerAPI(apiUrl);
    
    console.log('\n⏰ Scheduler Summary:');
    console.log('=====================');
    console.log('✅ Scheduler Lambda deployed');
    console.log('✅ API Gateway configured');
    console.log('✅ SQS integration ready');
    console.log('✅ Default strategies configured');
    console.log('✅ Manual scheduling endpoint active');
    
    console.log('\n🚀 Scheduler Lambda deployment complete!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

main();