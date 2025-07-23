/**
 * API service for connecting to the AI Agent Orchestrator
 * Live deployment endpoint for end-to-end testing
 */

const API_BASE_URL = 'https://bmh6tskmv4.execute-api.us-east-1.amazonaws.com/prod/ai-agents';

export interface BusinessAnalysisRequest {
  businessIdea: string;
  metadata?: {
    requestId?: string;
    source?: string;
    timestamp?: string;
  };
}

export interface BusinessAnalysisResponse {
  success: boolean;
  requestId: string;
  message: string;
  input: BusinessAnalysisRequest;
  status: string;
  nextSteps: string[];
  metadata: {
    timestamp: string;
    version: string;
    executionTime: number;
    agentsStatus: string;
  };
  error?: string;
}

export class AIAgentAPI {
  private static instance: AIAgentAPI;

  private constructor() {}

  public static getInstance(): AIAgentAPI {
    if (!AIAgentAPI.instance) {
      AIAgentAPI.instance = new AIAgentAPI();
    }
    return AIAgentAPI.instance;
  }

  /**
   * Check if the AI Agent system is healthy
   */
  async healthCheck(): Promise<{
    status: string;
    message: string;
    version: string;
    timestamp: string;
    capabilities: string[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Agent health check failed:', error);
      throw error;
    }
  }

  /**
   * Analyze a business idea using the AI Agent Orchestrator
   */
  async analyzeBusinessIdea(request: BusinessAnalysisRequest): Promise<BusinessAnalysisResponse> {
    try {
      // Add metadata if not provided
      const enrichedRequest: BusinessAnalysisRequest = {
        ...request,
        metadata: {
          requestId: `pwa-${Date.now()}`,
          source: 'ideas-pwa',
          timestamp: new Date().toISOString(),
          ...request.metadata,
        },
      };

      console.log('🤖 Sending request to AI Agent Orchestrator:', enrichedRequest);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Analysis failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ AI Agent analysis complete:', result);

      return result;
    } catch (error) {
      console.error('❌ AI Agent analysis failed:', error);
      throw error;
    }
  }

  /**
   * Mock comprehensive analysis for development/fallback
   * This matches the structure expected by the detail view
   */
  async getMockAnalysis(businessIdea: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      requestId: `mock-${Date.now()}`,
      message: 'Mock analysis generated (fallback mode)',
      analysis: {
        confidence: {
          overall: 87,
          breakdown: {
            marketSignals: 85,
            customerEvidence: 89,
            competitorAnalysis: 84,
            marketTiming: 91,
            problemValidation: 87
          }
        },
        problemStatement: {
          description: businessIdea,
          marketSize: '$50B',
          targetCustomers: ['Small businesses', 'Enterprise customers', 'Individual users'],
          painPoints: ['Manual processes', 'High costs', 'Time consumption']
        },
        marketSignals: [
          {
            source: 'Google Trends',
            metric: 'Search Volume',
            value: '+287%',
            trend: 'increasing',
            confidence: 85
          }
        ],
        customerEvidence: [
          {
            segment: 'Early Adopters',
            size: '12M',
            willingnessToPay: '$29/month',
            confidence: 89
          }
        ],
        competitorAnalysis: [
          {
            name: 'Competitor A',
            strength: 'Market leader',
            weakness: 'High pricing',
            marketShare: '25%'
          }
        ],
        marketTiming: {
          assessment: 'PERFECT',
          catalysts: [
            'Technology advancement',
            'Market demand increase',
            'Regulatory changes'
          ],
          confidence: 91
        },
        financialModel: {
          revenueModel: 'Subscription',
          pricing: '$29-99/month',
          breakEven: '18 months'
        },
        founderFit: {
          requiredSkills: ['Technical', 'Business', 'Marketing'],
          experience: 'Mid-level recommended'
        },
        riskAssessment: {
          risks: ['Competition', 'Market changes', 'Technical challenges'],
          mitigation: ['Strong differentiation', 'Agile development', 'Market research']
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.1.0-mock',
        executionTime: 1500,
        agentsStatus: 'mock_mode'
      }
    };
  }
}

export const aiAgentAPI = AIAgentAPI.getInstance();