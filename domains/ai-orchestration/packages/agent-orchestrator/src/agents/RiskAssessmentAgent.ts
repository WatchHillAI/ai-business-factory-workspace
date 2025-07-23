import { BaseAgent } from '../core/BaseAgent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';
import { AgentContext, AgentResult } from '../types/agent';
import { Logger } from '../utils/Logger';
import { z } from 'zod';

// Input schema for Risk Assessment Agent
const RiskAssessmentInputSchema = z.object({
  ideaText: z.string().min(10),
  title: z.string(),
  category: z.string(),
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
  financialProjections: z.object({
    revenue5Year: z.string().optional(),
    totalFunding: z.string().optional(),
    breakEvenMonth: z.number().optional()
  }).optional(),
  teamProfile: z.object({
    founderExperience: z.string().optional(),
    teamSize: z.number().optional(),
    missingSkills: z.array(z.string()).optional()
  }).optional(),
  userContext: z.object({
    budget: z.string().optional(),
    timeline: z.string().optional(),
    experience: z.string().optional(),
    industry: z.string().optional()
  }).optional()
});

export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

// Risk Category Schema
const RiskCategorySchema = z.object({
  category: z.string(),
  description: z.string(),
  impact: z.enum(['Low', 'Medium', 'High', 'Critical']),
  probability: z.enum(['Low', 'Medium', 'High', 'Very High']),
  riskScore: z.number().min(1).max(100),
  timeframe: z.string(),
  indicators: z.array(z.string()),
  consequences: z.array(z.string()),
  confidence: z.number().min(0).max(100)
});

export type RiskCategory = z.infer<typeof RiskCategorySchema>;

// Mitigation Strategy Schema
const MitigationStrategySchema = z.object({
  riskCategory: z.string(),
  strategy: z.string(),
  description: z.string(),
  implementation: z.object({
    timeframe: z.string(),
    cost: z.string(),
    resources: z.array(z.string()),
    steps: z.array(z.string())
  }),
  effectiveness: z.object({
    riskReduction: z.string(),
    successProbability: z.number().min(0).max(100),
    costBenefit: z.string()
  }),
  dependencies: z.array(z.string()),
  kpis: z.array(z.string())
});

export type MitigationStrategy = z.infer<typeof MitigationStrategySchema>;

// Risk Scenario Schema
const RiskScenarioSchema = z.object({
  scenario: z.string(),
  description: z.string(),
  probability: z.number().min(0).max(100),
  combinedRisks: z.array(z.string()),
  impact: z.object({
    financial: z.string(),
    operational: z.string(),
    strategic: z.string(),
    timeline: z.string()
  }),
  warningSignals: z.array(z.string()),
  contingencyPlan: z.string()
});

export type RiskScenario = z.infer<typeof RiskScenarioSchema>;

// Risk Assessment Output Schema
const RiskAssessmentOutputSchema = z.object({
  overallRiskScore: z.number().min(1).max(100),
  riskProfile: z.enum(['Low', 'Moderate', 'High', 'Extreme']),
  majorRiskCategories: z.array(RiskCategorySchema),
  mitigationStrategies: z.array(MitigationStrategySchema),
  riskScenarios: z.array(RiskScenarioSchema),
  monitoringFramework: z.object({
    keyRiskIndicators: z.array(z.object({
      indicator: z.string(),
      measurement: z.string(),
      threshold: z.string(),
      frequency: z.string(),
      owner: z.string()
    })),
    reviewSchedule: z.object({
      weekly: z.array(z.string()),
      monthly: z.array(z.string()),
      quarterly: z.array(z.string())
    }),
    escalationMatrix: z.array(z.object({
      riskLevel: z.string(),
      authority: z.string(),
      timeframe: z.string(),
      actions: z.array(z.string())
    }))
  }),
  recommendations: z.object({
    immediate: z.array(z.string()),
    shortTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
    riskTolerance: z.string()
  }),
  confidence: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      marketRisks: z.number().min(0).max(100),
      operationalRisks: z.number().min(0).max(100),
      financialRisks: z.number().min(0).max(100),
      strategicRisks: z.number().min(0).max(100)
    })
  })
});

