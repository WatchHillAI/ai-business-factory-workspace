// Detailed Idea Types for Business Intelligence View

export interface MarketSignal {
  type: 'search_trend' | 'social_sentiment' | 'funding_activity' | 'regulatory' | 'technology';
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  trend: 'growing' | 'stable' | 'declining';
  source: string;
  dateObserved: string;
  quantifiedImpact?: string;
}

export interface CustomerEvidence {
  id: string;
  customerProfile: {
    industry: string;
    companySize: string;
    role: string;
    geography: string;
  };
  painPoint: string;
  currentSolution: string;
  costOfProblem: {
    timeWasted: string;
    moneyLost: string;
    opportunityCost: string;
  };
  willingnessToPay: {
    amount: string;
    confidence: 'low' | 'medium' | 'high';
    paymentModel: 'one-time' | 'monthly' | 'annual' | 'usage-based';
  };
  quote: string;
  validationMethod: 'interview' | 'survey' | 'observation' | 'data-analysis';
  credibilityScore: number; // 1-10
}

export interface Competitor {
  name: string;
  description: string;
  marketPosition: 'leader' | 'challenger' | 'niche' | 'follower';
  strengths: string[];
  weaknesses: string[];
  pricing: {
    model: string;
    range: string;
    target: 'enterprise' | 'smb' | 'consumer';
  };
  marketShare: string;
  funding: {
    totalRaised: string;
    lastRound: string;
    investors: string[];
  };
  differentiationOpportunity: string;
}

export interface MarketSize {
  value: number;
  unit: 'million' | 'billion';
  currency: 'USD' | 'EUR' | 'GBP';
  geography: 'global' | 'north-america' | 'europe' | 'asia-pacific' | 'specific';
  year: number;
  source: string;
  confidence: 'low' | 'medium' | 'high';
  growthRate: number; // Annual percentage
}

export interface QuarterlyProjection {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  metrics: {
    customers: {
      count: number;
      acquisitionCost: number;
      churnRate: number;
    };
    revenue: {
      total: number;
      recurring: number;
      oneTime: number;
    };
    costs: {
      development: number;
      marketing: number;
      operations: number;
      infrastructure: number;
    };
    milestones: string[];
  };
  assumptions: string[];
  risks: string[];
}

export interface Skill {
  category: 'technical' | 'business' | 'domain';
  name: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  description: string;
  alternatives: string[]; // How to acquire if not present
}

export interface Experience {
  type: 'startup' | 'industry' | 'functional' | 'network';
  description: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  timeRequired: string; // e.g., "2+ years"
  substitutesWith: string[]; // What can replace this experience
}

export interface CostBreakdown {
  development: {
    initial: number; // Months 1-6
    scaling: number[]; // Quarterly increases
    breakdown: {
      personnel: number;
      technology: number;
      infrastructure: number;
      thirdParty: number;
    };
  };
  operations: {
    quarterly: number[];
    breakdown: {
      customerSuccess: number;
      sales: number;
      marketing: number;
      legal: number;
      finance: number;
    };
  };
  aiInference: {
    costPerRequest: number;
    expectedVolume: number[];
    scalingFactors: string[];
  };
}

export interface InvestmentSchedule {
  bootstrapping: {
    feasible: boolean;
    timeframe: string;
    constraints: string[];
  };
  seedFunding: {
    recommended: boolean;
    amount: number;
    useOfFunds: string[];
    timeline: string;
  };
  seriesA: {
    timeframe: string;
    expectedAmount: number;
    requirements: string[];
  };
}

export interface CustomerSegment {
  name: string;
  description: string;
  size: number;
  accessDifficulty: 'easy' | 'moderate' | 'difficult';
  paymentCapacity: 'low' | 'medium' | 'high';
  adoptionSpeed: 'fast' | 'medium' | 'slow';
  influenceOnOthers: 'low' | 'medium' | 'high';
  specificChannels: string[];
  keyPainPoints: string[];
}

export interface Channel {
  type: 'direct-sales' | 'self-serve' | 'partner' | 'marketplace' | 'content' | 'community';
  description: string;
  costEffectiveness: 'low' | 'medium' | 'high';
  scalability: 'low' | 'medium' | 'high';
  timeToResults: string;
  requiredResources: string[];
  successMetrics: string[];
}

