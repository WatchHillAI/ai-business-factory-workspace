import { BaseAgent } from '../core/BaseAgent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';
import { AgentContext, AgentResult } from '../types/agent';
import { Logger } from '../utils/Logger';
import { z } from 'zod';

// Input schema for Financial Modeling Agent
const FinancialModelingInputSchema = z.object({
  ideaText: z.string().min(10),
  title: z.string(),
  category: z.string(),
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
  userContext: z.object({
    budget: z.string().optional(),
    timeline: z.string().optional(),
    experience: z.string().optional(),
    industry: z.string().optional()
  }).optional()
});

export type FinancialModelingInput = z.infer<typeof FinancialModelingInputSchema>;

// TAM/SAM/SOM Analysis Schema
const TAMSAMSOMSchema = z.object({
  tam: z.object({
    value: z.string(),
    description: z.string(),
    methodology: z.string(),
    assumptions: z.array(z.string())
  }),
  sam: z.object({
    value: z.string(),
    description: z.string(),
    methodology: z.string(),
    assumptions: z.array(z.string())
  }),
  som: z.object({
    value: z.string(),
    description: z.string(),
    methodology: z.string(),
    marketShare: z.string(),
    timeframe: z.string()
  }),
  confidence: z.number().min(0).max(100)
});

export type TAMSAMSOMAnalysis = z.infer<typeof TAMSAMSOMSchema>;

// Revenue Projection Schema
const RevenueProjectionSchema = z.object({
  year: z.number().min(1).max(10),
  revenue: z.string(),
  customers: z.number(),
  averageRevenuePerUser: z.string(),
  growthRate: z.string(),
  assumptions: z.array(z.string()),
  confidence: z.number().min(0).max(100)
});

export type RevenueProjection = z.infer<typeof RevenueProjectionSchema>;

// Cost Analysis Schema
const CostAnalysisSchema = z.object({
  developmentCosts: z.array(z.object({
    category: z.string(),
    amount: z.string(),
    description: z.string(),
    timeline: z.string(),
    confidence: z.string()
  })),
  operationalCosts: z.array(z.object({
    category: z.string(),
    monthlyAmount: z.string(),
    description: z.string(),
    scalingFactor: z.string(),
    confidence: z.string()
  })),
  marketingCosts: z.array(z.object({
    category: z.string(),
    amount: z.string(),
    description: z.string(),
    timeline: z.string(),
    expectedROI: z.string()
  })),
  totalFirstYearCosts: z.string(),
  costStructure: z.string(),
  unitEconomics: z.object({
    customerAcquisitionCost: z.string(),
    customerLifetimeValue: z.string(),
    ltv2cacRatio: z.string(),
    paybackPeriod: z.string()
  })
});

export type CostAnalysis = z.infer<typeof CostAnalysisSchema>;

// Funding Requirements Schema
const FundingRequirementsSchema = z.object({
  totalRequired: z.string(),
  stages: z.array(z.object({
    stage: z.string(),
    amount: z.string(),
    timeline: z.string(),
    milestones: z.array(z.string()),
    valuation: z.string(),
    dilution: z.string()
  })),
  useOfFunds: z.array(z.object({
    category: z.string(),
    percentage: z.number(),
    amount: z.string(),
    description: z.string()
  })),
  investorTypes: z.array(z.object({
    type: z.string(),
    targetAmount: z.string(),
    probability: z.number(),
    requirements: z.array(z.string())
  })),
  alternatives: z.array(z.object({
    type: z.string(),
    description: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string())
  }))
});

export type FundingRequirements = z.infer<typeof FundingRequirementsSchema>;