export type RiskAssessmentOutput = z.infer<typeof RiskAssessmentOutputSchema>;

/**
 * Risk Assessment Agent
 * 
 * Provides comprehensive risk analysis including:
 * - Multi-dimensional risk categorization and scoring
 * - Mitigation strategies with implementation plans
 * - Scenario planning for combined risk events
 * - Monitoring framework with KPIs and escalation
 * - Actionable recommendations by timeframe
 */
export class RiskAssessmentAgent extends BaseAgent<RiskAssessmentInput, RiskAssessmentOutput> {
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

  protected async processRequest(
    input: RiskAssessmentInput,
    context: AgentContext
  ): Promise<RiskAssessmentOutput> {
    this.logger.info('Starting risk assessment analysis', { 
      ideaTitle: input.title,
      category: input.category,
      context: context.analysisDepth 
    });

    // Step 1: Identify and categorize major risks
    const majorRiskCategories = await this.identifyMajorRisks(input, context);
    
    // Step 2: Develop mitigation strategies
    const mitigationStrategies = await this.developMitigationStrategies(input, majorRiskCategories, context);
    
    // Step 3: Create risk scenarios
    const riskScenarios = await this.generateRiskScenarios(input, majorRiskCategories, context);
    
    // Step 4: Build monitoring framework
    const monitoringFramework = await this.createMonitoringFramework(majorRiskCategories, context);
    
    // Step 5: Generate recommendations
    const recommendations = await this.generateRecommendations(input, majorRiskCategories, mitigationStrategies, context);
    
    // Step 6: Calculate overall risk scores
    const { overallRiskScore, riskProfile } = this.calculateOverallRisk(majorRiskCategories);
    
    // Step 7: Assess confidence levels
    const confidence = this.calculateConfidenceScores(majorRiskCategories, mitigationStrategies, riskScenarios);

    const result: RiskAssessmentOutput = {
      overallRiskScore,
      riskProfile: riskProfile as 'Low' | 'Moderate' | 'High' | 'Extreme',
      majorRiskCategories,
      mitigationStrategies,
      riskScenarios,
      monitoringFramework,
      recommendations,
      confidence
    };

    this.logger.info('Risk assessment analysis completed', {
      overallRiskScore,
      riskProfile,
      riskCategoriesCount: majorRiskCategories.length,
      mitigationStrategiesCount: mitigationStrategies.length
    });

    return result;
  }

