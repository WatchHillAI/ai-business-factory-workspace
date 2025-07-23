import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  ValidationResult 
} from '../types/agent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';

// Input schema for Market Research Agent
const MarketResearchInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'ai-automation', 'saas-tools', 'ecommerce', 'fintech',
    'healthtech', 'edtech', 'proptech', 'climate-tech',
    'creator-economy', 'web3-crypto'
  ]),
  tier: z.enum(['public', 'exclusive', 'ai-generated']),
});

export type MarketResearchInput = z.infer<typeof MarketResearchInputSchema>;

// Market signal schema
const MarketSignalSchema = z.object({
  type: z.enum(['search_trend', 'funding_activity', 'regulatory_change', 'social_sentiment', 'patent_activity']),
  description: z.string(),
  strength: z.enum(['low', 'medium', 'high']),
  trend: z.enum(['declining', 'stable', 'increasing']),
  source: z.string(),
  quantifiedImpact: z.string().optional(),
  timeframe: z.string().optional(),
});

export type MarketSignal = z.infer<typeof MarketSignalSchema>;

// Customer evidence schema
const CustomerEvidenceSchema = z.object({
  customerProfile: z.object({
    industry: z.string(),
    companySize: z.enum(['startup', 'small', 'medium', 'enterprise']),
    role: z.string(),
    geography: z.string(),
  }),
  painPoint: z.object({
    description: z.string(),
    quote: z.string(),
    quantifiedImpact: z.string(),
  }),
  currentSolution: z.object({
    description: z.string(),
    cost: z.string(),
    limitations: z.array(z.string()),
  }),
  willingnessToPay: z.object({
    amount: z.string(),
    confidence: z.enum(['low', 'medium', 'high']),
    reasoningBasis: z.string(),
  }),
  credibilityScore: z.number().min(0).max(100),
});

export type CustomerEvidence = z.infer<typeof CustomerEvidenceSchema>;

// Competitor analysis schema
const CompetitorSchema = z.object({
  name: z.string(),
  description: z.string(),
  marketPosition: z.enum(['startup', 'challenger', 'leader', 'niche']),
  funding: z.object({
    totalRaised: z.string(),
    lastRound: z.string(),
    stage: z.string(),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  differentiationOpportunity: z.string(),
});

export type Competitor = z.infer<typeof CompetitorSchema>;

// Problem statement schema
const ProblemStatementSchema = z.object({
  summary: z.string(),
  quantifiedImpact: z.string(),
  currentSolutions: z.array(z.string()),
  solutionLimitations: z.array(z.string()),
  costOfInaction: z.string(),
});

export type ProblemStatement = z.infer<typeof ProblemStatementSchema>;

// Market timing schema
const MarketTimingSchema = z.object({
  assessment: z.enum(['too-early', 'perfect', 'getting-late', 'too-late']),
  reasoning: z.string(),
  catalysts: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export type MarketTiming = z.infer<typeof MarketTimingSchema>;

// Output schema for Market Research Agent
const MarketResearchOutputSchema = z.object({
  problemStatement: ProblemStatementSchema,
  marketSignals: z.array(MarketSignalSchema),
  customerEvidence: z.array(CustomerEvidenceSchema),
  competitorAnalysis: z.array(CompetitorSchema),
  marketTiming: MarketTimingSchema,
  confidence: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      problemValidation: z.number().min(0).max(100),
      marketSignals: z.number().min(0).max(100),
      customerEvidence: z.number().min(0).max(100),
      competitorAnalysis: z.number().min(0).max(100),
      marketTiming: z.number().min(0).max(100),
    }),
  }),
});

export type MarketResearchOutput = z.infer<typeof MarketResearchOutputSchema>;

export class MarketResearchAgent extends BaseAgent<MarketResearchInput, MarketResearchOutput> {
  constructor(
    config: AgentConfig,
    llmProvider: LLMProvider,
    cacheProvider?: CacheProvider,
    dataSourceProvider?: DataSourceProvider
  ) {
    super(config, llmProvider, cacheProvider, dataSourceProvider);
  }

