import { BaseAgent } from '../core/BaseAgent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';
import { AgentContext, AgentResult } from '../types/agent';
import { Logger } from '../utils/Logger';
import { z } from 'zod';

// Input schema for Founder Fit Agent
const FounderFitInputSchema = z.object({
  ideaText: z.string().min(10),
  title: z.string(),
  category: z.string(),
  founderBackground: z.object({
    experience: z.string().optional(),
    industry: z.string().optional(),
    skills: z.array(z.string()).optional(),
    previousRoles: z.array(z.string()).optional(),
    education: z.string().optional(),
    network: z.string().optional()
  }).optional(),
  userContext: z.object({
    budget: z.string().optional(),
    timeline: z.string().optional(),
    commitment: z.string().optional(), // full-time, part-time, side-project
    riskTolerance: z.string().optional() // high, medium, low
  }).optional()
});

export type FounderFitInput = z.infer<typeof FounderFitInputSchema>;

// Skill Analysis Schema
const SkillSchema = z.object({
  name: z.string(),
  category: z.enum(['technical', 'business', 'industry', 'leadership', 'functional']),
  importance: z.enum(['critical', 'important', 'nice-to-have']),
  currentLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced', 'expert']).optional(),
  requiredLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  gap: z.enum(['none', 'small', 'moderate', 'large', 'critical']),
  developmentTime: z.string(),
  developmentCost: z.string(),
  alternatives: z.array(z.string())
});

export type Skill = z.infer<typeof SkillSchema>;

// Skills Analysis Schema
const SkillsAnalysisSchema = z.object({
  requiredSkills: z.array(SkillSchema),
  skillsGapSummary: z.object({
    totalSkills: z.number(),
    criticalGaps: z.number(),
    moderateGaps: z.number(),
    skillsCovered: z.number(),
    overallReadiness: z.enum(['low', 'medium', 'high'])
  }),
  developmentPlan: z.object({
    priority1: z.array(z.string()),
    priority2: z.array(z.string()),
    priority3: z.array(z.string()),
    timeline: z.string(),
    totalCost: z.string(),
    recommendations: z.array(z.string())
  }),
  strengthsAndWeaknesses: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    uniqueAdvantages: z.array(z.string()),
    riskAreas: z.array(z.string())
  })
});

export type SkillsAnalysis = z.infer<typeof SkillsAnalysisSchema>;

