const { CostOptimizer } = require('./cost-optimizer');

class ModelSelector {
  constructor(config = {}) {
    this.config = config;
    this.costOptimizer = new CostOptimizer(config);
  }
  
  async selectModel(request) {
    // Get current cost optimization settings
    const costOptimizationEnabled = this.config.enableCostOptimization || false;
    const budgetCheck = costOptimizationEnabled ? await this.costOptimizer.checkBudget(request) : { allowed: true };
    
    // Task-specific routing logic
    switch (request.taskType) {
      case 'business_plan':
        return this.selectForBusinessPlan(request, budgetCheck);
      case 'market_analysis':
        return this.selectForMarketAnalysis(request, budgetCheck);
      case 'sentiment_analysis':
        return this.selectForSentiment(request, budgetCheck);
      default:
        return this.selectGeneral(request, budgetCheck);
    }
  }
  
  selectForBusinessPlan(request, budgetCheck) {
    const contextLength = (request.prompt + (request.context || '')).length;
    const highBudgetUtilization = budgetCheck.budgetUtilization > 0.8;
    
    // Long context requires Claude's 200K context window
    if (contextLength > 100000) {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-opus', costPerToken: 0.000075, maxTokens: 200000 },
          { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 }
        ],
        reasoning: 'Long context detected, Claude Opus required for 200K token support'
      };
    }
    
    // High priority or low budget utilization - use premium models
    if (request.priority === 'high' && !highBudgetUtilization) {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-opus', costPerToken: 0.000075, maxTokens: 200000 },
          { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 }
        ],
        reasoning: 'High priority request with available budget, using premium models'
      };
    }
    
    // Cost optimization mode or high budget utilization
    if (highBudgetUtilization) {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-sonnet', costPerToken: 0.000015, maxTokens: 200000 },
          { provider: 'claude', name: 'claude-3-haiku', costPerToken: 0.00000025, maxTokens: 200000 }
        ],
        reasoning: 'Budget optimization enabled, using cost-effective Claude models'
      };
    }
    
    // Default business plan routing
    return {
      models: [
        { provider: 'claude', name: 'claude-3-opus', costPerToken: 0.000075, maxTokens: 200000 },
        { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 }
      ],
      reasoning: 'Standard business plan generation with Claude reasoning capabilities'
    };
  }
  
  selectForMarketAnalysis(request, budgetCheck) {
    const highBudgetUtilization = budgetCheck.budgetUtilization > 0.8;
    
    // Cost optimization mode
    if (highBudgetUtilization) {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-haiku', costPerToken: 0.00000025, maxTokens: 200000 },
          { provider: 'gemini', name: 'gemini-pro', costPerToken: 0.0000005, maxTokens: 1000000 }
        ],
        reasoning: 'Budget optimization enabled, using cost-effective models'
      };
    }
    
    // Normal market analysis routing - prefer Gemini for multimodal and real-time capabilities
    return {
      models: [
        { provider: 'gemini', name: 'gemini-pro', costPerToken: 0.0000005, maxTokens: 1000000 },
        { provider: 'claude', name: 'claude-3-sonnet', costPerToken: 0.000015, maxTokens: 200000 },
        { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 }
      ],
      reasoning: 'Market analysis optimized for Gemini multimodal and real-time capabilities'
    };
  }
  
  selectForSentiment(request, budgetCheck) {
    const highBudgetUtilization = budgetCheck.budgetUtilization > 0.8;
    
    // Aggressive cost optimization for sentiment analysis
    if (highBudgetUtilization || request.priority === 'low') {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-haiku', costPerToken: 0.00000025, maxTokens: 200000 },
          { provider: 'openai', name: 'gpt-3.5-turbo', costPerToken: 0.000002, maxTokens: 16000 }
        ],
        reasoning: 'Cost optimization enabled, using cheaper models for sentiment analysis'
      };
    }
    
    // High accuracy sentiment analysis
    return {
      models: [
        { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 },
        { provider: 'claude', name: 'claude-3-sonnet', costPerToken: 0.000015, maxTokens: 200000 }
      ],
      reasoning: 'High accuracy sentiment analysis with OpenAI proven performance'
    };
  }
  
  selectGeneral(request, budgetCheck) {
    const highBudgetUtilization = budgetCheck.budgetUtilization > 0.8;
    
    // Cost optimization mode
    if (highBudgetUtilization) {
      return {
        models: [
          { provider: 'claude', name: 'claude-3-haiku', costPerToken: 0.00000025, maxTokens: 200000 },
          { provider: 'openai', name: 'gpt-3.5-turbo', costPerToken: 0.000002, maxTokens: 16000 }
        ],
        reasoning: 'Budget optimization enabled, using cost-effective models'
      };
    }
    
    // Balanced general-purpose routing
    return {
      models: [
        { provider: 'claude', name: 'claude-3-sonnet', costPerToken: 0.000015, maxTokens: 200000 },
        { provider: 'openai', name: 'gpt-4-turbo', costPerToken: 0.00003, maxTokens: 128000 }
      ],
      reasoning: 'Balanced general-purpose routing with good quality-to-cost ratio'
    };
  }
}

module.exports = { ModelSelector };