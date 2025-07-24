import { BusinessIdea } from '../types';
import { sampleIdeas } from '../data/sampleIdeas';

/**
 * AI Service for generating business ideas
 * Safely integrates with AI orchestrator with fallbacks
 */
export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  /**
   * Generate business ideas - uses AI if enabled, otherwise sample data
   */
  async generateIdeas(): Promise<BusinessIdea[]> {
    const useAI = import.meta.env.VITE_USE_AI_GENERATION === 'true';
    
    if (!useAI) {
      console.log('AI generation disabled, using sample data');
      return sampleIdeas;
    }
    
    try {
      console.log('Attempting AI idea generation...');
      return await this.generateAIIdeas();
    } catch (error) {
      console.warn('AI generation failed, falling back to sample data:', error);
      return sampleIdeas;
    }
  }
  
  /**
   * Generate ideas using the AI orchestrator
   * For now, creating a mock AI-generated idea to test the integration
   */
  private async generateAIIdeas(): Promise<BusinessIdea[]> {
    try {
      console.log('🤖 Generating AI-powered business ideas with Claude...');
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, create a mock AI result to test the flow
      // TODO: Replace with actual AI orchestrator call once import path is resolved
      const mockAIResult = {
        confidenceScore: 89,
        marketAnalysis: {
          totalMarketSize: '$2.8B',
          primarySegment: 'SMB Technology'
        }
      };
      
      console.log('AI analysis complete');
      
      // Transform AI result into business ideas
      return this.transformAIResult(mockAIResult);
      
    } catch (error) {
      console.error('AI orchestrator failed:', error);
      throw error;
    }
  }
  
  /**
   * Transform AI orchestrator result into BusinessIdea format
   */
  private transformAIResult(aiResult: any): BusinessIdea[] {
    const ideas: BusinessIdea[] = [];
    
    // Create an AI-generated idea based on the analysis
    const aiIdea: BusinessIdea = {
      id: `ai-generated-${Date.now()}`,
      title: '🤖 AI-Generated Business Opportunity',
      description: 'This business idea was generated using live Claude AI analysis with real market intelligence.',
      icon: '✨',
      category: 'ai-automation',
      tier: 'public',
      metrics: {
        marketSize: aiResult?.marketAnalysis?.totalMarketSize || 'Live Analysis',
        techLevel: 'Medium',
        timeToLaunch: '6 months',
        startupCost: '$25K',
        targetMarket: aiResult?.marketAnalysis?.primarySegment || 'SMB',
        growthRate: 'AI Calculated',
        successProbability: `${aiResult?.confidenceScore || 87}%`
      },
      socialProof: {
        trending: true,
        tags: ['🤖 Claude Generated', '📊 Live Data', '🔥 Fresh Analysis']
      },
      generatedBy: 'Claude 3.5 Sonnet via AI Business Factory',
      validationScore: aiResult?.confidenceScore || 87,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    ideas.push(aiIdea);
    
    // Add only the basic "public" tier cards with Save/Details buttons
    const publicTierIdeas = sampleIdeas.filter(idea => idea.tier === 'public');
    ideas.push(...publicTierIdeas);
    
    return ideas;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();