  private async identifyMajorRisks(
    input: RiskAssessmentInput,
    context: AgentContext
  ): Promise<RiskCategory[]> {
    // Gather market intelligence for risk assessment
    let marketIntelligence = '';
    if (this.marketDataProvider) {
      try {
        const riskData = await this.marketDataProvider.fetchData({
          type: 'risk_intelligence',
          params: { 
            industry: input.category,
            keywords: this.extractKeywords(input.ideaText)
          }
        });
        marketIntelligence = `Risk intelligence: ${JSON.stringify(riskData.data)}`;
      } catch (error) {
        this.logger.warn('Risk intelligence collection failed', error instanceof Error ? error.message : String(error));
      }
    }

    const prompt = `
    Identify and categorize major risks for this business venture:
    
    Business: "${input.title}"
    Description: "${input.ideaText}"
    Category: ${input.category}
    Target Market: ${input.targetMarket || 'Not specified'}
    Business Model: ${input.businessModel || 'Not specified'}
    
    Financial Context:
    ${input.financialProjections ? `
    - Revenue (5-year): ${input.financialProjections.revenue5Year || 'Not specified'}
    - Total Funding Needed: ${input.financialProjections.totalFunding || 'Not specified'}
    - Break-even Timeline: ${input.financialProjections.breakEvenMonth ? `Month ${input.financialProjections.breakEvenMonth}` : 'Not specified'}
    ` : 'Financial projections not available'}
    
    Team Context:
    ${input.teamProfile ? `
    - Founder Experience: ${input.teamProfile.founderExperience || 'Not specified'}
    - Current Team Size: ${input.teamProfile.teamSize || 'Not specified'}
    - Missing Skills: ${input.teamProfile.missingSkills?.join(', ') || 'Not specified'}
    ` : 'Team profile not available'}
    
    User Context: ${JSON.stringify(input.userContext || {})}
    ${marketIntelligence}
    
    Analyze risks across these major categories:
    
    1. MARKET RISKS:
    - Market demand and adoption
    - Competition and market share
    - Economic conditions and timing
    - Customer behavior changes
    - Market size and saturation
    
    2. OPERATIONAL RISKS:
    - Technology and infrastructure
    - Supply chain and dependencies
    - Team and human capital
    - Process and operational efficiency
    - Quality and customer satisfaction
    
    3. FINANCIAL RISKS:
    - Cash flow and runway
    - Revenue model validation
    - Cost structure and scalability
    - Funding availability and terms
    - Economic and currency fluctuations
    
    4. STRATEGIC RISKS:
    - Product-market fit
    - Business model sustainability
    - Partnership and alliance risks
    - Regulatory and compliance
    - Competitive positioning
    
    5. TECHNOLOGY RISKS:
    - Technical feasibility
    - Security and data privacy
    - Scalability and performance
    - Platform and vendor dependencies
    - Innovation and obsolescence
    
    For each identified risk, provide:
    - Clear risk description
    - Impact level (Low/Medium/High/Critical)
    - Probability assessment (Low/Medium/High/Very High)
    - Risk score (1-100 based on impact × probability)
    - Timeline when risk might materialize
    - Early warning indicators
    - Potential consequences if realized
    - Confidence in assessment
    
    Focus on the most significant risks (top 8-12) that could materially impact success.
    Base assessments on industry data, startup failure patterns, and business model analysis.
    
    Return as JSON array matching RiskCategorySchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 4000
      });

      const risks = JSON.parse(response);
      return z.array(RiskCategorySchema).parse(risks);
    } catch (error) {
      this.logger.error('Risk identification failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackRisks(input);
    }
  }

  private async developMitigationStrategies(
    input: RiskAssessmentInput,
    risks: RiskCategory[],
    context: AgentContext
  ): Promise<MitigationStrategy[]> {
    // Focus on top risks for mitigation strategies
    const topRisks = risks
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);

    const prompt = `
    Develop comprehensive mitigation strategies for these identified risks:
    
    Business: "${input.title}"
    Category: ${input.category}
    User Experience: ${input.userContext?.experience || 'Not specified'}
    Budget Context: ${input.userContext?.budget || 'Not specified'}
    
    Top Risks to Address:
    ${topRisks.map(risk => `
    - ${risk.category} (Score: ${risk.riskScore}/100)
      Impact: ${risk.impact}, Probability: ${risk.probability}
      Description: ${risk.description}
    `).join('')}
    
    For each risk, develop detailed mitigation strategies that include:
    
    STRATEGY FRAMEWORK:
    1. Prevention strategies (reduce probability)
    2. Impact reduction strategies (minimize consequences)
    3. Contingency planning (response if risk occurs)
    4. Risk transfer strategies (insurance, partnerships)
    5. Monitoring and early warning systems
    
    IMPLEMENTATION DETAILS:
    - Specific timeframe for implementation
    - Estimated cost and resource requirements
    - Required team members or external partners
    - Step-by-step implementation plan
    - Success metrics and milestones
    
    EFFECTIVENESS ANALYSIS:
    - Expected risk reduction percentage
    - Probability of successful mitigation
    - Cost-benefit analysis
    - Dependencies and prerequisites
    - Key performance indicators
    
    STRATEGY TYPES TO CONSIDER:
    - Lean startup methodologies (MVP, pivot strategies)
    - Financial risk management (cash flow, diversification)
    - Team building and skill development
    - Market validation and customer development
    - Technology risk mitigation (testing, backup plans)
    - Legal and compliance frameworks
    - Partnership and supplier diversification
    
    Prioritize strategies that:
    - Address multiple risks simultaneously
    - Require minimal upfront investment
    - Provide early warning capabilities
    - Can be implemented quickly
    - Have proven success in similar businesses
    
    Return as JSON array matching MitigationStrategySchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 4500
      });

      const strategies = JSON.parse(response);
      return z.array(MitigationStrategySchema).parse(strategies);
    } catch (error) {
      this.logger.error('Mitigation strategy development failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackMitigationStrategies(risks);
    }
  }

  private async generateRiskScenarios(
    input: RiskAssessmentInput,
    risks: RiskCategory[],
    context: AgentContext
  ): Promise<RiskScenario[]> {
    const highRisks = risks.filter(risk => 
      risk.riskScore >= 60 || risk.impact === 'High' || risk.impact === 'Critical'
    );

    const prompt = `
    Create realistic risk scenarios for this business venture:
    
    Business: "${input.title}"
    Description: "${input.ideaText}"
    Category: ${input.category}
    
    High-Priority Risks:
    ${highRisks.map(risk => `
    - ${risk.category}: ${risk.description} (Score: ${risk.riskScore})
    `).join('')}
    
    Create 4-6 realistic scenarios that combine multiple risks:
    
    SCENARIO TYPES:
    1. Best Case: Minor risks only, effective mitigation
    2. Most Likely: Moderate risks materialize, mixed mitigation success
    3. Challenging: Multiple significant risks, some mitigation failures
    4. Worst Case: Critical risks combine, limited mitigation effectiveness
    5. Black Swan: Low-probability, high-impact external events
    6. Market Shift: Industry or technology disruption scenarios
    
    For each scenario, analyze:
    
    SCENARIO COMPOSITION:
    - Which specific risks combine and interact
    - Probability of the combined scenario occurring
    - Timeline over which risks would materialize
    - Cascading effects between different risks
    
    IMPACT ASSESSMENT:
    - Financial impact (revenue, costs, funding needs)
    - Operational impact (team, processes, capabilities)
    - Strategic impact (market position, partnerships)
    - Timeline impact (delays, accelerated needs)
    
    EARLY WARNING SYSTEM:
    - Observable signals that indicate scenario developing
    - Leading indicators for each risk component
    - Threshold metrics for escalation
    - Monitoring frequency and responsibility
    
    CONTINGENCY PLANNING:
    - Immediate response actions
    - Resource reallocation requirements
    - Communication strategy
    - Recovery timeline and milestones
    
    Base scenarios on:
    - Industry failure patterns and case studies
    - Economic cycle impacts on startups
    - Technology adoption and market timing
    - Competitive dynamics and disruption patterns
    - Regulatory and policy change impacts
    
    Return as JSON array matching RiskScenarioSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 3500
      });

      const scenarios = JSON.parse(response);
      return z.array(RiskScenarioSchema).parse(scenarios);
    } catch (error) {
      this.logger.error('Risk scenario generation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackScenarios(risks);
    }
  }

  private async createMonitoringFramework(
    risks: RiskCategory[],
    context: AgentContext
  ): Promise<any> {
    const prompt = `
    Create a comprehensive risk monitoring framework for these identified risks:
    
    Risk Categories:
    ${risks.map(risk => `
    - ${risk.category} (Score: ${risk.riskScore})
      Indicators: ${risk.indicators.join(', ')}
    `).join('')}
    
    Design a monitoring system with:
    
    KEY RISK INDICATORS (KRIs):
    - Specific, measurable metrics for each major risk
    - Clear threshold levels (green/yellow/red zones)
    - Data collection methods and sources
    - Measurement frequency and timing
    - Responsible owner for each indicator
    
    REVIEW SCHEDULE:
    - Weekly monitoring: Operational and immediate risks
    - Monthly reviews: Financial and market risks
    - Quarterly assessments: Strategic and long-term risks
    - Annual deep-dive: Complete risk profile reassessment
    
    ESCALATION MATRIX:
    - Risk severity levels and triggers
    - Decision-making authority at each level
    - Response timeframes for different risk levels
    - Communication protocols and stakeholders
    - Action requirements for each escalation level
    
    MONITORING CATEGORIES:
    
    Financial Health Indicators:
    - Cash burn rate and runway remaining
    - Revenue growth and customer acquisition
    - Unit economics and profitability trends
    
    Market Position Indicators:
    - Customer satisfaction and retention rates
    - Market share and competitive positioning
    - Industry trends and disruption signals
    
    Operational Efficiency Indicators:
    - Team productivity and satisfaction
    - Technology performance and reliability
    - Process efficiency and quality metrics
    
    Strategic Progress Indicators:
    - Product-market fit progression
    - Partnership and alliance health
    - Regulatory compliance status
    
    Focus on:
    - Leading indicators (predict problems before they occur)
    - Actionable metrics (can be influenced by management)
    - Cost-effective monitoring (automated where possible)
    - Clear threshold definitions and escalation triggers
    
    Return as JSON object with keyRiskIndicators, reviewSchedule, and escalationMatrix arrays.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 2500
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Monitoring framework creation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackMonitoringFramework(risks);
    }
  }

  private async generateRecommendations(
    input: RiskAssessmentInput,
    risks: RiskCategory[],
    mitigationStrategies: MitigationStrategy[],
    context: AgentContext
  ): Promise<any> {
    const overallRiskScore = this.calculateOverallRisk(risks).overallRiskScore;

    const prompt = `
    Generate actionable risk management recommendations for this business:
    
    Business: "${input.title}"
    Overall Risk Score: ${overallRiskScore}/100
    Top Risk Categories: ${risks.slice(0, 5).map(r => r.category).join(', ')}
    
    User Context:
    - Experience: ${input.userContext?.experience || 'Not specified'}
    - Budget: ${input.userContext?.budget || 'Not specified'}
    - Timeline: ${input.userContext?.timeline || 'Not specified'}
    
    Available Mitigation Strategies: ${mitigationStrategies.length} strategies developed
    
    Provide specific, actionable recommendations organized by timeframe:
    
    IMMEDIATE ACTIONS (0-30 days):
    - Critical risks requiring immediate attention
    - Low-cost, high-impact mitigation steps
    - Foundation-building activities
    - Quick wins and early validation opportunities
    
    SHORT-TERM PRIORITIES (1-6 months):
    - Systematic implementation of key mitigation strategies
    - Team building and capability development
    - Market validation and customer development
    - Financial risk management setup
    
    LONG-TERM STRATEGIC INITIATIVES (6+ months):
    - Comprehensive risk management system
    - Advanced monitoring and reporting capabilities
    - Strategic partnerships and diversification
    - Scalability and growth risk preparation
    
    RISK TOLERANCE GUIDANCE:
    Based on the overall risk profile and user context, recommend:
    - Appropriate risk tolerance level for this venture
    - Key factors that should influence risk appetite
    - Trade-offs between risk and growth potential
    - Decision criteria for when to pivot or persevere
    
    Consider the founder's experience level and available resources when prioritizing recommendations.
    Focus on practical, implementable actions rather than theoretical advice.
    
    Return as JSON with immediate, shortTerm, longTerm arrays and riskTolerance string.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 2000
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Recommendations generation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackRecommendations(overallRiskScore);
    }
  }

  private calculateOverallRisk(risks: RiskCategory[]): { overallRiskScore: number; riskProfile: string } {
    if (risks.length === 0) {
      return { overallRiskScore: 50, riskProfile: 'Moderate' };
    }

    // Weight risks by their individual scores and categories
    const totalWeightedScore = risks.reduce((sum, risk) => {
      let weight = 1.0;
      
      // Weight by impact level
      if (risk.impact === 'Critical') weight *= 1.5;
      else if (risk.impact === 'High') weight *= 1.3;
      else if (risk.impact === 'Medium') weight *= 1.0;
      else weight *= 0.7;

      // Weight by probability
      if (risk.probability === 'Very High') weight *= 1.4;
      else if (risk.probability === 'High') weight *= 1.2;
      else if (risk.probability === 'Medium') weight *= 1.0;
      else weight *= 0.8;

      return sum + (risk.riskScore * weight);
    }, 0);

    const totalWeight = risks.reduce((sum, risk) => {
      let weight = 1.0;
      if (risk.impact === 'Critical') weight *= 1.5;
      else if (risk.impact === 'High') weight *= 1.3;
      else if (risk.impact === 'Medium') weight *= 1.0;
      else weight *= 0.7;

      if (risk.probability === 'Very High') weight *= 1.4;
      else if (risk.probability === 'High') weight *= 1.2;
      else if (risk.probability === 'Medium') weight *= 1.0;
      else weight *= 0.8;

      return sum + weight;
    }, 0);

    const overallRiskScore = Math.round(totalWeightedScore / totalWeight);

    let riskProfile: 'Low' | 'Moderate' | 'High' | 'Extreme';
    if (overallRiskScore >= 80) riskProfile = 'Extreme';
    else if (overallRiskScore >= 65) riskProfile = 'High';
    else if (overallRiskScore >= 40) riskProfile = 'Moderate';
    else riskProfile = 'Low';

    return { overallRiskScore: Math.min(95, Math.max(10, overallRiskScore)), riskProfile };
  }

  private calculateConfidenceScores(
    risks: RiskCategory[],
    mitigationStrategies: MitigationStrategy[],
    scenarios: RiskScenario[]
  ): any {
    // Calculate confidence based on data quality and analysis depth
    const riskConfidence = risks.length > 0 ? 
      risks.reduce((acc, risk) => acc + risk.confidence, 0) / risks.length : 50;
    
    const marketRisks = risks.filter(r => r.category.toLowerCase().includes('market')).length;
    const operationalRisks = risks.filter(r => r.category.toLowerCase().includes('operational')).length;
    const financialRisks = risks.filter(r => r.category.toLowerCase().includes('financial')).length;
    const strategicRisks = risks.filter(r => r.category.toLowerCase().includes('strategic')).length;

    const marketConfidence = marketRisks > 0 ? 85 : 70;
    const operationalConfidence = operationalRisks > 0 ? 80 : 65;
    const financialConfidence = financialRisks > 0 ? 75 : 60;
    const strategicConfidence = strategicRisks > 0 ? 70 : 55;

    const overall = Math.round((marketConfidence + operationalConfidence + financialConfidence + strategicConfidence) / 4);

    return {
      overall: Math.min(95, Math.max(40, overall)),
      breakdown: {
        marketRisks: marketConfidence,
        operationalRisks: operationalConfidence,
        financialRisks: financialConfidence,
        strategicRisks: strategicConfidence
      }
    };
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    const keywords = text.toLowerCase().match(/\b\w{3,}\\b/g) || [];
    return [...new Set(keywords)].slice(0, 10);
  }

  // Fallback methods for when LLM calls fail
  private generateFallbackRisks(input: RiskAssessmentInput): RiskCategory[] {
    return [
      {
        category: 'Market Risk',
        description: 'Customer demand may be lower than anticipated',
        impact: 'High',
        probability: 'Medium',
        riskScore: 70,
        timeframe: '6-12 months',
        indicators: ['Customer acquisition rates', 'Market research feedback', 'Competitor performance'],
        consequences: ['Slower growth', 'Reduced revenue', 'Increased marketing costs'],
        confidence: 65
      },
      {
        category: 'Financial Risk',
        description: 'Funding may not be available when needed',
        impact: 'Critical',
        probability: 'Medium',
        riskScore: 80,
        timeframe: '12-18 months',
        indicators: ['Cash burn rate', 'Investor interest', 'Market conditions'],
        consequences: ['Business closure', 'Forced pivots', 'Team reduction'],
        confidence: 70
      },
      {
        category: 'Operational Risk',
        description: 'Key team members may leave during critical periods',
        impact: 'High',
        probability: 'Medium',
        riskScore: 65,
        timeframe: '3-12 months',
        indicators: ['Employee satisfaction', 'Workload levels', 'Compensation competitiveness'],
        consequences: ['Project delays', 'Knowledge loss', 'Increased hiring costs'],
        confidence: 75
      },
      {
        category: 'Technology Risk',
        description: 'Technical implementation may be more complex than anticipated',
        impact: 'Medium',
        probability: 'High',
        riskScore: 60,
        timeframe: '1-6 months',
        indicators: ['Development velocity', 'Bug rates', 'Technical debt accumulation'],
        consequences: ['Delayed launch', 'Increased development costs', 'Quality issues'],
        confidence: 80
      }
    ];
  }

  private generateFallbackMitigationStrategies(risks: RiskCategory[]): MitigationStrategy[] {
    return risks.slice(0, 4).map(risk => ({
      riskCategory: risk.category,
      strategy: `Comprehensive ${risk.category.toLowerCase()} mitigation`,
      description: `Implement systematic approach to reduce ${risk.category.toLowerCase()} exposure`,
      implementation: {
        timeframe: '1-3 months',
        cost: '$5,000 - $25,000',
        resources: ['Management time', 'External consultants', 'Team training'],
        steps: [
          'Assess current exposure level',
          'Design mitigation framework',
          'Implement monitoring systems',
          'Regular review and adjustment'
        ]
      },
      effectiveness: {
        riskReduction: '40-60%',
        successProbability: 75,
        costBenefit: '3:1 ROI expected'
      },
      dependencies: ['Team availability', 'Budget allocation', 'Management commitment'],
      kpis: ['Risk score reduction', 'Incident frequency', 'Response time improvement']
    }));
  }

  private generateFallbackScenarios(risks: RiskCategory[]): RiskScenario[] {
    return [
      {
        scenario: 'Market Adoption Delay',
        description: 'Customer adoption is slower than projected due to market education needs',
        probability: 40,
        combinedRisks: ['Market Risk', 'Financial Risk'],
        impact: {
          financial: '30% revenue shortfall in Year 1',
          operational: 'Extended runway needed',
          strategic: 'Pivot considerations required',
          timeline: '6-month delay in growth milestones'
        },
        warningSignals: ['Low customer engagement', 'High customer acquisition costs', 'Competitor struggles'],
        contingencyPlan: 'Intensify customer education, adjust pricing model, seek additional funding'
      },
      {
        scenario: 'Technical Complexity Underestimation',
        description: 'Development takes longer and costs more than anticipated',
        probability: 30,
        combinedRisks: ['Technology Risk', 'Financial Risk', 'Operational Risk'],
        impact: {
          financial: '50% budget overrun',
          operational: 'Team stress and potential turnover',
          strategic: 'Delayed market entry',
          timeline: '3-6 month launch delay'
        },
        warningSignals: ['Missed development milestones', 'Increasing bug reports', 'Team overtime'],
        contingencyPlan: 'Scope reduction, additional technical hiring, phased launch approach'
      }
    ];
  }

  private generateFallbackMonitoringFramework(risks: RiskCategory[]): any {
    return {
      keyRiskIndicators: [
        {
          indicator: 'Monthly Cash Burn Rate',
          measurement: 'Dollars spent per month',
          threshold: '10% above budget = Yellow, 20% = Red',
          frequency: 'Weekly',
          owner: 'CFO/Finance Lead'
        },
        {
          indicator: 'Customer Acquisition Rate',
          measurement: 'New customers per month',
          threshold: '20% below target = Yellow, 40% = Red',
          frequency: 'Weekly',
          owner: 'Head of Marketing'
        },
        {
          indicator: 'Team Satisfaction Score',
          measurement: 'Employee survey (1-10 scale)',
          threshold: 'Below 7 = Yellow, Below 6 = Red',
          frequency: 'Monthly',
          owner: 'Head of People'
        }
      ],
      reviewSchedule: {
        weekly: ['Cash flow', 'Customer metrics', 'Development progress'],
        monthly: ['Team satisfaction', 'Market position', 'Competitor analysis'],
        quarterly: ['Strategic review', 'Risk assessment update', 'Mitigation effectiveness']
      },
      escalationMatrix: [
        {
          riskLevel: 'Yellow (Moderate)',
          authority: 'Department Head',
          timeframe: '48 hours',
          actions: ['Investigate cause', 'Implement quick fixes', 'Monitor closely']
        },
        {
          riskLevel: 'Red (High)',
          authority: 'CEO/Founder',
          timeframe: '24 hours',
          actions: ['Emergency team meeting', 'Activate contingency plan', 'Stakeholder communication']
        }
      ]
    };
  }

  private generateFallbackRecommendations(overallRiskScore: number): any {
    return {
      immediate: [
        'Establish weekly cash flow monitoring and 13-week rolling forecasts',
        'Implement basic customer feedback collection system',
        'Create emergency contact list and communication protocols',
        'Document all critical processes and knowledge'
      ],
      shortTerm: [
        'Develop comprehensive risk monitoring dashboard',
        'Build strategic partnerships to reduce dependency risks',
        'Establish multiple funding pipeline options',
        'Implement automated backup and security protocols'
      ],
      longTerm: [
        'Create diversified revenue stream strategy',
        'Build organizational resilience and adaptability capabilities',
        'Establish industry advisory board for strategic guidance',
        'Develop succession planning for key roles'
      ],
      riskTolerance: overallRiskScore > 70 
        ? 'Conservative approach recommended due to high risk profile - focus on validation and incremental growth'
        : 'Moderate risk tolerance appropriate - balance growth opportunities with prudent risk management'
    };
  }

  protected validateInput(input: RiskAssessmentInput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      RiskAssessmentInputSchema.parse(input);
      return { isValid: true, errors: [], confidence: 100, suggestions: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            severity: 'error' as const
          })),
          confidence: 0,
          suggestions: ['Check input format and required fields']
        };
      }
      return {
        isValid: false,
        errors: [{ message: 'Input validation failed', field: 'input', severity: 'error' }],
        confidence: 0,
        suggestions: ['Check input data structure']
      };
    }
  }

  protected validateOutput(output: RiskAssessmentOutput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      RiskAssessmentOutputSchema.parse(output);
      return { isValid: true, errors: [], confidence: output.confidence.overall, suggestions: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: 'Output validation failed', field: 'output', severity: 'error' }],
        confidence: 0,
        suggestions: ['Check output data structure']
      };
    }
  }

  protected async performQualityAssurance(output: RiskAssessmentOutput, context: any): Promise<{ confidence: number; isValid: boolean; errors: any[] }> {
    const errors: any[] = [];
    let confidence = output.confidence.overall;

    // Basic validation checks
    if (output.majorRiskCategories.length < 3) {
      errors.push({ message: 'Insufficient risk categories identified', severity: 'warning' });
      confidence -= 10;
    }

    if (output.mitigationStrategies.length === 0) {
      errors.push({ message: 'No mitigation strategies provided', severity: 'error' });
      confidence -= 20;
    }

    const isValid = errors.filter(e => e.severity === 'error').length === 0;
    return { confidence: Math.max(0, confidence), isValid, errors };
  }
}