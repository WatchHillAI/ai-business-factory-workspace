const { OpenAIProvider } = require('./openai-provider');
const { ClaudeProvider } = require('./claude-provider');
const { GeminiProvider } = require('./gemini-provider');

class AIProviderFactory {
  constructor(config = {}) {
    this.config = config;
    this.providers = new Map();
    this.secretsManager = null;
  }
  
  async getProvider(providerName) {
    if (!this.providers.has(providerName)) {
      const provider = await this.createProvider(providerName);
      this.providers.set(providerName, provider);
    }
    
    return this.providers.get(providerName);
  }
  
  async createProvider(providerName) {
    const apiKey = await this.getApiKey(providerName);
    
    switch (providerName) {
      case 'openai':
        return new OpenAIProvider(apiKey, this.config);
      case 'claude':
        return new ClaudeProvider(apiKey, this.config);
      case 'gemini':
        return new GeminiProvider(apiKey, this.config);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
  
  async getApiKey(providerName) {
    const secretsManager = await this.getSecretsManager();
    
    const secretMap = {
      'openai': process.env.OPENAI_SECRET_ARN,
      'claude': process.env.CLAUDE_SECRET_ARN,
      'gemini': process.env.GEMINI_SECRET_ARN
    };
    
    const secretArn = secretMap[providerName];
    if (!secretArn) {
      throw new Error(`No secret ARN configured for provider: ${providerName}`);
    }
    
    try {
      const response = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
      return response.SecretString;
    } catch (error) {
      throw new Error(`Failed to retrieve API key for ${providerName}: ${error.message}`);
    }
  }
  
  async getSecretsManager() {
    if (!this.secretsManager) {
      const AWS = require('aws-sdk');
      this.secretsManager = new AWS.SecretsManager();
    }
    return this.secretsManager;
  }
  
  // Health check for all providers
  async checkHealth() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results[name] = { status: 'healthy', ...health };
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
      }
    }
    
    return results;
  }
  
  // Get rate limit status for all providers
  async getRateLimits() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const rateLimits = await provider.getRateLimits();
        results[name] = rateLimits;
      } catch (error) {
        results[name] = { error: error.message };
      }
    }
    
    return results;
  }
}

module.exports = { AIProviderFactory };