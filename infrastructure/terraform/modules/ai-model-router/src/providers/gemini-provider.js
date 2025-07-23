const { GoogleGenerativeAI } = require('@google-ai/generativelanguage');

class GeminiProvider {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.config = config;
    this.client = new GoogleGenerativeAI(apiKey);
    this.name = 'gemini';
    
    // Rate limiting for Gemini
    this.rateLimits = {
      requestsPerMinute: 1000,
      tokensPerMinute: 1000000,
      requestsRemaining: 1000,
      tokensRemaining: 1000000,
      resetTime: Date.now() + 60000
    };
  }
  
  async generate(request, modelConfig) {
    const startTime = Date.now();
    
    try {
      // Get the generative model
      const model = this.client.getGenerativeModel({ model: modelConfig.name });
      
      // Prepare request content
      const prompt = request.context 
        ? `Context: ${request.context}\n\nTask: ${request.prompt}`
        : request.prompt;
      
      // Configure generation parameters
      const generationConfig = {
        temperature: request.temperature || 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: Math.min(request.maxTokens || 4000, modelConfig.maxTokens),
      };
      
      // Make API call
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });
      
      const response = result.response;
      
      // Process response
      const content = response.text();
      const tokensUsed = this.estimateTokens(prompt, content);
      const cost = this.calculateCost(tokensUsed, modelConfig.costPerToken);
      
      // Update rate limits
      this.updateRateLimits(tokensUsed);
      
      return {
        content,
        model: modelConfig.name,
        provider: this.name,
        tokensUsed,
        cost,
        latency: Date.now() - startTime,
        finishReason: response.finishReason || 'completed',
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(content),
          totalTokens: tokensUsed
        }
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Handle specific Gemini errors
      if (error.status === 429) {
        throw new Error(`Gemini rate limit exceeded: ${error.message}`);
      } else if (error.status === 401 || error.status === 403) {
        throw new Error(`Gemini authentication failed: ${error.message}`);
      } else if (error.status === 400) {
        throw new Error(`Gemini bad request: ${error.message}`);
      } else if (error.status >= 500) {
        throw new Error(`Gemini server error: ${error.message}`);
      }
      
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  getSystemPrompt(taskType) {
    // Gemini doesn't have a system prompt concept like others, so we'll prepend to content
    const prompts = {
      'business_plan': `You are an expert business strategist and market analyst. Create comprehensive business plans with detailed market research, competitive analysis, financial projections, and strategic recommendations. Focus on actionable insights and data-driven decisions.`,
      
      'market_analysis': `You are a market research expert specializing in industry analysis, consumer trends, and competitive intelligence. Provide thorough market analysis including market size, growth trends, customer segmentation, competitive landscape, and market opportunities. Use real-time data and current market conditions when possible.`,
      
      'sentiment_analysis': `You are a sentiment analysis expert with expertise in natural language processing and emotional intelligence. Analyze the emotional tone, opinion strength, and sentiment classification of the provided text. Provide detailed sentiment breakdown with confidence scores and supporting evidence.`,
      
      'general': `You are a helpful AI assistant. Provide clear, accurate, and comprehensive responses to user queries. Be informative and practical in your answers.`
    };
    
    return prompts[taskType] || prompts['general'];
  }
  
  calculateCost(tokensUsed, costPerToken) {
    return tokensUsed * costPerToken;
  }
  
  estimateTokens(text, completionText = '') {
    // Rough estimation: 4 characters per token on average
    const totalChars = text.length + completionText.length;
    return Math.ceil(totalChars / 4);
  }
  
  updateRateLimits(tokensUsed) {
    // Update rate limits based on usage
    this.rateLimits.requestsRemaining = Math.max(0, this.rateLimits.requestsRemaining - 1);
    this.rateLimits.tokensRemaining = Math.max(0, this.rateLimits.tokensRemaining - tokensUsed);
  }
  
  async healthCheck() {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Health check' }] }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0
        }
      });
      
      return {
        status: 'healthy',
        latency: result.response.latency || 0,
        model: 'gemini-pro'
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
  
  // Gemini-specific method for multimodal content
  async generateMultimodal(request, modelConfig, imageData = null) {
    const startTime = Date.now();
    
    try {
      const model = this.client.getGenerativeModel({ model: modelConfig.name });
      
      const parts = [{ text: request.prompt }];
      
      // Add image if provided
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data
          }
        });
      }
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: Math.min(request.maxTokens || 4000, modelConfig.maxTokens),
        }
      });
      
      const response = result.response;
      const content = response.text();
      const tokensUsed = this.estimateTokens(request.prompt, content);
      const cost = this.calculateCost(tokensUsed, modelConfig.costPerToken);
      
      return {
        content,
        model: modelConfig.name,
        provider: this.name,
        tokensUsed,
        cost,
        latency: Date.now() - startTime,
        finishReason: response.finishReason || 'completed',
        multimodal: true,
        usage: {
          promptTokens: this.estimateTokens(request.prompt),
          completionTokens: this.estimateTokens(content),
          totalTokens: tokensUsed
        }
      };
      
    } catch (error) {
      throw new Error(`Gemini multimodal generation failed: ${error.message}`);
    }
  }
  
  // Gemini-specific method for real-time data integration
  async generateWithRealTimeData(request, modelConfig) {
    // This would integrate with real-time data sources
    // For now, we'll add a note about real-time capabilities
    const enhancedPrompt = `${request.prompt}\n\nNote: Use the most current information available and indicate when real-time data would be beneficial for this analysis.`;
    
    return await this.generate({
      ...request,
      prompt: enhancedPrompt
    }, modelConfig);
  }
  
  // Gemini-specific method for code generation
  async generateCode(request, modelConfig, language = 'javascript') {
    const codePrompt = `Generate ${language} code for the following request. Include comments and best practices.\n\nRequest: ${request.prompt}`;
    
    return await this.generate({
      ...request,
      prompt: codePrompt
    }, modelConfig);
  }
}

module.exports = { GeminiProvider };