// Team Composition Schema
const TeamMemberSchema = z.object({
  role: z.string(),
  skills: z.array(z.string()),
  experience: z.string(),
  salaryRange: z.string(),
  equityRange: z.string(),
  timeline: z.string(),
  priority: z.enum(['immediate', 'early', 'growth', 'scale']),
  alternatives: z.array(z.string()),
  justification: z.string()
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

const TeamCompositionSchema = z.object({
  coreTeam: z.array(TeamMemberSchema),
  advisors: z.array(z.object({
    expertise: z.string(),
    value: z.string(),
    equityRange: z.string(),
    timeCommitment: z.string(),
    networkValue: z.string()
  })),
  hiringPlan: z.array(z.object({
    phase: z.string(),
    roles: z.array(z.string()),
    timeline: z.string(),
    totalCost: z.string(),
    keyMilestones: z.array(z.string())
  })),
  teamDynamics: z.object({
    cultureConsiderations: z.array(z.string()),
    communicationStyle: z.string(),
    decisionMaking: z.string(),
    conflictResolution: z.array(z.string())
  })
});

export type TeamComposition = z.infer<typeof TeamCompositionSchema>;

// Investment Requirements Schema
const InvestmentRequirementsSchema = z.object({
  personalInvestment: z.object({
    timeCommitment: z.string(),
    financialInvestment: z.string(),
    opportunityCost: z.string(),
    riskAssessment: z.string(),
    mitigationStrategies: z.array(z.string())
  }),
  skillInvestment: z.object({
    trainingCosts: z.string(),
    coursesAndCertifications: z.array(z.object({
      name: z.string(),
      cost: z.string(),
      duration: z.string(),
      provider: z.string(),
      skills: z.array(z.string())
    })),
    mentoringAndCoaching: z.string(),
    networkingInvestment: z.string(),
    totalDevelopmentCost: z.string()
  }),
  teamInvestment: z.object({
    year1TeamCosts: z.string(),
    equityBudget: z.string(),
    recruitmentCosts: z.string(),
    retentionStrategies: z.array(z.string()),
    totalTeamInvestment: z.string()
  }),
  riskMitigation: z.object({
    contingencyPlanning: z.array(z.string()),
    exitStrategies: z.array(z.string()),
    insuranceRecommendations: z.array(z.string()),
    legalProtections: z.array(z.string())
  })
});

export type InvestmentRequirements = z.infer<typeof InvestmentRequirementsSchema>;

// Founder Fit Output Schema
const FounderFitOutputSchema = z.object({
  skillsAnalysis: SkillsAnalysisSchema,
  teamComposition: TeamCompositionSchema,
  investmentRequirements: InvestmentRequirementsSchema,
  readinessScore: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      skillsReadiness: z.number().min(0).max(100),
      experienceAlignment: z.number().min(0).max(100),
      resourceAvailability: z.number().min(0).max(100),
      commitmentLevel: z.number().min(0).max(100),
      riskManagement: z.number().min(0).max(100)
    })
  }),
  recommendations: z.object({
    immediate: z.array(z.string()),
    shortTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
    redFlags: z.array(z.string()),
    successFactors: z.array(z.string())
  }),
  scenarios: z.object({
    soloFounder: z.object({
      viability: z.string(),
      timeline: z.string(),
      risks: z.array(z.string()),
      mitigations: z.array(z.string())
    }),
    coFounder: z.object({
      idealProfile: z.string(),
      complementarySkills: z.array(z.string()),
      equityConsiderations: z.string(),
      findingStrategies: z.array(z.string())
    }),
    teamBuild: z.object({
      timeline: z.string(),
      priorityRoles: z.array(z.string()),
      totalCost: z.string(),
      fundingNeeds: z.string()
    })
  }),
  confidence: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      skillsAssessment: z.number().min(0).max(100),
      teamPlanning: z.number().min(0).max(100),
      costEstimation: z.number().min(0).max(100),
      marketAlignment: z.number().min(0).max(100)
    })
  })
});

export type FounderFitOutput = z.infer<typeof FounderFitOutputSchema>;

/**
 * Founder Fit Agent
 * 
 * Analyzes founder readiness and provides comprehensive guidance on:
 * - Skills gap analysis and development planning
 * - Team composition and hiring strategy
 * - Personal and financial investment requirements
 * - Risk assessment and mitigation strategies
 * - Readiness scoring and recommendations
 */
export class FounderFitAgent extends BaseAgent<FounderFitInput, FounderFitOutput> {
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
  public async analyze(input: FounderFitInput, context: AgentContext) {
    return this.execute(input, context);
  }

  protected async processRequest(
    input: FounderFitInput,
    context: AgentContext
  ): Promise<FounderFitOutput> {
    this.logger.info('Starting founder fit analysis', { 
      ideaTitle: input.title,
      category: input.category,
      hasFounderBackground: !!input.founderBackground 
    });

    // Step 1: Analyze required skills vs current capabilities
    const skillsAnalysis = await this.analyzeSkillsGap(input, context);
    
    // Step 2: Design optimal team composition
    const teamComposition = await this.designTeamComposition(input, skillsAnalysis, context);
    
    // Step 3: Calculate investment requirements
    const investmentRequirements = await this.calculateInvestmentRequirements(input, skillsAnalysis, teamComposition, context);
    
    // Step 4: Calculate readiness scores
    const readinessScore = this.calculateReadinessScore(input, skillsAnalysis, investmentRequirements);
    
    // Step 5: Generate recommendations and scenarios
    const recommendations = await this.generateRecommendations(input, skillsAnalysis, readinessScore, context);
    const scenarios = await this.generateScenarios(input, skillsAnalysis, teamComposition, context);
    
    // Step 6: Calculate confidence scores
    const confidence = this.calculateConfidenceScores(skillsAnalysis, teamComposition, investmentRequirements);

    const result: FounderFitOutput = {
      skillsAnalysis,
      teamComposition,
      investmentRequirements,
      readinessScore,
      recommendations,
      scenarios,
      confidence
    };

    this.logger.info('Founder fit analysis completed', {
      overallReadiness: readinessScore.overall,
      criticalGaps: skillsAnalysis.skillsGapSummary.criticalGaps,
      confidence: confidence.overall
    });

    return result;
  }

