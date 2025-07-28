const { createRouter } = require('/opt/nodejs/index');
const { v4: uuidv4 } = require('uuid');

// Initialize AI Model Router
let aiRouter;

async function getAIRouter() {
  if (!aiRouter) {
    aiRouter = createRouter({
      redisEndpoint: process.env.REDIS_ENDPOINT,
      databaseUrl: process.env.DATABASE_URL,
      enableCostOptimization: process.env.ENABLE_COST_OPTIMIZATION === 'true',
      dailyBudgetLimit: parseFloat(process.env.DAILY_BUDGET_LIMIT || '50'),
      monthlyBudgetLimit: parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '1500'),
      environment: process.env.NODE_ENV || 'dev'
    });
  }
  return aiRouter;
}

/**
 * AWS Lambda handler for business plan generation
 */
exports.apiHandler = async (event, context) => {
  console.log('Business Generator Lambda triggered:', JSON.stringify(event, null, 2));
  
  try {
    // Handle different event sources
    let body;
    if (event.body) {
      // API Gateway event
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else if (event.arguments) {
      // AppSync GraphQL event
      body = event.arguments;
    } else {
      // Direct Lambda invocation
      body = event;
    }
    
    const { opportunityId, title, description, marketData, priority = 'medium', userId } = body;
    
    // Validate required fields
    if (!title || !description) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required fields: title and description'
        })
      };
    }
    
    // Generate business plan using AI Model Router
    const router = await getAIRouter();
    
    const businessPlan = await generateBusinessPlan(router, {
      opportunityId,
      title,
      description,
      marketData,
      priority,
      userId
    });
    
    // Return response
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(businessPlan)
    };
    
    console.log('Business plan generated successfully:', businessPlan.id);
    return response;
    
  } catch (error) {
    console.error('Error generating business plan:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to generate business plan',
        message: error.message
      })
    };
  }
};

/**
 * Generate comprehensive business plan using AI Model Router
 */
async function generateBusinessPlan(router, input) {
  const { opportunityId, title, description, marketData, priority, userId } = input;
  
  // Create context for AI generation
  const context = {
    opportunity: {
      title,
      description,
      marketData
    },
    requirements: [
      'Executive Summary (2-3 paragraphs)',
      'Market Analysis (size, growth, trends, competition)',
      'Business Model (revenue streams, pricing, customer acquisition)',
      'Financial Projections (3-year revenue, costs, profitability)',
      'Implementation Plan (timeline, milestones, resources)',
      'Risk Analysis (market, technical, financial risks)'
    ]
  };
  
  // Generate business plan using AI Model Router
  const aiResponse = await router.route({
    taskType: 'business_plan',
    prompt: `Generate a comprehensive business plan for "${title}". 
    
Description: ${description}

Requirements:
1. Executive Summary (compelling overview with value proposition)
2. Market Analysis (market size, growth trends, target customers)
3. Business Model (revenue streams, pricing strategy, customer acquisition)
4. Financial Projections (3-year revenue, cost structure, break-even analysis)
5. Implementation Plan (development phases, timeline, key milestones)
6. Risk Analysis (market risks, technical challenges, mitigation strategies)

Make the plan specific, actionable, and professionally formatted.`,
    context: JSON.stringify(context),
    maxTokens: 4000,
    temperature: 0.7,
    priority,
    userId
  });
  
  // Parse and structure the business plan
  const businessPlan = {
    id: `plan_${uuidv4()}`,
    opportunityId,
    title,
    content: parseBusinessPlanContent(aiResponse.content),
    metadata: {
      generatedBy: `${aiResponse.provider}:${aiResponse.model}`,
      tokensUsed: aiResponse.tokensUsed,
      cost: aiResponse.cost,
      cached: aiResponse.cached,
      latency: aiResponse.latency,
      fallbackUsed: aiResponse.fallbackUsed,
      reasoning: aiResponse.reasoning
    },
    status: 'generated',
    createdAt: new Date().toISOString(),
    userId
  };
  
  console.log(`Business plan generated: ${businessPlan.id}, Cost: $${aiResponse.cost}, Model: ${aiResponse.provider}:${aiResponse.model}`);
  
  return businessPlan;
}

/**
 * Parse AI-generated content into structured business plan sections
 */
function parseBusinessPlanContent(content) {
  // Split content into sections based on headers
  const sections = content.split(/(?=#+\s|\n\d+\.|\n[A-Z][^a-z]*:|\n## |\n### )/);
  
  const plan = {
    executiveSummary: '',
    marketAnalysis: '',
    businessModel: '',
    financialProjections: '',
    implementationPlan: '',
    riskAnalysis: '',
    fullContent: content
  };
  
  // Extract sections using keywords
  sections.forEach(section => {
    const lowerSection = section.toLowerCase();
    
    if (lowerSection.includes('executive') || lowerSection.includes('summary')) {
      plan.executiveSummary = section.trim();
    } else if (lowerSection.includes('market') || lowerSection.includes('analysis')) {
      plan.marketAnalysis = section.trim();
    } else if (lowerSection.includes('business model') || lowerSection.includes('revenue')) {
      plan.businessModel = section.trim();
    } else if (lowerSection.includes('financial') || lowerSection.includes('projection')) {
      plan.financialProjections = section.trim();
    } else if (lowerSection.includes('implementation') || lowerSection.includes('timeline')) {
      plan.implementationPlan = section.trim();
    } else if (lowerSection.includes('risk') || lowerSection.includes('challenge')) {
      plan.riskAnalysis = section.trim();
    }
  });
  
  // If sections couldn't be parsed, use the full content
  if (!plan.executiveSummary && !plan.marketAnalysis) {
    plan.executiveSummary = content.substring(0, 500) + '...';
    plan.marketAnalysis = content;
  }
  
  return plan;
}

/**
 * Health check endpoint
 */
exports.healthCheck = async (event, context) => {
  try {
    const router = await getAIRouter();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'healthy',
        service: 'business-generator',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        aiRouter: !!router
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};