export interface Milestone {
  name: string;
  description: string;
  timeframe: string;
  successCriteria: string[];
  dependencies: string[];
  riskFactors: string[];
}

export interface Risk {
  category: 'market' | 'technical' | 'execution' | 'financial' | 'regulatory';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategies: string[];
  earlyWarningSignals: string[];
}

export interface Metric {
  name: string;
  description: string;
  target: {
    month3: number | string;
    month6: number | string;
    month12: number | string;
  };
  measurement: string;
  importance: 'critical' | 'important' | 'monitoring';
}

// Main detailed idea interface
export interface DetailedIdea {
  // Basic idea information
  id: string;
  title: string;
  description: string;
  tier: 'public' | 'exclusive' | 'ai-generated';
  
  // Detailed analysis sections
  marketAnalysis: {
    problemStatement: {
      summary: string;
      quantifiedImpact: string;
      currentSolutions: string[];
      solutionLimitations: string[];
      costOfInaction: string;
    };
    marketSignals: MarketSignal[];
    customerEvidence: CustomerEvidence[];
    competitorAnalysis: Competitor[];
    marketTiming: {
      assessment: 'too-early' | 'perfect' | 'getting-late' | 'too-late';
      reasoning: string;
      catalysts: string[];
    };
  };
  
  marketSizing: {
    tam: MarketSize;
    sam: MarketSize;
    som: MarketSize;
    projections: QuarterlyProjection[];
    assumptions: {
      marketGrowth: number;
      penetrationRate: number;
      competitiveResponse: string;
      economicSensitivity: 'low' | 'medium' | 'high';
    };
  };
  
  founderFit: {
    requiredSkills: Skill[];
    experienceNeeds: Experience[];
    costStructure: CostBreakdown;
    investmentNeeds: InvestmentSchedule;
    teamComposition: {
      coFounders: number;
      advisors: string[];
      keyHires: string[];
      boardMembers: string[];
    };
  };
  
  goToMarket: {
    targetSegments: CustomerSegment[];
    channelStrategy: {
      phase1: Channel[];
      phase2: Channel[];
      phase3: Channel[];
    };
    tractionMilestones: Milestone[];
    competitivePositioning: {
      differentiation: string[];
      messaging: string;
      pricing: {
        strategy: string;
        justification: string;
        competitiveAdvantage: string;
      };
    };
    launchStrategy: {
      betaProgram: {
        size: number;
        duration: string;
        criteria: string[];
      };
      publicLaunch: {
        timeline: string;
        channels: string[];
        budget: number;
      };
    };
  };
  
  riskAssessment: {
    marketRisks: Risk[];
    technicalRisks: Risk[];
    executionRisks: Risk[];
    financialRisks: Risk[];
    mitigationPlans: {
      priority1: string[];
      priority2: string[];
      priority3: string[];
    };
    contingencyPlans: string[];
  };
  
  successMetrics: {
    productMetrics: Metric[];
    businessMetrics: Metric[];
    marketMetrics: Metric[];
    keyPerformanceIndicators: {
      primary: string;
      secondary: string[];
      lagging: string[];
    };
  };
  
  // Metadata
  confidence: {
    overall: number; // 1-100
    breakdown: {
      marketSize: number;
      customerDemand: number;
      technicalFeasibility: number;
      founderFit: number;
      timing: number;
    };
  };
  
  dataFreshness: {
    lastUpdated: string;
    sources: string[];
    nextUpdate: string;
    dataQuality: 'low' | 'medium' | 'high';
  };
  
  relatedIdeas: string[]; // IDs of related ideas
  tags: string[];
  industry: string[];
  geographicFocus: string[];
}

// Utility types for API responses
export interface IdeaDetailResponse {
  idea: DetailedIdea;
  insights: {
    keyStrengths: string[];
    keyWeaknesses: string[];
    successProbability: number;
    timeToMarket: string;
    capitalRequired: number;
  };
  recommendations: {
    nextSteps: string[];
    resourcesNeeded: string[];
    potentialPartners: string[];
  };
}