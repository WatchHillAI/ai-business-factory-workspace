import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface LLMResponse {
  text: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  format?: 'text' | 'json';
  systemMessage?: string;
}

export abstract class LLMProvider {
  abstract generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  abstract getAvailableModels(): string[];
  abstract getProviderName(): string;
}

export class ClaudeProvider extends LLMProvider {
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    const systemMessage = options.systemMessage || 'You are a business analysis AI assistant specializing in market research, financial modeling, and risk assessment.';
    
    try {
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.3,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: options.format === 'json' 
              ? `${prompt}\n\nPlease respond with valid JSON only.`
              : prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return {
        text: content.text,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        model: this.defaultModel,
        finishReason: response.stop_reason || 'end_turn'
      };

    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022', 
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  getProviderName(): string {
    return 'anthropic';
  }
}

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  private defaultModel = 'gpt-4-0125-preview';

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    const systemMessage = options.systemMessage || 'You are a business analysis AI assistant specializing in market research, financial modeling, and risk assessment.';
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.3,
        response_format: options.format === 'json' ? { type: 'json_object' } : { type: 'text' },
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: options.format === 'json' 
              ? `${prompt}\n\nPlease respond with valid JSON only.`
              : prompt
          }
        ]
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('Empty response from OpenAI API');
      }

      return {
        text: choice.message.content,
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.defaultModel,
        finishReason: choice.finish_reason || 'stop'
      };

    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4-0125-preview',
      'gpt-4-1106-preview',
      'gpt-4',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo'
    ];
  }

  getProviderName(): string {
    return 'openai';
  }
}

export class MockLLMProvider extends LLMProvider {
  private responses: Map<string, string> = new Map();

  constructor() {
    super();
    this.setupMockResponses();
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Find best matching mock response
    let response = 'Mock response for prompt: ' + prompt.substring(0, 50);
    
    for (const [key, value] of this.responses) {
      if (prompt.toLowerCase().includes(key.toLowerCase())) {
        response = value;
        break;
      }
    }

    if (options.format === 'json') {
      try {
        JSON.parse(response);
      } catch {
        response = '{"mockResponse": "' + response.replace(/"/g, '\\"') + '"}';
      }
    }

    return {
      text: response,
      tokensUsed: Math.floor(Math.random() * 1000) + 100,
      model: 'mock-model-v1',
      finishReason: 'stop'
    };
  }

  private setupMockResponses(): void {
    this.responses.set('market analysis', JSON.stringify({
      problemStatement: {
        summary: "Small businesses struggle with 24/7 customer support, leading to lost sales and poor customer experience.",
        quantifiedImpact: "$50B lost annually in SMB sector due to inadequate customer support",
        currentSolutions: ["Traditional call centers", "Email support", "Basic chatbots", "Social media monitoring"],
        solutionLimitations: ["High cost", "Limited availability", "Poor automation", "Inconsistent quality"],
        costOfInaction: "15-30% revenue impact from poor customer experience"
      },
      marketSignals: [
        {
          type: "search_trend",
          description: "287% increase in 'AI customer service' searches over 24 months",
          strength: "high",
          trend: "increasing"
        }
      ]
    }));

    this.responses.set('financial model', JSON.stringify({
      marketSizing: {
        tam: { value: 150000000000, methodology: "Global customer service software market" },
        sam: { value: 45000000000, methodology: "SMB segment addressable market" },
        som: { value: 2250000000, methodology: "Realistic 5% capture over 5 years" }
      }
    }));
  }

  getAvailableModels(): string[] {
    return ['mock-model-v1', 'mock-model-v2'];
  }

  getProviderName(): string {
    return 'mock';
  }
}

// Factory function to create appropriate provider
export function createLLMProvider(
  provider: 'claude' | 'openai' | 'mock',
  apiKey?: string
): LLMProvider {
  switch (provider) {
    case 'claude':
      if (!apiKey) throw new Error('API key required for Claude provider');
      return new ClaudeProvider(apiKey);
    
    case 'openai':
      if (!apiKey) throw new Error('API key required for OpenAI provider');
      return new OpenAIProvider(apiKey);
    
    case 'mock':
      return new MockLLMProvider();
    
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}