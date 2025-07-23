const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeProvider {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.config = config;
    this.client = new Anthropic({ apiKey });
    this.name = 'claude';
    
    // Rate limiting for Claude
    this.rateLimits = {
      requestsPerMinute: 4000,
      tokensPerMinute: 400000,
      requestsRemaining: 4000,
      tokensRemaining: 400000,
      resetTime: Date.now() + 60000
    };
  }
  
  async generate(request, modelConfig) {
    const startTime = Date.now();
    
    try {
      // Prepare Claude request
      const claudeRequest = {
        model: modelConfig.name,
        max_tokens: Math.min(request.maxTokens || 4000, modelConfig.maxTokens),
        temperature: request.temperature || 0.7,
        system: this.getSystemPrompt(request.taskType),
        messages: [
          {
            role: 'user',
            content: request.context 
              ? `Context: ${request.context}\n\nTask: ${request.prompt}`
              : request.prompt
          }
        ]
      };
      
      // Make API call
      const response = await this.client.messages.create(claudeRequest);
      
      // Process response
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const cost = this.calculateCost(response.usage, modelConfig.costPerToken);
      
      // Update rate limits
      this.updateRateLimits(response);
      
      return {
        content: response.content[0].text,
        model: modelConfig.name,
        provider: this.name,
        tokensUsed,
        cost,
        latency: Date.now() - startTime,
        finishReason: response.stop_reason,
        usage: response.usage
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Handle specific Claude errors
      if (error.status === 429) {
        throw new Error(`Claude rate limit exceeded: ${error.message}`);
      } else if (error.status === 401) {
        throw new Error(`Claude authentication failed: ${error.message}`);
      } else if (error.status === 400) {
        throw new Error(`Claude bad request: ${error.message}`);
      } else if (error.status >= 500) {
        throw new Error(`Claude server error: ${error.message}`);
      }
      
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
  
  getSystemPrompt(taskType) {
    const prompts = {
      'business_plan': `You are Claude, an expert business strategist with deep knowledge of market dynamics, financial modeling, and strategic planning. Create comprehensive business plans that include:
- Executive summary with clear value proposition
- Market analysis with TAM/SAM/SOM breakdown
- Competitive analysis and differentiation strategy
- Business model and revenue streams
- Financial projections and funding requirements
- Implementation timeline and milestones
- Risk analysis and mitigation strategies
Be specific, actionable, and data-driven in your recommendations.`,
      
      'market_analysis': `You are Claude, a market research expert with expertise in industry analysis, consumer behavior, and competitive intelligence. Provide thorough market analysis including:
- Market size and growth trends
- Customer segmentation and personas
- Competitive landscape mapping
- Market opportunities and threats
- Regulatory environment impact
- Technology trends affecting the market
Support your analysis with logical reasoning and identify key insights.`,
      
      'sentiment_analysis': `You are Claude, a sentiment analysis expert specializing in natural language understanding and emotional intelligence. Analyze the provided text for:
- Overall sentiment (positive, negative, neutral) with confidence score
- Emotional tone and intensity
- Key sentiment-bearing phrases
- Context and nuance consideration
- Potential biases or subjective elements
Provide clear, objective analysis with supporting evidence.`,
      
      'general': `You are Claude, a helpful AI assistant created by Anthropic. Provide thoughtful, accurate, and helpful responses. Be clear and concise while being comprehensive. Consider multiple perspectives when appropriate.`
    };
    
    return prompts[taskType] || prompts['general'];
  }
  
  calculateCost(usage, costPerToken) {
    // Claude uses different pricing for input vs output tokens
    const inputCost = usage.input_tokens * costPerToken;
    const outputCost = usage.output_tokens * costPerToken;
    return inputCost + outputCost;
  }
  
  updateRateLimits(response) {
    // Claude rate limits are typically communicated via headers
    // This is a simplified implementation
    this.rateLimits.requestsRemaining = Math.max(0, this.rateLimits.requestsRemaining - 1);
    this.rateLimits.tokensRemaining = Math.max(0, this.rateLimits.tokensRemaining - (response.usage?.input_tokens + response.usage?.output_tokens || 0));
  }
  
  async healthCheck() {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Health check' }]
      });
      
      return {
        status: 'healthy',
        latency: response.response_ms || 0,
        model: 'claude-3-haiku-20240307'
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
  
  // Claude-specific method for long context handling
  isLongContextRequest(request) {
    const totalContent = request.prompt + (request.context || '');
    return totalContent.length > 100000; // 100K+ characters suggests long context
  }
  
  // Claude-specific method for selecting optimal model based on request
  selectOptimalModel(request) {
    const totalContent = request.prompt + (request.context || '');
    const contentLength = totalContent.length;
    
    if (contentLength > 150000) {
      return 'claude-3-opus-20240229'; // Best for very long contexts
    } else if (request.priority === 'high' || request.taskType === 'business_plan') {
      return 'claude-3-opus-20240229'; // Best quality
    } else if (contentLength > 50000) {
      return 'claude-3-sonnet-20240229'; // Good balance for medium contexts
    } else {
      return 'claude-3-haiku-20240307'; // Fast and cost-effective
    }
  }
}

module.exports = { ClaudeProvider };