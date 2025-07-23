const { OpenAI } = require('openai');

class OpenAIProvider {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.config = config;
    this.client = new OpenAI({ apiKey });
    this.name = 'openai';
    
    // Rate limiting
    this.rateLimits = {
      requestsPerMinute: 500,
      tokensPerMinute: 40000,
      requestsRemaining: 500,
      tokensRemaining: 40000,
      resetTime: Date.now() + 60000
    };
  }
  
  async generate(request, modelConfig) {
    const startTime = Date.now();
    
    try {
      // Prepare OpenAI request
      const openaiRequest = {
        model: modelConfig.name,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.taskType)
          },
          {
            role: 'user',
            content: request.context 
              ? `Context: ${request.context}\n\nTask: ${request.prompt}`
              : request.prompt
          }
        ],
        max_tokens: Math.min(request.maxTokens || 4000, modelConfig.maxTokens),
        temperature: request.temperature || 0.7,
        stream: false
      };
      
      // Make API call
      const response = await this.client.chat.completions.create(openaiRequest);
      
      // Process response
      const completion = response.choices[0];
      const tokensUsed = response.usage.total_tokens;
      const cost = this.calculateCost(tokensUsed, modelConfig.costPerToken);
      
      // Update rate limits from response headers
      this.updateRateLimits(response);
      
      return {
        content: completion.message.content,
        model: modelConfig.name,
        provider: this.name,
        tokensUsed,
        cost,
        latency: Date.now() - startTime,
        finishReason: completion.finish_reason,
        usage: response.usage
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error(`OpenAI rate limit exceeded: ${error.message}`);
      } else if (error.status === 401) {
        throw new Error(`OpenAI authentication failed: ${error.message}`);
      } else if (error.status === 400) {
        throw new Error(`OpenAI bad request: ${error.message}`);
      } else if (error.status >= 500) {
        throw new Error(`OpenAI server error: ${error.message}`);
      }
      
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
  
  getSystemPrompt(taskType) {
    const prompts = {
      'business_plan': `You are an expert business strategist and consultant. Generate comprehensive, actionable business plans with detailed market analysis, financial projections, and implementation strategies. Focus on practical, executable recommendations.`,
      
      'market_analysis': `You are a market research analyst. Provide thorough market analysis including trends, competitive landscape, target demographics, and market opportunities. Support your analysis with data-driven insights.`,
      
      'sentiment_analysis': `You are a sentiment analysis expert. Analyze the emotional tone, opinion, and sentiment of the provided text. Provide a clear classification (positive, negative, neutral) with confidence scores and reasoning.`,
      
      'general': `You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user queries. Be concise but comprehensive in your answers.`
    };
    
    return prompts[taskType] || prompts['general'];
  }
  
  calculateCost(tokensUsed, costPerToken) {
    return tokensUsed * costPerToken;
  }
  
  updateRateLimits(response) {
    // OpenAI includes rate limit info in response headers
    const headers = response.headers || {};
    
    this.rateLimits.requestsRemaining = parseInt(headers['x-ratelimit-remaining-requests'] || this.rateLimits.requestsRemaining);
    this.rateLimits.tokensRemaining = parseInt(headers['x-ratelimit-remaining-tokens'] || this.rateLimits.tokensRemaining);
    
    // Reset time is usually provided in seconds
    const resetSeconds = parseInt(headers['x-ratelimit-reset-requests'] || 0);
    if (resetSeconds > 0) {
      this.rateLimits.resetTime = Date.now() + (resetSeconds * 1000);
    }
  }
  
  async healthCheck() {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Health check' }],
        max_tokens: 10,
        temperature: 0
      });
      
      return {
        status: 'healthy',
        latency: response.response_ms || 0,
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  async getRateLimits() {
    return {
      provider: this.name,
      rateLimits: this.rateLimits,
      timestamp: new Date().toISOString()
    };
  }
  
  isRateLimited() {
    const now = Date.now();
    
    // Check if we're past the reset time
    if (now > this.rateLimits.resetTime) {
      this.rateLimits.requestsRemaining = this.rateLimits.requestsPerMinute;
      this.rateLimits.tokensRemaining = this.rateLimits.tokensPerMinute;
      this.rateLimits.resetTime = now + 60000;
    }
    
    return this.rateLimits.requestsRemaining <= 0 || this.rateLimits.tokensRemaining <= 0;
  }
  
  getWaitTime() {
    if (!this.isRateLimited()) {
      return 0;
    }
    
    return Math.max(0, this.rateLimits.resetTime - Date.now());
  }
  
  // Estimate cost before making request
  estimateCost(request, modelConfig) {
    // Rough token estimation (4 chars per token average)
    const inputTokens = Math.ceil((request.prompt.length + (request.context || '').length) / 4);
    const outputTokens = request.maxTokens || 4000;
    const totalTokens = inputTokens + outputTokens;
    
    return totalTokens * modelConfig.costPerToken;
  }
}

module.exports = { OpenAIProvider };