  private async analyzeSkillsGap(
    input: FounderFitInput,
    context: AgentContext
  ): Promise<SkillsAnalysis> {
    // Gather salary and skills data from free sources if available
    let marketData = '';
    if (this.marketDataProvider) {
      try {
        const skillsData = await this.marketDataProvider.fetchData({
          type: 'skills_market',
          params: { 
            industry: input.category,
            location: 'US'
          }
        });
        marketData = `Skills market data: ${JSON.stringify(skillsData.data)}`;
      } catch (error) {
        this.logger.warn('Skills market data collection failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    const founderSkills = input.founderBackground?.skills || [];
    const founderExperience = input.founderBackground?.experience || 'Not specified';
    const founderIndustry = input.founderBackground?.industry || 'Not specified';

    const prompt = `
    Analyze founder skills gap for this business opportunity:
    
    Business Idea: "${input.title}"
    Description: "${input.ideaText}"
    Category: ${input.category}
    
    Founder Background:
    - Experience: ${founderExperience}
    - Industry Background: ${founderIndustry}
    - Current Skills: ${founderSkills.join(', ') || 'None specified'}
    - Previous Roles: ${input.founderBackground?.previousRoles?.join(', ') || 'Not specified'}
    - Education: ${input.founderBackground?.education || 'Not specified'}
    
    ${marketData}
    
    Perform comprehensive skills gap analysis:
    
    1. REQUIRED SKILLS ANALYSIS:
    Identify all skills needed for success in this venture:
    - Technical skills (programming, AI/ML, data analysis, etc.)
    - Business skills (strategy, finance, marketing, sales)
    - Industry-specific knowledge and certifications
    - Leadership and management capabilities
    - Functional skills (operations, legal, compliance)
    
    For each skill, determine:
    - Category and importance level (critical/important/nice-to-have)
    - Required proficiency level
    - Current founder level (if applicable)
    - Gap assessment
    - Time and cost to develop
    - Alternative solutions (hiring, outsourcing, partnerships)
    
    2. SKILLS GAP SUMMARY:
    Calculate:
    - Total skills needed
    - Critical gaps requiring immediate attention
    - Skills already covered by founder
    - Overall readiness assessment
    
    3. DEVELOPMENT PLAN:
    Create prioritized skill development roadmap:
    - Priority 1: Critical skills needed immediately
    - Priority 2: Important skills for growth phase
    - Priority 3: Nice-to-have skills for scaling
    - Timeline and cost estimates
    - Specific learning recommendations
    
    4. STRENGTHS AND WEAKNESSES:
    Identify:
    - Founder's key strengths and unique advantages
    - Critical weakness areas and risks
    - Market-specific experience gaps
    - Leadership readiness assessment
    
    Base analysis on:
    - Industry skill requirements and benchmarks
    - Startup success factors and founder competencies
    - Market-specific technical and business needs
    - Realistic skill development timelines
    
    Return as valid JSON matching SkillsAnalysisSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 4000
      });

      return SkillsAnalysisSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('Skills gap analysis failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackSkillsAnalysis(input);
    }
  }

  private async designTeamComposition(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    context: AgentContext
  ): Promise<TeamComposition> {
    const criticalSkillGaps = skillsAnalysis.requiredSkills
      .filter(skill => skill.gap === 'critical' || skill.gap === 'large')
      .map(skill => skill.name);

    const prompt = `
    Design optimal team composition for this startup:
    
    Business: "${input.title}"
    Category: ${input.category}
    Critical Skill Gaps: ${criticalSkillGaps.join(', ')}
    Founder Commitment: ${input.userContext?.commitment || 'Not specified'}
    Budget Context: ${input.userContext?.budget || 'Not specified'}
    
    Skills Analysis Summary:
    - Critical gaps: ${skillsAnalysis.skillsGapSummary.criticalGaps}
    - Skills covered: ${skillsAnalysis.skillsGapSummary.skillsCovered}
    - Overall readiness: ${skillsAnalysis.skillsGapSummary.overallReadiness}
    
    Design comprehensive team composition:
    
    1. CORE TEAM MEMBERS:
    For each critical role needed:
    - Specific role title and responsibilities
    - Required skills and experience level
    - Salary range (based on market rates)
    - Equity range (typical for stage and role)
    - Hiring timeline (immediate/early/growth/scale)
    - Alternative solutions (contract, part-time, equity-only)
    - Justification for the role
    
    2. ADVISORS:
    Identify valuable advisory positions:
    - Industry experts and domain knowledge
    - Technical advisors for key capabilities
    - Business mentors and growth advisors
    - Investor and funding advisors
    - Typical equity compensation and time commitment
    - Network value and connection benefits
    
    3. HIRING PLAN:
    Create phased hiring strategy:
    - Phase 1 (Months 1-6): Critical immediate hires
    - Phase 2 (Months 6-12): Growth enablement roles
    - Phase 3 (Year 2+): Scaling and specialization
    - Total costs per phase
    - Key milestones triggering new hires
    
    4. TEAM DYNAMICS:
    Consider organizational aspects:
    - Company culture and values alignment
    - Communication styles and remote/in-person preferences
    - Decision-making processes and authority distribution
    - Conflict resolution and problem-solving approaches
    
    Base recommendations on:
    - Industry hiring patterns and role definitions
    - Market salary data and equity benchmarks
    - Startup stage-appropriate team sizing
    - Skills gap prioritization and urgency
    - Budget constraints and funding timeline
    
    Return as valid JSON matching TeamCompositionSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 4500
      });

      return TeamCompositionSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('Team composition design failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackTeamComposition(input, skillsAnalysis);
    }
  }

  private async calculateInvestmentRequirements(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    teamComposition: TeamComposition,
    context: AgentContext
  ): Promise<InvestmentRequirements> {
    const skillsDevelopmentCost = skillsAnalysis.developmentPlan.totalCost;
    const year1TeamCosts = this.calculateYear1TeamCosts(teamComposition.coreTeam);
    
    const prompt = `
    Calculate comprehensive investment requirements for founder success:
    
    Business: "${input.title}"
    Founder Experience: ${input.founderBackground?.experience || 'Not specified'}
    Skills Development Cost: ${skillsDevelopmentCost}
    Year 1 Team Costs: ${year1TeamCosts}
    Commitment Level: ${input.userContext?.commitment || 'Not specified'}
    Risk Tolerance: ${input.userContext?.riskTolerance || 'Not specified'}
    
    Calculate detailed investment requirements across four areas:
    
    1. PERSONAL INVESTMENT:
    - Time commitment analysis (hours/week, opportunity cost)
    - Personal financial investment needed
    - Opportunity cost assessment (current salary, benefits lost)
    - Personal risk assessment and stress factors
    - Risk mitigation strategies and safety nets
    
    2. SKILL INVESTMENT:
    - Training and education costs
    - Specific courses, certifications, and programs
    - Mentoring and coaching investments
    - Industry networking and conference costs
    - Books, tools, and learning resources
    - Total skill development budget and timeline
    
    3. TEAM INVESTMENT:
    - First-year team salary and benefit costs
    - Equity allocation and dilution implications
    - Recruitment and hiring costs
    - Team retention strategies and costs
    - Performance incentives and bonus structures
    - Total team investment requirements
    
    4. RISK MITIGATION:
    - Contingency planning for key scenarios
    - Exit strategies if venture doesn't succeed
    - Insurance recommendations (health, disability, key person)
    - Legal protections and structure setup
    - Financial safety nets and emergency funds
    
    For each category, provide:
    - Specific cost estimates with ranges
    - Timeline for when investments are needed
    - ROI expectations and success metrics
    - Alternative approaches to reduce costs
    - Risk factors and mitigation strategies
    
    Base calculations on:
    - Market rates for skills development and training
    - Industry salary benchmarks and equity standards
    - Realistic personal financial planning
    - Startup risk profiles and success factors
    
    Return as valid JSON matching InvestmentRequirementsSchema structure.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.3,
        maxTokens: 4000
      });

      return InvestmentRequirementsSchema.parse(JSON.parse(response));
    } catch (error) {
      this.logger.error('Investment requirements calculation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackInvestmentRequirements(input, skillsAnalysis, teamComposition);
    }
  }

  private calculateReadinessScore(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    investmentRequirements: InvestmentRequirements
  ): any {
    // Calculate readiness based on skills coverage, experience, and resource availability
    const skillsReadiness = this.calculateSkillsReadiness(skillsAnalysis);
    const experienceAlignment = this.calculateExperienceAlignment(input);
    const resourceAvailability = this.calculateResourceAvailability(input, investmentRequirements);
    const commitmentLevel = this.calculateCommitmentLevel(input);
    const riskManagement = this.calculateRiskManagement(input, investmentRequirements);
    
    const overall = Math.round((skillsReadiness + experienceAlignment + resourceAvailability + commitmentLevel + riskManagement) / 5);
    
    return {
      overall: Math.min(95, Math.max(15, overall)),
      breakdown: {
        skillsReadiness: Math.round(skillsReadiness),
        experienceAlignment: Math.round(experienceAlignment),
        resourceAvailability: Math.round(resourceAvailability),
        commitmentLevel: Math.round(commitmentLevel),
        riskManagement: Math.round(riskManagement)
      }
    };
  }

  private async generateRecommendations(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    readinessScore: any,
    context: AgentContext
  ): Promise<any> {
    const overallScore = readinessScore.overall;
    const criticalGaps = skillsAnalysis.skillsGapSummary.criticalGaps;
    
    const prompt = `
    Generate actionable recommendations for founder success:
    
    Business: "${input.title}"
    Overall Readiness: ${overallScore}%
    Critical Skill Gaps: ${criticalGaps}
    Skills Readiness: ${readinessScore.breakdown.skillsReadiness}%
    Experience Alignment: ${readinessScore.breakdown.experienceAlignment}%
    
    Provide specific, actionable recommendations in four time horizons:
    
    IMMEDIATE (Next 30 days):
    - Critical actions to start immediately
    - Key decisions to make
    - Resources to secure
    - People to contact
    
    SHORT-TERM (Next 3-6 months):
    - Skill development priorities
    - Team building actions
    - Market validation steps
    - Funding preparation
    
    LONG-TERM (6+ months):
    - Strategic development goals
    - Market expansion preparation
    - Advanced skill acquisition
    - Leadership development
    
    RED FLAGS:
    - Critical warning signs to watch for
    - Deal-breaker scenarios
    - When to pivot or exit
    - Risk indicators requiring immediate attention
    
    SUCCESS FACTORS:
    - Key elements for venture success
    - Competitive advantages to leverage
    - Market opportunities to capture
    - Personal strengths to maximize
    
    Make recommendations specific, actionable, and prioritized by impact.
    
    Return as JSON with immediate, shortTerm, longTerm, redFlags, and successFactors arrays.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 2500
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Recommendations generation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackRecommendations(input, readinessScore);
    }
  }

