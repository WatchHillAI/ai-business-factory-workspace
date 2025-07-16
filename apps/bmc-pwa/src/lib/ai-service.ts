import { AIRequest, AIResponse, AISuggestion, BMCBoxType, AIModel } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || null; // No default API - will work offline only

export class AIService {
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Request AI suggestions for a BMC box
   */
  async getSuggestions(
    boxType: BMCBoxType,
    currentContent: string,
    context?: string
  ): Promise<AISuggestion[]> {
    // If no API URL is configured, return demo suggestions
    if (!API_BASE_URL) {
      return this.getDemoSuggestions(boxType, currentContent);
    }

    if (!this.isOnline) {
      throw new Error('AI suggestions require internet connection');
    }

    try {
      const request: AIRequest = {
        prompt: this.buildPrompt(boxType, currentContent),
        context: context || '',
        boxType,
        model: this.selectModel(boxType),
        maxTokens: 500,
        temperature: 0.7,
        priority: 'medium'
      };

      const response = await fetch(`${API_BASE_URL}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const aiResponse: AIResponse = await response.json();
      
      // Parse suggestions from AI response
      return this.parseSuggestions(aiResponse.content, boxType);
    } catch (error) {
      console.error('AI suggestions error:', error);
      
      // Fallback to cached suggestions if available
      const cachedSuggestions = await this.getCachedSuggestions(boxType);
      if (cachedSuggestions.length > 0) {
        return cachedSuggestions;
      }
      
      throw error;
    }
  }

  /**
   * Generate business plan from completed canvas
   */
  async generateBusinessPlan(canvas: any): Promise<string> {
    if (!this.isOnline) {
      throw new Error('Business plan generation requires internet connection');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ai/business-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          canvas,
          format: 'markdown',
          includeExecutiveSummary: true,
          includeFinancialProjections: true
        })
      });

      if (!response.ok) {
        throw new Error(`Business plan generation failed: ${response.status}`);
      }

      const result = await response.json();
      return result.content;
    } catch (error) {
      console.error('Business plan generation error:', error);
      throw error;
    }
  }

  /**
   * Validate and enhance content
   */
  async enhanceContent(
    boxType: BMCBoxType,
    content: string
  ): Promise<string> {
    if (!this.isOnline) {
      return content; // Return unchanged if offline
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ai/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          boxType,
          content,
          enhancementType: 'grammar_and_clarity'
        })
      });

      if (!response.ok) {
        throw new Error(`Content enhancement failed: ${response.status}`);
      }

      const result = await response.json();
      return result.enhancedContent;
    } catch (error) {
      console.error('Content enhancement error:', error);
      return content; // Return original content on error
    }
  }

  /**
   * Get contextual questions to help user think through a section
   */
  async getGuidingQuestions(boxType: BMCBoxType): Promise<string[]> {
    const questionBank = {
      valuePropositions: [
        "What specific problem are you solving for your customers?",
        "What makes your solution unique or better than alternatives?",
        "What outcomes do customers achieve by using your product/service?",
        "What emotional benefits do customers experience?",
        "How do you measure the value you provide?"
      ],
      customerSegments: [
        "Who are your ideal customers? Be as specific as possible.",
        "What demographics, psychographics, or behaviors define them?",
        "What are their biggest pain points or challenges?",
        "How do they currently solve the problem you're addressing?",
        "Are there different types of customers with different needs?"
      ],
      customerRelationships: [
        "How do you want customers to experience your brand?",
        "What level of personal attention do customers expect?",
        "How will you acquire new customers?",
        "How will you retain and grow existing customer relationships?",
        "What role do customers play in your value creation process?"
      ],
      channels: [
        "How do customers prefer to discover solutions like yours?",
        "What channels do your competitors use successfully?",
        "Which channels are most cost-effective for customer acquisition?",
        "How will you support customers through their buying journey?",
        "What channels work best for different customer segments?"
      ],
      revenueStreams: [
        "What are customers willing to pay for?",
        "How do they prefer to pay (subscription, one-time, usage-based)?",
        "What price would make this a no-brainer for customers?",
        "Are there opportunities for recurring revenue?",
        "Could you monetize data, insights, or other byproducts?"
      ],
      keyActivities: [
        "What core activities must you excel at to deliver your value proposition?",
        "Which activities are most critical to your business model?",
        "What activities require the most resources or expertise?",
        "Which activities could you potentially outsource?",
        "What activities give you competitive advantage?"
      ],
      keyResources: [
        "What unique assets do you need to make your business model work?",
        "What intellectual property, data, or expertise is critical?",
        "What physical, financial, or human resources are essential?",
        "Which resources are hardest for competitors to replicate?",
        "What resources could you access through partnerships?"
      ],
      keyPartners: [
        "Who could help you reach customers more effectively?",
        "What capabilities do you need that others do better?",
        "Who shares similar customers but offers complementary services?",
        "What strategic alliances could reduce your risks or costs?",
        "Who could help you scale faster or more efficiently?"
      ],
      costStructure: [
        "What are your largest cost categories?",
        "Which costs are fixed vs. variable?",
        "What costs scale with customer growth?",
        "Where could you achieve economies of scale?",
        "What costs are absolutely necessary vs. nice-to-have?"
      ]
    };

    return questionBank[boxType] || [];
  }

  /**
   * Build prompt for specific BMC box type
   */
  private buildPrompt(boxType: BMCBoxType, currentContent: string): string {
    const prompts = {
      valuePropositions: `As a business strategist, help improve this Value Propositions section. Current content: "${currentContent}". Provide 3 specific, actionable suggestions for strengthening the value proposition. Focus on customer benefits, differentiation, and measurable outcomes.`,
      
      customerSegments: `As a market research expert, help refine this Customer Segments section. Current content: "${currentContent}". Provide 3 specific suggestions for better defining target customers, including demographic details, behavioral patterns, and unmet needs.`,
      
      customerRelationships: `As a customer experience strategist, help enhance this Customer Relationships section. Current content: "${currentContent}". Provide 3 specific suggestions for building stronger customer relationships, including acquisition, retention, and growth strategies.`,
      
      channels: `As a go-to-market specialist, help optimize this Channels section. Current content: "${currentContent}". Provide 3 specific suggestions for effective distribution channels, including customer discovery, sales processes, and support delivery.`,
      
      revenueStreams: `As a business model expert, help strengthen this Revenue Streams section. Current content: "${currentContent}". Provide 3 specific suggestions for sustainable revenue generation, including pricing models, payment methods, and value capture opportunities.`,
      
      keyActivities: `As an operations consultant, help improve this Key Activities section. Current content: "${currentContent}". Provide 3 specific suggestions for critical business activities, including value creation processes, operational excellence, and competitive advantages.`,
      
      keyResources: `As a strategic resource planner, help enhance this Key Resources section. Current content: "${currentContent}". Provide 3 specific suggestions for essential resources, including unique assets, capabilities, and strategic investments.`,
      
      keyPartners: `As a partnership strategist, help develop this Key Partners section. Current content: "${currentContent}". Provide 3 specific suggestions for strategic partnerships, including supplier relationships, joint ventures, and ecosystem collaborations.`,
      
      costStructure: `As a financial strategist, help optimize this Cost Structure section. Current content: "${currentContent}". Provide 3 specific suggestions for cost management, including fixed vs variable costs, economies of scale, and cost optimization opportunities.`
    };

    return prompts[boxType] || `Help improve this business model section: "${currentContent}". Provide 3 specific, actionable suggestions.`;
  }

  /**
   * Select appropriate AI model for the task
   */
  private selectModel(boxType: BMCBoxType): AIModel {
    // Strategic sections benefit from Claude's reasoning
    const strategicBoxes = ['valuePropositions', 'customerSegments', 'revenueStreams'];
    if (strategicBoxes.includes(boxType)) {
      return 'claude-sonnet';
    }
    
    // Operational sections can use faster models
    return 'claude-haiku';
  }

  /**
   * Parse AI response into structured suggestions
   */
  private parseSuggestions(content: string, boxType: BMCBoxType): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Split content by numbered points or bullet points
    const parts = content.split(/\d+\.|•|-/).filter(part => part.trim().length > 10);
    
    parts.forEach((part, index) => {
      const cleanContent = part.trim();
      if (cleanContent) {
        suggestions.push({
          id: `${boxType}-suggestion-${Date.now()}-${index}`,
          content: cleanContent,
          type: 'suggestion',
          confidence: 0.8, // Default confidence
          createdAt: new Date(),
          reviewed: false
        });
      }
    });

    // Fallback if parsing fails
    if (suggestions.length === 0) {
      suggestions.push({
        id: `${boxType}-suggestion-${Date.now()}`,
        content: content.trim(),
        type: 'suggestion',
        confidence: 0.7,
        createdAt: new Date(),
        reviewed: false
      });
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get cached suggestions for offline use
   */
  private async getCachedSuggestions(boxType: BMCBoxType): Promise<AISuggestion[]> {
    try {
      const cached = localStorage.getItem(`ai_suggestions_${boxType}`);
      if (cached) {
        const suggestions = JSON.parse(cached);
        return suggestions.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        }));
      }
    } catch (error) {
      console.error('Error loading cached suggestions:', error);
    }
    return [];
  }

  /**
   * Cache suggestions for offline use
   */
  // private async cacheSuggestions(boxType: BMCBoxType, suggestions: AISuggestion[]): Promise<void> {
  //   try {
  //     localStorage.setItem(`ai_suggestions_${boxType}`, JSON.stringify(suggestions));
  //   } catch (error) {
  //     console.error('Error caching suggestions:', error);
  //   }
  // }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      // For demo purposes, return a placeholder token
      return 'demo_token';
    }

    return token;
  }

  /**
   * Clear cached suggestions
   */
  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('ai_suggestions_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get AI service status
   */
  getStatus(): {
    isOnline: boolean;
    hasCache: boolean;
  } {
    const keys = Object.keys(localStorage);
    const hasCache = keys.some(key => key.startsWith('ai_suggestions_'));
    
    return {
      isOnline: this.isOnline,
      hasCache
    };
  }

  /**
   * Get demo suggestions when no API is available
   */
  private getDemoSuggestions(boxType: BMCBoxType, _currentContent: string): AISuggestion[] {
    // Extended suggestion bank with more variety
    const suggestions: { [key in BMCBoxType]: string[] } = {
      keyPartners: [
        "Consider technology providers who can offer specialized solutions",
        "Look for suppliers with sustainable practices",
        "Explore partnerships with complementary businesses",
        "Build strategic alliances with industry leaders",
        "Partner with distribution channels for market access",
        "Consider joint ventures for new market entry",
        "Develop relationships with research institutions",
        "Create supplier networks for cost optimization"
      ],
      keyActivities: [
        "Focus on core activities that create the most value",
        "Consider which activities could be automated",
        "Think about quality control and customer support",
        "Develop efficient production processes",
        "Invest in research and development capabilities",
        "Build strong marketing and brand awareness",
        "Create robust supply chain management",
        "Establish effective sales processes"
      ],
      valuePropositions: [
        "Define what makes your offering unique",
        "Consider both functional and emotional benefits",
        "Think about pain points you're solving",
        "Quantify the value you provide to customers",
        "Focus on outcomes rather than features",
        "Address specific customer jobs-to-be-done",
        "Consider convenience and accessibility factors",
        "Think about long-term customer success"
      ],
      customerRelationships: [
        "Consider personal vs automated touchpoints",
        "Think about acquisition, retention, and growth strategies",
        "Define your community building approach"
      ],
      customerSegments: [
        "Identify your most profitable customer groups",
        "Consider demographic and psychographic factors",
        "Think about different use cases for your product"
      ],
      keyResources: [
        "Identify your most critical assets",
        "Consider intellectual property and brand value",
        "Think about human resources and expertise"
      ],
      channels: [
        "Consider both digital and physical channels",
        "Think about channel partner opportunities",
        "Evaluate direct vs indirect distribution"
      ],
      costStructure: [
        "Identify your largest cost drivers",
        "Consider fixed vs variable costs",
        "Look for opportunities to optimize spending"
      ],
      revenueStreams: [
        "Consider recurring vs one-time revenue",
        "Think about different pricing models",
        "Explore additional monetization opportunities"
      ]
    };

    const boxSuggestions = suggestions[boxType] || ["Add some content to get started"];
    
    // Randomize suggestions to provide variety on refresh
    const shuffledSuggestions = [...boxSuggestions].sort(() => Math.random() - 0.5);
    const selectedSuggestions = shuffledSuggestions.slice(0, 3); // Take 3 random suggestions
    
    return selectedSuggestions.map((text, index) => ({
      id: `demo-${boxType}-${index}`,
      content: text,
      type: 'suggestion' as const,
      confidence: 0.8,
      createdAt: new Date(),
      reviewed: false
    }));
  }
}

export const aiService = new AIService();