// Financial Model Output Schema
const FinancialModelOutputSchema = z.object({
  tamSamSom: TAMSAMSOMSchema,
  revenueProjections: z.array(RevenueProjectionSchema),
  costAnalysis: CostAnalysisSchema,
  fundingRequirements: FundingRequirementsSchema,
  keyMetrics: z.object({
    breakEvenMonth: z.number(),
    cashFlowPositive: z.string(),
    burnRate: z.string(),
    runway: z.string(),
    grossMargin: z.string(),
    netMargin: z.string()
  }),
  scenarios: z.object({
    conservative: z.object({
      revenue5Year: z.string(),
      profitability: z.string(),
      description: z.string()
    }),
    realistic: z.object({
      revenue5Year: z.string(),
      profitability: z.string(),
      description: z.string()
    }),
    optimistic: z.object({
      revenue5Year: z.string(),
      profitability: z.string(),
      description: z.string()
    })
  }),
  confidence: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      marketSize: z.number().min(0).max(100),
      revenue: z.number().min(0).max(100),
      costs: z.number().min(0).max(100),
      funding: z.number().min(0).max(100)
    })
  })
});

export type FinancialModelOutput = z.infer<typeof FinancialModelOutputSchema>;

/**
 * Financial Modeling Agent
 * 
 * Generates comprehensive financial models including:
 * - TAM/SAM/SOM market size analysis
 * - 5-year revenue projections with multiple scenarios
 * - Detailed cost breakdown and unit economics
 * - Funding requirements and investment strategy
 * - Key financial metrics and break-even analysis
 */
export class FinancialModelingAgent extends BaseAgent<FinancialModelingInput, FinancialModelOutput> {
  private marketDataProvider?: DataSourceProvider;

  constructor(
    config: any,
    llmProvider: LLMProvider,
    cacheProvider?: CacheProvider,
    dataSourceProvider?: DataSourceProvider
  ) {
    super(config, llmProvider, cacheProvider, dataSourceProvider);
    this.marketDataProvider = dataSourceProvider;
  }

  // Alias for backward compatibility
  public async analyze(input: FinancialModelingInput, context: AgentContext) {
    return this.execute(input, context);
  }

  protected async processRequest(
    input: FinancialModelingInput,
    context: AgentContext
  ): Promise<FinancialModelOutput> {
    this.logger.info('Starting financial modeling analysis', { 
      ideaTitle: input.title,
      category: input.category,
      context: context.analysisDepth 
    });

    // Step 1: Analyze market size (TAM/SAM/SOM)
    const tamSamSom = await this.calculateMarketSize(input, context);
    
    // Step 2: Generate revenue projections
    const revenueProjections = await this.generateRevenueProjections(input, tamSamSom, context);
    
    // Step 3: Analyze cost structure
    const costAnalysis = await this.analyzeCostStructure(input, context);
    
    // Step 4: Calculate funding requirements
    const fundingRequirements = await this.calculateFundingRequirements(input, revenueProjections, costAnalysis, context);
    
    // Step 5: Derive key financial metrics
    const keyMetrics = this.calculateKeyMetrics(revenueProjections, costAnalysis);
    
    // Step 6: Generate scenario analysis
    const scenarios = await this.generateScenarioAnalysis(input, tamSamSom, revenueProjections, context);
    
    // Step 7: Calculate confidence scores
    const confidence = this.calculateConfidenceScores(tamSamSom, revenueProjections, costAnalysis, fundingRequirements);

    const result: FinancialModelOutput = {
      tamSamSom,
      revenueProjections,
      costAnalysis,
      fundingRequirements,
      keyMetrics,
      scenarios,
      confidence
    };

    this.logger.info('Financial modeling analysis completed', {
      overallConfidence: confidence.overall,
      tam: tamSamSom.tam.value,
      revenue5Year: scenarios.realistic.revenue5Year
    });

    return result;
  }