  private async generateScenarios(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    teamComposition: TeamComposition,
    context: AgentContext
  ): Promise<any> {
    const prompt = `
    Analyze three founder scenarios for this venture:
    
    Business: "${input.title}"
    Critical Skill Gaps: ${skillsAnalysis.skillsGapSummary.criticalGaps}
    Core Team Size: ${teamComposition.coreTeam.length}
    
    Evaluate three approaches:
    
    1. SOLO FOUNDER:
    - Viability assessment for going alone
    - Timeline to build necessary capabilities
    - Major risks and challenges
    - Mitigation strategies and support systems
    
    2. CO-FOUNDER PARTNERSHIP:
    - Ideal co-founder profile and skills
    - Complementary capabilities needed
    - Equity split considerations
    - Strategies for finding the right partner
    
    3. TEAM BUILD APPROACH:
    - Timeline for building full team
    - Priority roles and hiring sequence  
    - Total cost and funding requirements
    - Key milestones and decision points
    
    For each scenario, assess:
    - Success probability and timeline
    - Resource requirements and costs
    - Risk factors and mitigation strategies
    - Market fit and competitive advantages
    
    Provide realistic, actionable analysis for each path.
    
    Return as JSON with soloFounder, coFounder, and teamBuild objects.
    `;

    try {
      const response = await this.callLLM(prompt, {
        format: 'json',
        temperature: 0.4,
        maxTokens: 2000
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Scenarios generation failed', error instanceof Error ? error : new Error(String(error)));
      return this.generateFallbackScenarios(input, skillsAnalysis, teamComposition);
    }
  }

  // Helper calculation methods
  private calculateSkillsReadiness(skillsAnalysis: SkillsAnalysis): number {
    const { totalSkills, skillsCovered, criticalGaps } = skillsAnalysis.skillsGapSummary;
    
    if (totalSkills === 0) return 50; // Default for no skills data
    
    const coverageScore = (skillsCovered / totalSkills) * 100;
    const criticalGapPenalty = criticalGaps * 15; // -15 points per critical gap
    
    return Math.max(10, Math.min(90, coverageScore - criticalGapPenalty));
  }

  private calculateExperienceAlignment(input: FounderFitInput): number {
    const experience = input.founderBackground?.experience || '';
    const industry = input.founderBackground?.industry || '';
    const previousRoles = input.founderBackground?.previousRoles || [];
    
    let score = 40; // Base score
    
    if (experience.toLowerCase().includes('senior') || experience.toLowerCase().includes('lead')) score += 20;
    if (industry && industry !== 'Not specified') score += 15;
    if (previousRoles.length > 0) score += 15;
    if (experience.toLowerCase().includes('startup') || experience.toLowerCase().includes('entrepreneur')) score += 20;
    
    return Math.min(90, score);
  }

  private calculateResourceAvailability(input: FounderFitInput, investmentRequirements: InvestmentRequirements): number {
    const budget = input.userContext?.budget || 'not specified';
    const commitment = input.userContext?.commitment || 'not specified';
    
    let score = 50; // Base score
    
    // Budget assessment
    if (budget.toLowerCase().includes('high') || budget.toLowerCase().includes('substantial')) score += 25;
    else if (budget.toLowerCase().includes('moderate')) score += 10;
    else if (budget.toLowerCase().includes('low') || budget.toLowerCase().includes('limited')) score -= 15;
    
    // Commitment assessment
    if (commitment.toLowerCase().includes('full-time')) score += 15;
    else if (commitment.toLowerCase().includes('part-time')) score -= 10;
    else if (commitment.toLowerCase().includes('side')) score -= 20;
    
    return Math.max(10, Math.min(90, score));
  }

  private calculateCommitmentLevel(input: FounderFitInput): number {
    const commitment = input.userContext?.commitment || '';
    const riskTolerance = input.userContext?.riskTolerance || '';
    
    let score = 50; // Base score
    
    if (commitment.toLowerCase().includes('full-time')) score += 30;
    else if (commitment.toLowerCase().includes('part-time')) score += 10;
    else if (commitment.toLowerCase().includes('side')) score -= 10;
    
    if (riskTolerance.toLowerCase().includes('high')) score += 15;
    else if (riskTolerance.toLowerCase().includes('medium')) score += 5;
    else if (riskTolerance.toLowerCase().includes('low')) score -= 15;
    
    return Math.max(15, Math.min(90, score));
  }

  private calculateRiskManagement(input: FounderFitInput, investmentRequirements: InvestmentRequirements): number {
    // Assess risk management capabilities based on planning and mitigation strategies
    const hasExperience = input.founderBackground?.experience && input.founderBackground.experience !== 'Not specified';
    const hasNetwork = input.founderBackground?.network && input.founderBackground.network !== 'Not specified';
    const riskTolerance = input.userContext?.riskTolerance || '';
    
    let score = 60; // Base score for having risk mitigation plans
    
    if (hasExperience) score += 15;
    if (hasNetwork) score += 10;
    if (riskTolerance.toLowerCase().includes('medium')) score += 10; // Balanced risk approach
    
    return Math.max(20, Math.min(85, score));
  }

  private calculateYear1TeamCosts(coreTeam: TeamMember[]): string {
    const immediateCosts = coreTeam
      .filter(member => member.priority === 'immediate')
      .reduce((total, member) => {
        const salary = this.parseAmount(member.salaryRange.split('-')[0] || '0');
        return total + salary;
      }, 0);
    
    return `$${Math.round(immediateCosts).toLocaleString()}`;
  }

  private parseAmount(amountString: string): number {
    const cleaned = amountString.replace(/[$,]/g, '');
    const multiplier = amountString.toLowerCase().includes('k') ? 1000 :
                     amountString.toLowerCase().includes('m') ? 1000000 : 1;
    return parseFloat(cleaned) * multiplier;
  }

  private calculateConfidenceScores(
    skillsAnalysis: SkillsAnalysis,
    teamComposition: TeamComposition,
    investmentRequirements: InvestmentRequirements
  ): any {
    // Base confidence on data completeness and analysis depth
    const skillsConfidence = skillsAnalysis.requiredSkills.length > 0 ? 80 : 60;
    const teamConfidence = teamComposition.coreTeam.length > 0 ? 75 : 55;
    const costConfidence = 70; // Moderate confidence in cost estimates
    const marketConfidence = 65; // Based on industry alignment
    
    const overall = Math.round((skillsConfidence + teamConfidence + costConfidence + marketConfidence) / 4);
    
    return {
      overall: Math.min(90, Math.max(45, overall)),
      breakdown: {
        skillsAssessment: skillsConfidence,
        teamPlanning: teamConfidence,
        costEstimation: costConfidence,
        marketAlignment: marketConfidence
      }
    };
  }

  // Fallback methods
  private generateFallbackSkillsAnalysis(input: FounderFitInput): SkillsAnalysis {
    const requiredSkills: Skill[] = [
      {
        name: 'Business Strategy',
        category: 'business',
        importance: 'critical',
        requiredLevel: 'advanced',
        gap: 'moderate',
        developmentTime: '6-12 months',
        developmentCost: '$5,000-10,000',
        alternatives: ['MBA program', 'Business mentor', 'Strategy consultant']
      },
      {
        name: 'Product Management',
        category: 'technical',
        importance: 'critical',
        requiredLevel: 'advanced',
        gap: 'large',
        developmentTime: '3-6 months',
        developmentCost: '$3,000-5,000',
        alternatives: ['Product management course', 'PM mentor', 'Hire PM']
      }
    ];

    return {
      requiredSkills,
      skillsGapSummary: {
        totalSkills: requiredSkills.length,
        criticalGaps: 1,
        moderateGaps: 1,
        skillsCovered: 0,
        overallReadiness: 'medium'
      },
      developmentPlan: {
        priority1: ['Business Strategy', 'Product Management'],
        priority2: ['Marketing', 'Financial Management'],
        priority3: ['Leadership', 'Industry Expertise'],
        timeline: '12-18 months',
        totalCost: '$15,000-25,000',
        recommendations: ['Focus on critical business skills first', 'Consider finding co-founder with complementary skills']
      },
      strengthsAndWeaknesses: {
        strengths: ['Domain knowledge', 'Market understanding'],
        weaknesses: ['Technical implementation', 'Business operations'],
        uniqueAdvantages: ['Industry connections', 'Problem insight'],
        riskAreas: ['Skill development time', 'Resource constraints']
      }
    };
  }

  private generateFallbackTeamComposition(input: FounderFitInput, skillsAnalysis: SkillsAnalysis): TeamComposition {
    return {
      coreTeam: [
        {
          role: 'Technical Co-founder/CTO',
          skills: ['Software Development', 'System Architecture', 'Technical Leadership'],
          experience: '5+ years',
          salaryRange: '$120,000-150,000',
          equityRange: '10-20%',
          timeline: 'Immediate',
          priority: 'immediate',
          alternatives: ['Technical consultant', 'Outsourced development', 'No-code solutions'],
          justification: 'Critical for product development and technical decision-making'
        }
      ],
      advisors: [
        {
          expertise: 'Industry Expert',
          value: 'Domain knowledge and market insights',
          equityRange: '0.5-1%',
          timeCommitment: '2-4 hours/month',
          networkValue: 'Customer introductions and partnerships'
        }
      ],
      hiringPlan: [
        {
          phase: 'Phase 1 (Months 1-6)',
          roles: ['Technical Co-founder', 'Product Manager'],
          timeline: '6 months',
          totalCost: '$180,000',
          keyMilestones: ['MVP launch', 'First customers']
        }
      ],
      teamDynamics: {
        cultureConsiderations: ['Startup mentality', 'Customer focus', 'Rapid iteration'],
        communicationStyle: 'Direct and transparent',
        decisionMaking: 'Collaborative with founder having final say',
        conflictResolution: ['Open discussion', 'Data-driven decisions', 'External mediation if needed']
      }
    };
  }

  private generateFallbackInvestmentRequirements(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    teamComposition: TeamComposition
  ): InvestmentRequirements {
    return {
      personalInvestment: {
        timeCommitment: '50-60 hours/week for 2+ years',
        financialInvestment: '$25,000-50,000',
        opportunityCost: '$150,000-200,000 (lost salary)',
        riskAssessment: 'High personal and financial risk',
        mitigationStrategies: ['Maintain emergency fund', 'Plan exit strategy', 'Seek co-founder']
      },
      skillInvestment: {
        trainingCosts: '$15,000-25,000',
        coursesAndCertifications: [
          {
            name: 'Business Strategy Certificate',
            cost: '$5,000',
            duration: '3 months',
            provider: 'Top Business School',
            skills: ['Strategic Planning', 'Market Analysis']
          }
        ],
        mentoringAndCoaching: '$10,000-15,000',
        networkingInvestment: '$5,000',
        totalDevelopmentCost: '$30,000-45,000'
      },
      teamInvestment: {
        year1TeamCosts: '$200,000-300,000',
        equityBudget: '20-30% total',
        recruitmentCosts: '$15,000-25,000',
        retentionStrategies: ['Competitive equity', 'Growth opportunities', 'Strong culture'],
        totalTeamInvestment: '$235,000-350,000'
      },
      riskMitigation: {
        contingencyPlanning: ['Define success metrics', 'Set decision checkpoints', 'Plan pivot strategies'],
        exitStrategies: ['Return to employment', 'Sell assets', 'License technology'],
        insuranceRecommendations: ['Health insurance', 'Disability insurance', 'Key person insurance'],
        legalProtections: ['IP protection', 'Founder agreements', 'Employment contracts']
      }
    };
  }

  private generateFallbackRecommendations(input: FounderFitInput, readinessScore: any): any {
    return {
      immediate: [
        'Validate business idea with potential customers',
        'Begin developing critical missing skills',
        'Network with industry experts and potential co-founders',
        'Create detailed business plan and financial projections'
      ],
      shortTerm: [
        'Complete skills development program',
        'Build minimum viable product',
        'Establish advisory board',
        'Secure initial funding or bootstrap resources'
      ],
      longTerm: [
        'Scale team based on growth needs',
        'Develop advanced industry expertise',
        'Build strategic partnerships',
        'Prepare for institutional funding'
      ],
      redFlags: [
        'Unable to validate market demand',
        'Cannot acquire necessary skills within timeline',
        'Insufficient funding to reach milestones',
        'Major industry or regulatory changes'
      ],
      successFactors: [
        'Strong founder-market fit',
        'Validated customer demand',
        'Complementary team capabilities',
        'Adequate funding runway'
      ]
    };
  }

  private generateFallbackScenarios(
    input: FounderFitInput,
    skillsAnalysis: SkillsAnalysis,
    teamComposition: TeamComposition
  ): any {
    return {
      soloFounder: {
        viability: 'Challenging but possible',
        timeline: '24-36 months to build capabilities',
        risks: ['Skills development time', 'Resource constraints', 'Burnout potential'],
        mitigations: ['Strong advisory board', 'Outsource non-core functions', 'Gradual team build']
      },
      coFounder: {
        idealProfile: 'Technical co-founder with complementary skills',
        complementarySkills: ['Technical development', 'Product management', 'Industry expertise'],
        equityConsiderations: '40-50% for co-founder depending on contribution',
        findingStrategies: ['Industry networking', 'Startup events', 'Professional connections']
      },
      teamBuild: {
        timeline: '12-18 months to build core team',
        priorityRoles: ['CTO', 'Product Manager', 'Sales Lead'],
        totalCost: '$300,000-500,000 Year 1',
        fundingNeeds: 'Seed funding of $750,000-1.5M required'
      }
    };
  }

  protected validateInput(input: FounderFitInput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      FounderFitInputSchema.parse(input);
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

  protected validateOutput(output: FounderFitOutput): { isValid: boolean; errors: { message: string; field?: string; severity?: 'error' | 'warning' | 'info' }[]; confidence?: number; suggestions?: string[] } {
    try {
      FounderFitOutputSchema.parse(output);
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

  protected async performQualityAssurance(output: FounderFitOutput, context: any): Promise<{ confidence: number; isValid: boolean; errors: any[] }> {
    const errors: any[] = [];
    let confidence = output.confidence.overall;

    // Basic validation checks
    if (output.skillsAnalysis.skillsGapSummary.criticalGaps > 3) {
      errors.push({ message: 'Too many critical skill gaps identified', severity: 'warning' });
      confidence -= 10;
    }

    if (output.readinessScore.overall < 50) {
      errors.push({ message: 'Low founder readiness score', severity: 'warning' });
      confidence -= 5;
    }

    const isValid = errors.filter(e => e.severity === 'error').length === 0;
    return { confidence: Math.max(0, confidence), isValid, errors };
  }
}