  protected async processRequest(
    input: MarketResearchInput, 
    context: AgentContext
  ): Promise<MarketResearchOutput> {
    this.logger.info(`Processing market research for: ${input.title}`);

    // Step 1: Generate problem statement
    const problemStatement = await this.analyzeProblemSpace(input, context);
    
    // Step 2: Detect market signals
    const marketSignals = await this.detectMarketSignals(input, context);
    
    // Step 3: Generate customer evidence
    const customerEvidence = await this.generateCustomerEvidence(input, problemStatement, context);
    
    // Step 4: Analyze competitors
    const competitorAnalysis = await this.analyzeCompetitors(input, problemStatement, context);
    
    // Step 5: Assess market timing
    const marketTiming = await this.assessMarketTiming(input, marketSignals, competitorAnalysis, context);

    // Step 6: Calculate confidence scores
    const confidence = this.calculateConfidenceScores(
      problemStatement,
      marketSignals,
      customerEvidence,
      competitorAnalysis,
      marketTiming
    );

    return {
      problemStatement,
      marketSignals,
      customerEvidence,
      competitorAnalysis,
      marketTiming,
      confidence,
    };
  }

  private async analyzeProblemSpace(
    input: MarketResearchInput,
    context: AgentContext
  ): Promise<ProblemStatement> {
    const prompt = `
    Analyze the problem space for the business idea: "${input.title}"
    Description: ${input.description}
    Category: ${input.category}
    
    Generate a comprehensive problem statement with:
    1. A 2-3 sentence problem summary with specific pain points
    2. Quantified impact metrics (dollar amounts, percentages, time lost)
    3. 4-5 current solutions in the market
    4. Limitations of each current solution  
    5. Cost of inaction for potential customers
    
    Use realistic industry data and market assumptions. Focus on ${input.category} sector specifics.
    Consider the analysis depth: ${context.analysisDepth}
    
    Return valid JSON matching this structure:
    {
      "summary": "string",
      "quantifiedImpact": "string", 
      "currentSolutions": ["string"],
      "solutionLimitations": ["string"],
      "costOfInaction": "string"
    }
    `;

    const response = await this.callLLM(prompt, {
      format: 'json',
      temperature: 0.3,
      maxTokens: 1000
    });

    return this.validateAndParse(response, ProblemStatementSchema);
  }

  private async detectMarketSignals(
    input: MarketResearchInput,
    context: AgentContext
  ): Promise<MarketSignal[]> {
    // Use data source provider if available for real market data
    let externalData = null;
    if (this.dataSourceProvider) {
      try {
        const trendData = await this.dataSourceProvider.fetchData({
          type: 'market_trends',
          params: { 
            keywords: this.extractKeywords(input.description),
            category: input.category 
          }
        });
        externalData = trendData.data;
      } catch (error) {
        this.logger.warn('Failed to fetch external trend data', error instanceof Error ? error.message : String(error));
      }
    }

    const prompt = `
    Detect market signals for business idea: "${input.title}"
    Category: ${input.category}
    Analysis depth: ${context.analysisDepth}
    
    ${externalData ? `External market data: ${JSON.stringify(externalData)}` : ''}
    
    Generate 3-6 market signals including:
    - Search trends and interest indicators
    - Funding activity in the sector
    - Regulatory changes affecting the market
    - Social sentiment and discussion volume
    - Patent/innovation activity
    
    Each signal should have:
    - Type (search_trend, funding_activity, regulatory_change, social_sentiment, patent_activity)
    - Clear description with specific metrics
    - Strength assessment (low, medium, high)
    - Trend direction (declining, stable, increasing)
    - Source/basis for the signal
    - Quantified impact where possible
    - Relevant timeframe
    
    Return valid JSON array of market signals.
    `;

    const response = await this.callLLM(prompt, {
      format: 'json',
      temperature: 0.4,
      maxTokens: 1500
    });

    const signalsArray = JSON.parse(response);
    return z.array(MarketSignalSchema).parse(signalsArray);
  }