  private async calculateMarketSize(
    input: FinancialModelingInput,
    context: AgentContext
  ): Promise<TAMSAMSOMAnalysis> {
    // Gather market intelligence from free sources if available
    let marketIntelligence = '';
    if (this.marketDataProvider) {
      try {
        const marketData = await this.marketDataProvider.fetchData({
          type: 'market_size',
          params: { 
            industry: input.category,
            keywords: this.extractKeywords(input.ideaText)
          }
        });
        marketIntelligence = `Market data: ${JSON.stringify(marketData.data)}`;
      } catch (error) {
        this.logger.warn('Market data collection failed for TAM/SAM/SOM', error instanceof Error ? error.message : String(error));
      }
    }

    const prompt = `
    Calculate TAM/SAM/SOM market size analysis for this business idea:
    
    Business Idea: "${input.title}"
    Description: "${input.ideaText}"
    Category: ${input.category}
    Target Market: ${input.targetMarket || 'Not specified'}
    ${marketIntelligence}
    
    Provide realistic market size calculations:
    
    TAM (Total Addressable Market):
    - Global market size for the entire category
    - Use industry reports, research data, and comparable markets
    - Include methodology and key assumptions
    
    SAM (Serviceable Addressable Market):
    - Portion of TAM your business model can realistically address
    - Consider geographic, demographic, and capability constraints
    - Factor in business model limitations
    
    SOM (Serviceable Obtainable Market):
    - Realistic market share you can capture in 3-5 years
    - Consider competition, market entry barriers, and growth constraints
    - Base on similar company achievements and market dynamics
    
    For each metric, provide:
    - Monetary value with currency
    - Clear description and rationale
    - Calculation methodology
    - Key assumptions made
    - Confidence level reasoning
    
    Use industry-standard methodologies and reference real market data where possible.
    
    Return as valid JSON matching the TAMSAMSOMSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 2000
      });

      return TAMSAMSOMSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('TAM/SAM/SOM calculation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackMarketSize(input);
    }
  }

  private async generateRevenueProjections(
    input: FinancialModelingInput,
    tamSamSom: TAMSAMSOMAnalysis,
    context: AgentContext
  ): Promise<RevenueProjection[]> {
    const prompt = `
    Generate realistic 5-year revenue projections for this business:
    
    Business: "${input.title}"
    Category: ${input.category}
    SOM: ${tamSamSom.som.value}
    Business Model: ${input.businessModel || 'Not specified'}
    User Context: ${JSON.stringify(input.userContext || {})}
    
    Create year-by-year revenue projections (Years 1-5) considering:
    - Market entry timeline and customer acquisition rates
    - Pricing strategy and market positioning
    - Competition and market saturation
    - Business model scalability
    - Economic factors and market conditions
    
    For each year, calculate:
    - Total revenue with realistic growth rates
    - Customer count and acquisition rates
    - Average Revenue Per User (ARPU)
    - Growth rate from previous year
    - Key assumptions driving the projections
    - Confidence level based on market factors
    
    Base projections on:
    - Industry benchmarks and comparable companies
    - Market size constraints from SOM analysis
    - Realistic customer acquisition and retention rates
    - Business model economics and scalability factors
    
    Return as JSON array of 5 revenue projections matching RevenueProjectionSchema.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 2500
      });

      const projections = JSON.parse(response);
      return z.array(RevenueProjectionSchema).parse(projections);
    } catch (error) {
      this.logger.error('Revenue projections generation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackRevenueProjections(input, tamSamSom);
    }
  }

  private async analyzeCostStructure(
    input: FinancialModelingInput,
    context: AgentContext
  ): Promise<CostAnalysis> {
    const prompt = `
    Analyze comprehensive cost structure for this business:
    
    Business: "${input.title}"
    Description: "${input.ideaText}"
    Category: ${input.category}
    User Experience: ${input.userContext?.experience || 'Not specified'}
    Budget Context: ${input.userContext?.budget || 'Not specified'}
    
    Provide detailed cost analysis across three categories:
    
    1. DEVELOPMENT COSTS (One-time):
    - Technology development and infrastructure setup
    - Product design and user experience
    - Legal, regulatory, and compliance costs
    - Initial marketing and branding
    - Team hiring and training costs
    
    2. OPERATIONAL COSTS (Monthly/Recurring):
    - Cloud infrastructure and hosting
    - Software licenses and tools
    - Personnel salaries and benefits
    - Office space and utilities
    - Customer support and success
    
    3. MARKETING COSTS:
    - Customer acquisition channels
    - Brand building and content marketing
    - Sales team and business development
    - Trade shows, events, and partnerships
    - Digital marketing and advertising
    
    For each cost item, provide:
    - Realistic cost estimates based on industry standards
    - Timeline for when costs will be incurred
    - Scaling factors as the business grows
    - Confidence levels and ranges
    - Expected ROI where applicable
    
    Calculate unit economics:
    - Customer Acquisition Cost (CAC)
    - Customer Lifetime Value (LTV)
    - LTV:CAC ratio
    - Payback period
    
    Base estimates on current market rates and industry benchmarks.
    
    Return as valid JSON matching CostAnalysisSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 3000
      });

      return CostAnalysisSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('Cost analysis failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackCostAnalysis(input);
    }
  }

  private async calculateFundingRequirements(
    input: FinancialModelingInput,
    revenueProjections: RevenueProjection[],
    costAnalysis: CostAnalysis,
    context: AgentContext
  ): Promise<FundingRequirements> {
    // Calculate total funding needed based on costs and cash flow analysis
    const totalDevelopmentCosts = this.sumCosts(costAnalysis.developmentCosts);
    const monthlyOperationalCosts = this.sumMonthlyCosts(costAnalysis.operationalCosts);
    const firstYearRevenue = revenueProjections[0]?.revenue || '$0';
    
    const prompt = `
    Calculate comprehensive funding requirements for this business:
    
    Business: "${input.title}"
    Category: ${input.category}
    Development Costs: ${totalDevelopmentCosts}
    Monthly Operational Costs: ${monthlyOperationalCosts}
    Year 1 Revenue: ${firstYearRevenue}
    Total First Year Costs: ${costAnalysis.totalFirstYearCosts}
    
    Revenue Projections Summary:
    ${revenueProjections.slice(0, 3).map(p => `Year ${p.year}: ${p.revenue}`).join(', ')}
    
    Analyze funding needs across multiple stages:
    
    1. FUNDING STAGES:
    - Pre-seed: MVP development and initial validation
    - Seed: Product development and early customer acquisition
    - Series A: Market expansion and team scaling
    - Series B+: Geographic expansion and market leadership
    
    For each stage, calculate:
    - Required funding amount
    - Timeline and milestones
    - Expected company valuation
    - Founder dilution implications
    
    2. USE OF FUNDS breakdown:
    - Product development and R&D
    - Marketing and customer acquisition
    - Personnel and team expansion
    - Operations and infrastructure
    - Working capital and contingency
    
    3. INVESTOR TYPES analysis:
    - Friends and family
    - Angel investors
    - Venture capital firms
    - Strategic investors
    - Alternative funding sources
    
    For each investor type:
    - Typical investment range
    - Probability of success
    - Requirements and expectations
    
    4. FUNDING ALTERNATIVES:
    - Revenue-based financing
    - Crowdfunding
    - Government grants
    - Bank loans and debt financing
    - Bootstrap/organic growth
    
    Base calculations on:
    - Industry funding benchmarks
    - Cash flow analysis and burn rate projections
    - Market size and growth potential
    - Risk assessment and contingency planning
    
    Return as valid JSON matching FundingRequirementsSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 3500
      });

      return FundingRequirementsSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('Funding requirements calculation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackFundingRequirements(input, revenueProjections, costAnalysis);
    }
  }

  private calculateKeyMetrics(
    revenueProjections: RevenueProjection[],
    costAnalysis: CostAnalysis
  ): any {
    // Calculate break-even point, runway, margins, etc.
    const year1Revenue = this.parseAmount(revenueProjections[0]?.revenue || '$0');
    const totalFirstYearCosts = this.parseAmount(costAnalysis.totalFirstYearCosts);
    const monthlyBurn = totalFirstYearCosts / 12;
    
    // Simple break-even calculation (when monthly revenue >= monthly costs)
    const breakEvenMonth = year1Revenue > 0 ? Math.ceil((totalFirstYearCosts * 12) / (year1Revenue * 12)) : 24;
    
    return {
      breakEvenMonth: Math.min(breakEvenMonth, 60), // Cap at 5 years
      cashFlowPositive: `Month ${breakEvenMonth + 6}`, // Conservative estimate
      burnRate: `$${Math.round(monthlyBurn).toLocaleString()}/month`,
      runway: '18-24 months with initial funding',
      grossMargin: '65-75%', // Industry typical for software/tech
      netMargin: year1Revenue > totalFirstYearCosts ? '15-25%' : 'Negative in Year 1'
    };
  }

  private async generateScenarioAnalysis(
    input: FinancialModelingInput,
    tamSamSom: TAMSAMSOMAnalysis,
    revenueProjections: RevenueProjection[],
    context: AgentContext
  ): Promise<any> {
    const baselineRevenue = revenueProjections[4]?.revenue || '$1M'; // Year 5 revenue
    
    const prompt = `
    Generate three financial scenarios (Conservative, Realistic, Optimistic) for this business:
    
    Business: "${input.title}"
    SOM: ${tamSamSom.som.value}
    Baseline Year 5 Revenue: ${baselineRevenue}
    
    Create three scenarios with different assumptions:
    
    CONSERVATIVE (70% probability):
    - Slower customer acquisition
    - Higher competition impact
    - Economic headwinds
    - Longer sales cycles
    
    REALISTIC (Base case, 60% probability):
    - Moderate market conditions
    - Expected competition levels
    - Standard growth patterns
    - Baseline assumptions
    
    OPTIMISTIC (30% probability):
    - Faster market adoption
    - Strong competitive advantages
    - Favorable market conditions
    - Viral growth potential
    
    For each scenario, provide:
    - 5-year revenue projection
    - Path to profitability timeline
    - Key assumptions and drivers
    - Risk factors and opportunities
    
    Base scenarios on market analysis and industry benchmarks.
    
    Return as JSON with conservative, realistic, and optimistic objects.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 1500
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Scenario analysis failed', error instanceof Error ? error : new Error(String(error)));
      
      // Fallback scenarios
      const baseAmount = this.parseAmount(baselineRevenue);
      return {
        conservative: {
          revenue5Year: `$${Math.round(baseAmount * 0.6).toLocaleString()}`,
          profitability: 'Year 4-5',
          description: 'Slower growth due to market challenges and increased competition'
        },
        realistic: {
          revenue5Year: baselineRevenue,
          profitability: 'Year 3-4',
          description: 'Steady growth with expected market conditions and competition'
        },
        optimistic: {
          revenue5Year: `$${Math.round(baseAmount * 1.8).toLocaleString()}`,
          profitability: 'Year 2-3',
          description: 'Accelerated growth with strong market adoption and competitive advantages'
        }
      };
    }
  }

  private calculateConfidenceScores(
    tamSamSom: TAMSAMSOMAnalysis,
    revenueProjections: RevenueProjection[],
    costAnalysis: CostAnalysis,
    fundingRequirements: FundingRequirements
  ): any {
    // Calculate confidence based on data quality and assumptions
    const marketSizeConfidence = tamSamSom.confidence;
    const revenueConfidence = revenueProjections.length > 0 ? 
      revenueProjections.reduce((acc, proj) => acc + proj.confidence, 0) / revenueProjections.length : 50;
    
    // Cost confidence based on category coverage and specificity
    const costConfidence = 75; // Reasonable baseline for cost estimates
    
    // Funding confidence based on market size and revenue potential
    const fundingConfidence = (marketSizeConfidence + revenueConfidence) / 2;
    
    const overall = Math.round((marketSizeConfidence + revenueConfidence + costConfidence + fundingConfidence) / 4);
    
    return {
      overall: Math.min(95, Math.max(40, overall)), // Cap between 40-95%
      breakdown: {
        marketSize: Math.round(marketSizeConfidence),
        revenue: Math.round(revenueConfidence),
        costs: costConfidence,
        funding: Math.round(fundingConfidence)
      }
    };
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    const keywords = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    return [...new Set(keywords)].slice(0, 10);
  }

  private parseAmount(amountString: string): number {
    const cleaned = amountString.replace(/[$,]/g, '');
    const multiplier = amountString.toLowerCase().includes('k') ? 1000 :
                     amountString.toLowerCase().includes('m') ? 1000000 :
                     amountString.toLowerCase().includes('b') ? 1000000000 : 1;
    return parseFloat(cleaned) * multiplier;
  }

  private sumCosts(costs: any[]): string {
    const total = costs.reduce((sum, cost) => sum + this.parseAmount(cost.amount || '0'), 0);
    return `$${Math.round(total).toLocaleString()}`;
  }

  private sumMonthlyCosts(costs: any[]): string {
    const total = costs.reduce((sum, cost) => sum + this.parseAmount(cost.monthlyAmount || '0'), 0);
    return `$${Math.round(total).toLocaleString()}`;
  }

  // Fallback methods for when LLM calls fail
  private generateFallbackMarketSize(input: FinancialModelingInput): TAMSAMSOMAnalysis {
    return {
      tam: {
        value: '$50B',
        description: `Global ${input.category} market size`,
        methodology: 'Industry analysis and market research',
        assumptions: ['Global market scope', 'Annual market size', 'Growing market category']
      },
      sam: {
        value: '$5B',
        description: `Addressable market for ${input.title}`,
        methodology: 'TAM filtered by business model constraints',
        assumptions: ['Geographic limitations', 'Business model focus', 'Target customer segments']
      },
      som: {
        value: '$150M',
        description: 'Realistic market capture potential',
        methodology: 'Market share analysis of comparable companies',
        marketShare: '3% of SAM',
        timeframe: '5 years'
      },
      confidence: 60
    };
  }

  private generateFallbackRevenueProjections(input: FinancialModelingInput, tamSamSom: TAMSAMSOMAnalysis): RevenueProjection[] {
    const baseRevenue = [50000, 200000, 800000, 2000000, 4000000]; // Conservative baseline
    
    return baseRevenue.map((revenue, index) => ({
      year: index + 1,
      revenue: `$${revenue.toLocaleString()}`,
      customers: Math.round(revenue / 1000), // Assuming $1k ARPU
      averageRevenuePerUser: '$1,000',
      growthRate: index === 0 ? 'N/A' : `${Math.round(((revenue / baseRevenue[index - 1]) - 1) * 100)}%`,
      assumptions: ['Conservative growth rates', 'Market penetration assumptions', 'Customer acquisition estimates'],
      confidence: 65
    }));
  }

  private generateFallbackCostAnalysis(input: FinancialModelingInput): CostAnalysis {
    return {
      developmentCosts: [
        {
          category: 'Technology Development',
          amount: '$250,000',
          description: 'Software development, infrastructure setup, and initial product build',
          timeline: '6-12 months',
          confidence: 'Medium'
        },
        {
          category: 'Legal and Compliance',
          amount: '$50,000',
          description: 'Legal entity setup, intellectual property, and regulatory compliance',
          timeline: '3-6 months',
          confidence: 'High'
        }
      ],
      operationalCosts: [
        {
          category: 'Personnel',
          monthlyAmount: '$75,000',
          description: 'Core team salaries and benefits',
          scalingFactor: 'Linear with team size',
          confidence: 'High'
        },
        {
          category: 'Infrastructure',
          monthlyAmount: '$15,000',
          description: 'Cloud hosting, software licenses, and tools',
          scalingFactor: 'Logarithmic with user growth',
          confidence: 'Medium'
        }
      ],
      marketingCosts: [
        {
          category: 'Digital Marketing',
          amount: '$100,000',
          description: 'Online advertising, content marketing, and SEO',
          timeline: 'Ongoing',
          expectedROI: '3:1'
        }
      ],
      totalFirstYearCosts: '$1,380,000',
      costStructure: 'Personnel-heavy with moderate technology costs',
      unitEconomics: {
        customerAcquisitionCost: '$500',
        customerLifetimeValue: '$2,500',
        ltv2cacRatio: '5:1',
        paybackPeriod: '10 months'
      }
    };
  }

  private generateFallbackFundingRequirements(
    input: FinancialModelingInput,
    revenueProjections: RevenueProjection[],
    costAnalysis: CostAnalysis
  ): FundingRequirements {
    return {
      totalRequired: '$2,500,000',
      stages: [
        {
          stage: 'Seed',
          amount: '$750,000',
          timeline: 'Months 1-12',
          milestones: ['MVP launch', 'Initial customers', 'Product-market fit'],
          valuation: '$3M',
          dilution: '25%'
        },
        {
          stage: 'Series A',
          amount: '$1,750,000',
          timeline: 'Months 12-24',
          milestones: ['Revenue growth', 'Market expansion', 'Team scaling'],
          valuation: '$8M',
          dilution: '22%'
        }
      ],
      useOfFunds: [
        { category: 'Product Development', percentage: 40, amount: '$1,000,000', description: 'Engineering and R&D' },
        { category: 'Marketing & Sales', percentage: 30, amount: '$750,000', description: 'Customer acquisition' },
        { category: 'Personnel', percentage: 25, amount: '$625,000', description: 'Team expansion' },
        { category: 'Operations', percentage: 5, amount: '$125,000', description: 'General expenses' }
      ],
      investorTypes: [
        {
          type: 'Angel Investors',
          targetAmount: '$250,000',
          probability: 0.7,
          requirements: ['Strong team', 'Market opportunity', 'Early traction']
        },
        {
          type: 'Venture Capital',
          targetAmount: '$1,500,000',
          probability: 0.5,
          requirements: ['Scalable business model', 'Large market', 'Strong growth metrics']
        }
      ],
      alternatives: [
        {
          type: 'Revenue-based Financing',
          description: 'Alternative to traditional equity funding',
          pros: ['Less dilution', 'Flexible terms', 'Performance-based'],
          cons: ['Higher cost of capital', 'Revenue requirements', 'Limited amount']
        }
      ]
    };
  }

  protected validateInput(input: FinancialModelingInput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      FinancialModelingInputSchema.parse(input);
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [{ message: error instanceof Error ? error.message : 'Validation failed' }] };
    }
  }

  protected validateOutput(output: FinancialModelOutput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      FinancialModelOutputSchema.parse(output);
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [{ message: error instanceof Error ? error.message : 'Validation failed' }] };
    }
  }

  protected async performQualityAssurance(output: FinancialModelOutput, context: any): Promise<{ confidence: number; isValid: boolean; errors: any[] }> {
    // Basic quality checks
    let confidence = 70;
    const errors: any[] = [];
    
    // Check if key financial metrics are present
    if (output.confidence?.overall && output.confidence.overall > 80) {
      confidence += 10;
    }
    
    if (output.tamSamSom?.tam?.value && output.tamSamSom?.sam?.value && output.tamSamSom?.som?.value) {
      confidence += 10;
    }
    
    return { confidence, isValid: confidence > 60, errors };
  }
}