  private async generateCustomerEvidence(
    input: MarketResearchInput,
    problem: ProblemStatement,
    context: AgentContext
  ): Promise<CustomerEvidence[]> {
    const customerSegments = this.identifyCustomerSegments(input.category);
    
    const evidencePromises = customerSegments.slice(0, 3).map(async (segment) => {
      const prompt = `
      Generate realistic customer evidence for ${segment.industry} ${segment.size} company:
      
      Business idea: "${input.title}"
      Problem context: ${problem.summary}
      Target segment: ${segment.industry} ${segment.size} companies
      
      Create detailed customer evidence including:
      
      Customer Profile:
      - Industry: ${segment.industry}
      - Company size: ${segment.size}
      - Decision maker role
      - Geographic location
      
      Pain Point:
      - Specific pain point description
      - Realistic customer quote (conversational, authentic)
      - Quantified problem impact (time/money lost)
      
      Current Solution:
      - What they use today
      - Cost of current solution
      - 3-4 specific limitations
      
      Willingness to Pay:
      - Price range they'd consider
      - Confidence level (low/medium/high)
      - Reasoning for willingness to pay
      
      Credibility Score: 1-100 (how realistic this evidence is)
      
      Make this sound like real customer research, not generic responses.
      Return valid JSON matching the CustomerEvidence schema.
      `;

      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.5,
        maxTokens: 800
      });

      return this.validateAndParse(response, CustomerEvidenceSchema);
    });

    return await Promise.all(evidencePromises);
  }

  private async analyzeCompetitors(
    input: MarketResearchInput,
    problem: ProblemStatement,
    context: AgentContext
  ): Promise<Competitor[]> {
    // Try to get real competitor data if data source is available
    let competitorData = null;
    if (this.dataSourceProvider) {
      try {
        const companyData = await this.dataSourceProvider.fetchData({
          type: 'companies',
          params: { category: input.category }
        });
        competitorData = companyData.data;
      } catch (error) {
        this.logger.warn('Failed to fetch competitor data', error instanceof Error ? error.message : String(error));
      }
    }

    const prompt = `
    Analyze competitors for business idea: "${input.title}"
    Category: ${input.category}
    Problem being solved: ${problem.summary}
    
    ${competitorData ? `Real competitor data: ${JSON.stringify(competitorData)}` : ''}
    
    Identify 2-4 key competitors including:
    
    For each competitor:
    - Company name
    - Brief description of their solution
    - Market position: startup, challenger, leader, or niche
    - Funding information:
      - Total funding raised
      - Last funding round details
      - Current stage (seed, series A, etc.)
    - 3-4 key strengths
    - 3-4 key weaknesses
    - Specific differentiation opportunity against this competitor
    
    Include mix of:
    - Direct competitors (same solution)
    - Indirect competitors (solve same problem differently)
    - Adjacent players who might enter the space
    
    Use realistic funding numbers and market positions.
    Return valid JSON array of competitors.
    `;

    const response = await this.callLLM(prompt, {
      format: 'json',
      temperature: 0.4,
      maxTokens: 1200
    });

    const competitorsArray = JSON.parse(response);
    return z.array(CompetitorSchema).parse(competitorsArray);
  }

  private async assessMarketTiming(
    input: MarketResearchInput,
    signals: MarketSignal[],
    competitors: Competitor[],
    context: AgentContext
  ): Promise<MarketTiming> {
    const prompt = `
    Assess market timing for business idea: "${input.title}"
    Category: ${input.category}
    
    Market signals:
    ${signals.map(s => `- ${s.type}: ${s.description} (${s.strength} strength, ${s.trend})`).join('\n')}
    
    Competitive landscape:
    ${competitors.map(c => `- ${c.name}: ${c.marketPosition} with ${c.funding.totalRaised} raised`).join('\n')}
    
    Analyze market timing considering:
    - Technology readiness and adoption curves
    - Regulatory environment and changes
    - Market maturity and saturation
    - Economic conditions and funding climate
    - Consumer/business readiness for solution
    - Competitive timing (first-mover vs. fast-follower)
    
    Assessment options:
    - too-early: Technology or market not ready
    - perfect: Ideal timing window
    - getting-late: Window closing but still viable
    - too-late: Market saturated or declining
    
    Provide:
    - Assessment with reasoning
    - 3-5 specific catalysts driving timing
    - Confidence score 1-100
    
    Return valid JSON matching MarketTiming schema.
    `;

    const response = await this.callLLM(prompt, {
      format: 'json',
      temperature: 0.3,
      maxTokens: 600
    });

    return this.validateAndParse(response, MarketTimingSchema);
  }

  private calculateConfidenceScores(
    problem: ProblemStatement,
    signals: MarketSignal[],
    evidence: CustomerEvidence[],
    competitors: Competitor[],
    timing: MarketTiming
  ): MarketResearchOutput['confidence'] {
    // Problem validation confidence
    const problemValidation = Math.min(95, 
      (problem.quantifiedImpact ? 20 : 0) +
      (problem.currentSolutions.length >= 3 ? 20 : problem.currentSolutions.length * 6) +
      (problem.solutionLimitations.length >= 3 ? 20 : problem.solutionLimitations.length * 6) +
      (problem.costOfInaction ? 20 : 0) +
      (problem.summary.length > 100 ? 15 : 10)
    );

    // Market signals confidence
    const marketSignalsConf = Math.min(95,
      (signals.length * 15) +
      (signals.filter(s => s.strength === 'high').length * 10) +
      (signals.filter(s => s.quantifiedImpact).length * 5)
    );

    // Customer evidence confidence
    const customerEvidenceConf = Math.min(95,
      (evidence.length * 20) +
      (evidence.reduce((sum, e) => sum + e.credibilityScore, 0) / evidence.length * 0.3)
    );

    // Competitor analysis confidence
    const competitorConf = Math.min(95,
      (competitors.length >= 2 ? 30 : competitors.length * 15) +
      (competitors.filter(c => c.funding.totalRaised !== 'Unknown').length * 15) +
      (competitors.reduce((sum, c) => sum + c.strengths.length + c.weaknesses.length, 0) * 2)
    );

    // Market timing confidence (use the agent's own confidence)
    const timingConf = timing.confidence;

    // Overall confidence (weighted average)
    const overall = Math.round(
      (problemValidation * 0.25) +
      (marketSignalsConf * 0.2) +
      (customerEvidenceConf * 0.25) +
      (competitorConf * 0.15) +
      (timingConf * 0.15)
    );

    return {
      overall,
      breakdown: {
        problemValidation,
        marketSignals: marketSignalsConf,
        customerEvidence: customerEvidenceConf,
        competitorAnalysis: competitorConf,
        marketTiming: timingConf,
      },
    };
  }

  private extractKeywords(description: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stop words
    const stopWords = ['this', 'that', 'with', 'from', 'they', 'been', 'have', 'their', 'would', 'there'];
    return words.filter(word => !stopWords.includes(word)).slice(0, 5);
  }

  private identifyCustomerSegments(category: string): Array<{industry: string, size: 'startup' | 'small' | 'medium' | 'enterprise'}> {
    const segmentMap: Record<string, Array<{industry: string, size: 'startup' | 'small' | 'medium' | 'enterprise'}>> = {
      'ai-automation': [
        { industry: 'Professional Services', size: 'small' },
        { industry: 'E-commerce', size: 'medium' },
        { industry: 'Manufacturing', size: 'enterprise' },
      ],
      'saas-tools': [
        { industry: 'Technology', size: 'startup' },
        { industry: 'Marketing Agencies', size: 'small' },
        { industry: 'Financial Services', size: 'medium' },
      ],
      'ecommerce': [
        { industry: 'Retail', size: 'small' },
        { industry: 'Consumer Goods', size: 'medium' },
        { industry: 'Fashion', size: 'startup' },
      ],
      'fintech': [
        { industry: 'Banking', size: 'enterprise' },
        { industry: 'Insurance', size: 'medium' },
        { industry: 'Investment', size: 'small' },
      ],
      'healthtech': [
        { industry: 'Healthcare Providers', size: 'medium' },
        { industry: 'Pharmaceuticals', size: 'enterprise' },
        { industry: 'Medical Devices', size: 'small' },
      ],
    };

    return segmentMap[category] || [
      { industry: 'Technology', size: 'startup' },
      { industry: 'Professional Services', size: 'small' },
      { industry: 'Enterprise Software', size: 'medium' },
    ];
  }

  protected validateInput(input: MarketResearchInput): ValidationResult {
    try {
      MarketResearchInputSchema.parse(input);
      return {
        isValid: true,
        errors: [],
        confidence: 100,
        suggestions: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            severity: 'error' as const,
          })),
          confidence: 0,
          suggestions: ['Ensure all required fields are provided with valid values'],
        };
      }
      
      return {
        isValid: false,
        errors: [{
          field: 'input',
          message: 'Invalid input format',
          severity: 'error',
        }],
        confidence: 0,
        suggestions: ['Check input data structure'],
      };
    }
  }

  protected validateOutput(output: MarketResearchOutput): ValidationResult {
    try {
      MarketResearchOutputSchema.parse(output);
      
      const errors: ValidationResult['errors'] = [];
      const suggestions: string[] = [];

      // Additional business logic validation
      if (output.customerEvidence.length < 2) {
        errors.push({
          field: 'customerEvidence',
          message: 'At least 2 customer evidence examples required',
          severity: 'warning',
        });
        suggestions.push('Add more customer evidence for stronger validation');
      }

      if (output.marketSignals.length < 3) {
        errors.push({
          field: 'marketSignals',
          message: 'At least 3 market signals recommended',
          severity: 'warning',
        });
      }

      if (output.confidence.overall < 70) {
        suggestions.push('Consider gathering more data to improve confidence scores');
      }

      return {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
        confidence: output.confidence.overall,
        suggestions,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'output',
          message: 'Output validation failed',
          severity: 'error',
        }],
        confidence: 0,
        suggestions: ['Check output data structure against schema'],
      };
    }
  }

  protected async performQualityAssurance(
    output: MarketResearchOutput,
    context: AgentContext
  ): Promise<ValidationResult> {
    const issues: ValidationResult['errors'] = [];
    const suggestions: string[] = [];
    let totalScore = 0;
    const maxScore = 100;

    // Check data completeness
    const completenessScore = this.assessDataCompleteness(output);
    totalScore += completenessScore * 0.3;

    if (completenessScore < this.qualityThresholds.dataCompletenessThreshold) {
      issues.push({
        field: 'completeness',
        message: `Data completeness score ${completenessScore} below threshold ${this.qualityThresholds.dataCompletenessThreshold}`,
        severity: 'warning',
      });
    }

    // Check consistency across sections
    const consistencyScore = this.assessDataConsistency(output);
    totalScore += consistencyScore * 0.3;

    if (consistencyScore < this.qualityThresholds.consistencyThreshold) {
      issues.push({
        field: 'consistency',
        message: 'Inconsistencies detected between analysis sections',
        severity: 'warning',
      });
      suggestions.push('Review cross-references between problem statement, customer evidence, and competitor analysis');
    }

    // Check actionability
    const actionabilityScore = this.assessActionability(output);
    totalScore += actionabilityScore * 0.4;

    if (actionabilityScore < this.qualityThresholds.actionabilityThreshold) {
      issues.push({
        field: 'actionability',
        message: 'Analysis lacks specific, actionable insights',
        severity: 'warning',
      });
      suggestions.push('Add more specific metrics, timelines, and concrete recommendations');
    }

    const finalScore = Math.min(maxScore, Math.max(0, totalScore));

    return {
      isValid: issues.filter(e => e.severity === 'error').length === 0,
      errors: issues,
      confidence: finalScore,
      suggestions,
    };
  }

  private assessDataCompleteness(output: MarketResearchOutput): number {
    let score = 0;
    const checks = [
      { check: output.problemStatement.summary.length > 50, points: 15 },
      { check: output.problemStatement.quantifiedImpact.length > 0, points: 10 },
      { check: output.problemStatement.currentSolutions.length >= 3, points: 10 },
      { check: output.marketSignals.length >= 3, points: 15 },
      { check: output.customerEvidence.length >= 2, points: 15 },
      { check: output.competitorAnalysis.length >= 2, points: 15 },
      { check: output.marketTiming.catalysts.length >= 3, points: 10 },
      { check: output.confidence.overall >= 70, points: 10 },
    ];

    checks.forEach(({ check, points }) => {
      if (check) score += points;
    });

    return score;
  }

  private assessDataConsistency(output: MarketResearchOutput): number {
    let score = 100;

    // Check if customer evidence aligns with problem statement
    const problemKeywords = output.problemStatement.summary.toLowerCase().split(' ');
    const evidenceAlignment = output.customerEvidence.some(e => 
      problemKeywords.some(keyword => 
        e.painPoint.description.toLowerCase().includes(keyword)
      )
    );

    if (!evidenceAlignment) score -= 20;

    // Check if competitors address similar problems
    const competitorAlignment = output.competitorAnalysis.some(c =>
      problemKeywords.some(keyword =>
        c.description.toLowerCase().includes(keyword)
      )
    );

    if (!competitorAlignment) score -= 15;

    // Check timing vs signals alignment
    const positiveSignals = output.marketSignals.filter(s => s.trend === 'increasing').length;
    const timingMismatch = (
      (output.marketTiming.assessment === 'too-early' && positiveSignals > 2) ||
      (output.marketTiming.assessment === 'too-late' && positiveSignals > 1)
    );

    if (timingMismatch) score -= 25;

    return Math.max(0, score);
  }

  private assessActionability(output: MarketResearchOutput): number {
    let score = 0;

    // Check for specific metrics and numbers
    const hasQuantifiedMetrics = [
      output.problemStatement.quantifiedImpact,
      ...output.customerEvidence.map(e => e.painPoint.quantifiedImpact),
      ...output.marketSignals.filter(s => s.quantifiedImpact).map(s => s.quantifiedImpact!)
    ].some(metric => /\$|\%|\d+/.test(metric));

    if (hasQuantifiedMetrics) score += 25;

    // Check for specific timeframes
    const hasTimeframes = output.marketSignals.some(s => s.timeframe && s.timeframe.length > 0);
    if (hasTimeframes) score += 15;

    // Check for differentiation opportunities
    const hasDifferentiation = output.competitorAnalysis.every(c => c.differentiationOpportunity.length > 20);
    if (hasDifferentiation) score += 20;

    // Check for specific customer segments
    const hasSpecificSegments = output.customerEvidence.every(e => 
      e.customerProfile.industry.length > 0 && e.customerProfile.role.length > 0
    );
    if (hasSpecificSegments) score += 20;

    // Check for actionable catalysts
    const hasActionableCatalysts = output.marketTiming.catalysts.some(c => 
      c.includes('launch') || c.includes('regulation') || c.includes('trend') || c.includes('investment')
    );
    if (hasActionableCatalysts) score += 20;

    return Math.min(100, score);
  }
}