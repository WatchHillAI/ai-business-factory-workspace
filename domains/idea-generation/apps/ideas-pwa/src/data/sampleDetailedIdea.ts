import { DetailedIdea } from '../types/detailedIdea';

export const sampleDetailedIdea: DetailedIdea = {
  id: 'ai-customer-support-001',
  title: 'AI-Powered Customer Support for Small Businesses',
  description: 'Intelligent chatbots that learn from customer interactions and provide 24/7 automated support with human-level understanding.',
  tier: 'public',
  
  marketAnalysis: {
    problemStatement: {
      summary: 'Small and medium businesses lose an average of $75,000 annually due to poor customer support, with 67% of customers switching to competitors after a single bad experience. Current solutions are either too expensive (enterprise-grade) or too basic (template chatbots), leaving a gap for intelligent, affordable customer support automation.',
      quantifiedImpact: 'SMBs spend 23% of revenue on customer support operations, with 40% of inquiries being repetitive and automatable. Average response time is 4.2 hours, while customer expectations are <30 minutes.',
      currentSolutions: [
        'Expensive enterprise platforms ($200-500/month)',
        'Basic template chatbots (limited intelligence)',
        'Outsourced call centers (high turnover, inconsistent quality)',
        'Manual email/phone support (slow, labor-intensive)'
      ],
      solutionLimitations: [
        'Enterprise solutions: Too expensive and complex for SMBs',
        'Basic chatbots: Poor understanding of context and nuance',
        'Outsourced: Cultural/language barriers, high turnover',
        'Manual: Doesn\'t scale, inconsistent quality, high cost'
      ],
      costOfInaction: 'Without improved support, SMBs face 15-25% annual customer churn, reduced customer lifetime value by 40%, and missed growth opportunities worth 2-3x their support investment.'
    },
    
    marketSignals: [
      {
        type: 'search_trend',
        description: 'Google searches for "AI customer service small business" increased 340% in the last 12 months',
        strength: 'strong',
        trend: 'growing',
        source: 'Google Trends, SEMrush analysis',
        dateObserved: '2025-07-01',
        quantifiedImpact: '45,000 monthly searches with commercial intent'
      },
      {
        type: 'funding_activity',
        description: 'Conversational AI startups raised $2.1B in 2024, with 60% focused on SMB market',
        strength: 'strong',
        trend: 'growing',
        source: 'PitchBook, Crunchbase analysis',
        dateObserved: '2025-06-15',
        quantifiedImpact: '89 deals in SMB customer service AI, up from 34 in 2023'
      },
      {
        type: 'social_sentiment',
        description: 'LinkedIn discussions about AI customer service show 78% positive sentiment among SMB owners',
        strength: 'moderate',
        trend: 'growing',
        source: 'Brandwatch social listening analysis',
        dateObserved: '2025-06-30',
        quantifiedImpact: '12,000 mentions with 78% positive sentiment'
      },
      {
        type: 'regulatory',
        description: 'EU AI Act creates compliance requirements that favor transparent, explainable AI systems',
        strength: 'moderate',
        trend: 'stable',
        source: 'EU AI Act analysis',
        dateObserved: '2025-05-20',
        quantifiedImpact: 'Creates competitive advantage for compliant solutions'
      }
    ],
    
    customerEvidence: [
      {
        id: 'customer-001',
        customerProfile: {
          industry: 'E-commerce',
          companySize: '50-100 employees',
          role: 'Operations Director',
          geography: 'North America'
        },
        painPoint: 'We get 200+ support tickets daily. Response time is 6+ hours, customers are frustrated, and our team is overwhelmed.',
        currentSolution: 'Manual email support with 2 FTE customer service reps',
        costOfProblem: {
          timeWasted: '40 hours/week on repetitive inquiries',
          moneyLost: '$8,000/month in lost customers due to poor response time',
          opportunityCost: 'Customer service team can\'t focus on complex issues'
        },
        willingnessToPay: {
          amount: '$200-400/month',
          confidence: 'high',
          paymentModel: 'monthly'
        },
        quote: 'If I could automate 60-70% of our basic inquiries and get response time under 30 minutes, that would be transformational for our business.',
        validationMethod: 'interview',
        credibilityScore: 9
      },
      {
        id: 'customer-002',
        customerProfile: {
          industry: 'SaaS',
          companySize: '20-50 employees',
          role: 'Founder/CEO',
          geography: 'Europe'
        },
        painPoint: 'Customer support costs are 18% of revenue. We need to scale support without proportional cost increase.',
        currentSolution: 'Zendesk + part-time support contractors',
        costOfProblem: {
          timeWasted: '25 hours/week managing support contractors',
          moneyLost: '$4,500/month in support costs',
          opportunityCost: 'Founder time diverted from product development'
        },
        willingnessToPay: {
          amount: '$150-300/month',
          confidence: 'high',
          paymentModel: 'monthly'
        },
        quote: 'We need something that understands our product and can handle the common questions intelligently, not just keyword matching.',
        validationMethod: 'interview',
        credibilityScore: 8
      }
    ],
    
    competitorAnalysis: [
      {
        name: 'Intercom',
        description: 'Enterprise customer messaging platform with AI features',
        marketPosition: 'leader',
        strengths: ['Strong brand recognition', 'Comprehensive feature set', 'Enterprise integrations'],
        weaknesses: ['Too expensive for SMBs', 'Complex setup', 'Over-engineered for simple use cases'],
        pricing: {
          model: 'Per seat + usage',
          range: '$150-500/month',
          target: 'enterprise'
        },
        marketShare: '15% of enterprise market',
        funding: {
          totalRaised: '$241M',
          lastRound: 'Series D',
          investors: ['Bessemer', 'ICONIQ Capital']
        },
        differentiationOpportunity: 'Focus on SMB-specific needs, simpler setup, affordable pricing'
      },
      {
        name: 'Zendesk Chat',
        description: 'Customer service platform with basic chatbot capabilities',
        marketPosition: 'challenger',
        strengths: ['Market presence', 'Integrated suite', 'Established customer base'],
        weaknesses: ['Limited AI capabilities', 'Still complex for SMBs', 'Not purpose-built for intelligence'],
        pricing: {
          model: 'Per agent',
          range: '$50-150/month',
          target: 'smb'
        },
        marketShare: '12% of SMB market',
        funding: {
          totalRaised: 'Public company',
          lastRound: 'IPO',
          investors: ['Public markets']
        },
        differentiationOpportunity: 'Superior AI understanding, better SMB onboarding, industry-specific templates'
      }
    ],
    
    marketTiming: {
      assessment: 'perfect',
      reasoning: 'AI technology has matured to enable human-level understanding while remaining cost-effective. SMBs are increasingly digital-native and comfortable with AI. Economic pressures are driving automation adoption.',
      catalysts: [
        'COVID-19 accelerated digital transformation for SMBs',
        'Labor shortage making automation attractive',
        'Large language models enabling better AI at lower costs',
        'Customer expectations for instant support now mainstream'
      ]
    }
  },
  
  marketSizing: {
    tam: {
      value: 24,
      unit: 'billion',
      currency: 'USD',
      geography: 'global',
      year: 2025,
      source: 'Gartner Customer Service Technology Market Report',
      confidence: 'high',
      growthRate: 12.5
    },
    sam: {
      value: 3.2,
      unit: 'billion',
      currency: 'USD',
      geography: 'north-america',
      year: 2025,
      source: 'Gartner + SMB market analysis',
      confidence: 'high',
      growthRate: 15.2
    },
    som: {
      value: 32,
      unit: 'million',
      currency: 'USD',
      geography: 'north-america',
      year: 2025,
      source: 'Bottom-up analysis of target segments',
      confidence: 'medium',
      growthRate: 18.5
    },
    projections: [
      {
        quarter: 'Q1',
        year: 2026,
        metrics: {
          customers: { count: 25, acquisitionCost: 1200, churnRate: 5 },
          revenue: { total: 7500, recurring: 7500, oneTime: 0 },
          costs: { development: 45000, marketing: 15000, operations: 8000, infrastructure: 2000 },
          milestones: ['MVP launch', 'First 25 paying customers', 'Product-market fit validation']
        },
        assumptions: ['$300 average monthly revenue per customer', 'High-touch onboarding initially'],
        risks: ['Longer sales cycles than expected', 'Higher customer acquisition costs']
      },
      {
        quarter: 'Q2',
        year: 2026,
        metrics: {
          customers: { count: 75, acquisitionCost: 1000, churnRate: 8 },
          revenue: { total: 22500, recurring: 22500, oneTime: 0 },
          costs: { development: 55000, marketing: 25000, operations: 12000, infrastructure: 3500 },
          milestones: ['Self-serve onboarding', '75 customers', 'Industry-specific templates']
        },
        assumptions: ['Improved onboarding reduces acquisition cost', 'Some early churn as we refine PMF'],
        risks: ['Scaling customer success', 'Technical scaling challenges']
      },
      {
        quarter: 'Q3',
        year: 2026,
        metrics: {
          customers: { count: 200, acquisitionCost: 800, churnRate: 6 },
          revenue: { total: 60000, recurring: 60000, oneTime: 0 },
          costs: { development: 70000, marketing: 40000, operations: 20000, infrastructure: 6000 },
          milestones: ['200 customers', 'Advanced AI features', 'Partnership integrations']
        },
        assumptions: ['Product-led growth begins', 'Reduced churn with better onboarding'],
        risks: ['Increased competition', 'Need for Series A funding']
      },
      {
        quarter: 'Q4',
        year: 2026,
        metrics: {
          customers: { count: 400, acquisitionCost: 600, churnRate: 5 },
          revenue: { total: 120000, recurring: 120000, oneTime: 0 },
          costs: { development: 85000, marketing: 60000, operations: 35000, infrastructure: 10000 },
          milestones: ['400 customers', 'Series A funding', 'International expansion preparation']
        },
        assumptions: ['Strong word-of-mouth growth', 'Operational efficiency improvements'],
        risks: ['Scaling team rapidly', 'International expansion complexity']
      }
    ],
    assumptions: {
      marketGrowth: 15.2,
      penetrationRate: 0.001,
      competitiveResponse: 'Moderate - established players will enhance AI features but focus remains on enterprise',
      economicSensitivity: 'medium'
    }
  },
  
  founderFit: {
    requiredSkills: [
      {
        category: 'technical',
        name: 'Machine Learning & NLP',
        importance: 'critical',
        description: 'Deep understanding of conversational AI, language models, and ML training',
        alternatives: ['Hire ML engineer as co-founder', 'Partner with AI research lab', 'Use pre-trained models initially']
      },
      {
        category: 'business',
        name: 'SMB Sales & Marketing',
        importance: 'critical',
        description: 'Experience selling to small business owners, understanding their pain points and buying process',
        alternatives: ['Hire experienced SMB sales leader early', 'Advisory board with SMB expertise']
      },
      {
        category: 'domain',
        name: 'Customer Service Operations',
        importance: 'important',
        description: 'Understanding of customer service workflows, metrics, and best practices',
        alternatives: ['Advisory board with CS leaders', 'Hire head of customer success with domain expertise']
      }
    ],
    experienceNeeds: [
      {
        type: 'startup',
        description: 'Previous experience building and scaling a technology product',
        importance: 'important',
        timeRequired: '2+ years',
        substitutesWith: ['Strong advisory board', 'Experienced early employees', 'Accelerator program']
      },
      {
        type: 'industry',
        description: 'Experience in customer service, SaaS, or SMB market',
        importance: 'critical',
        timeRequired: '3+ years',
        substitutesWith: ['Co-founder with domain expertise', 'Extensive customer discovery']
      }
    ],
    costStructure: {
      development: {
        initial: 150000,
        scaling: [75000, 100000, 130000, 170000],
        breakdown: {
          personnel: 120000,
          technology: 15000,
          infrastructure: 8000,
          thirdParty: 7000
        }
      },
      operations: {
        quarterly: [15000, 25000, 40000, 65000],
        breakdown: {
          customerSuccess: 8000,
          sales: 12000,
          marketing: 20000,
          legal: 3000,
          finance: 2000
        }
      },
      aiInference: {
        costPerRequest: 0.002,
        expectedVolume: [100000, 350000, 800000, 1500000],
        scalingFactors: ['Improved model efficiency', 'Volume discounts', 'Custom model deployment']
      }
    },
    investmentNeeds: {
      bootstrapping: {
        feasible: false,
        timeframe: 'Not recommended',
        constraints: ['High initial ML development costs', 'Need for rapid customer acquisition', 'Infrastructure scaling requirements']
      },
      seedFunding: {
        recommended: true,
        amount: 750000,
        useOfFunds: ['Product development (60%)', 'Customer acquisition (25%)', 'Operations (15%)'],
        timeline: '6-9 months to raise'
      },
      seriesA: {
        timeframe: '12-15 months after seed',
        expectedAmount: 3500000,
        requirements: ['$100K+ ARR', 'Clear product-market fit', 'Scalable customer acquisition']
      }
    },
    teamComposition: {
      coFounders: 2,
      advisors: ['Former customer service executive', 'SMB sales leader', 'ML/AI expert', 'Legal/compliance advisor'],
      keyHires: ['Senior ML Engineer', 'Customer Success Manager', 'Sales Development Rep'],
      boardMembers: ['Lead investor', 'Independent industry expert']
    }
  },
  
  goToMarket: {
    targetSegments: [
      {
        name: 'E-commerce SMBs',
        description: 'Online retailers with 20-200 employees handling high customer inquiry volume',
        size: 45000,
        accessDifficulty: 'easy',
        paymentCapacity: 'high',
        adoptionSpeed: 'fast',
        influenceOnOthers: 'high',
        specificChannels: ['Shopify App Store', 'E-commerce conferences', 'Industry publications'],
        keyPainPoints: ['High inquiry volume', 'Peak season scaling', 'International customer support']
      },
      {
        name: 'SaaS Startups',
        description: 'B2B SaaS companies needing to scale customer success efficiently',
        size: 12000,
        accessDifficulty: 'moderate',
        paymentCapacity: 'high',
        adoptionSpeed: 'fast',
        influenceOnOthers: 'high',
        specificChannels: ['Product Hunt', 'SaaS communities', 'Y Combinator network'],
        keyPainPoints: ['Customer onboarding at scale', 'Technical support automation', 'Reducing support costs']
      },
      {
        name: 'Professional Services',
        description: 'Law firms, agencies, consultancies with repetitive client inquiries',
        size: 78000,
        accessDifficulty: 'moderate',
        paymentCapacity: 'medium',
        adoptionSpeed: 'medium',
        influenceOnOthers: 'medium',
        specificChannels: ['Industry associations', 'Professional networks', 'Content marketing'],
        keyPainPoints: ['Client communication efficiency', 'After-hours availability', 'Staff productivity']
      }
    ],
    channelStrategy: {
      phase1: [
        {
          type: 'direct-sales',
          description: 'Founder-led sales to initial customers for maximum learning',
          costEffectiveness: 'low',
          scalability: 'low',
          timeToResults: '1-2 months',
          requiredResources: ['Founder time', 'Sales materials', 'Demo environment'],
          successMetrics: ['Customer interviews', 'Product feedback', 'Initial revenue']
        }
      ],
      phase2: [
        {
          type: 'content',
          description: 'SEO-optimized content targeting SMB customer service pain points',
          costEffectiveness: 'high',
          scalability: 'high',
          timeToResults: '3-6 months',
          requiredResources: ['Content writer', 'SEO tools', 'Website optimization'],
          successMetrics: ['Organic traffic', 'Lead generation', 'Brand awareness']
        },
        {
          type: 'partner',
          description: 'Integration partnerships with existing SMB tools (CRM, help desk)',
          costEffectiveness: 'high',
          scalability: 'medium',
          timeToResults: '2-4 months',
          requiredResources: ['Partnership manager', 'Technical integration', 'Joint marketing'],
          successMetrics: ['Integration partnerships', 'Referral revenue', 'Customer acquisition']
        }
      ],
      phase3: [
        {
          type: 'self-serve',
          description: 'Product-led growth with self-service onboarding',
          costEffectiveness: 'high',
          scalability: 'high',
          timeToResults: '4-8 months',
          requiredResources: ['Product development', 'Onboarding automation', 'Customer success'],
          successMetrics: ['Free trial conversion', 'Time to value', 'Product adoption']
        }
      ]
    },
    tractionMilestones: [
      {
        name: 'First Paying Customer',
        description: 'Acquire and successfully onboard first paying customer',
        timeframe: 'Month 3',
        successCriteria: ['Customer sees measurable value', 'Successful technical integration', 'Positive feedback'],
        dependencies: ['MVP completion', 'Pricing model', 'Onboarding process'],
        riskFactors: ['Product-market fit uncertainty', 'Technical issues', 'Customer expectations']
      },
      {
        name: 'Product-Market Fit',
        description: 'Achieve strong retention and customer satisfaction metrics',
        timeframe: 'Month 9',
        successCriteria: ['<5% monthly churn', '>8 NPS score', 'Customers willing to refer'],
        dependencies: ['Customer feedback integration', 'Product iteration', 'Customer success'],
        riskFactors: ['Feature complexity', 'Competitive pressure', 'Customer success capacity']
      }
    ],
    competitivePositioning: {
      differentiation: [
        'SMB-focused design and pricing',
        'Industry-specific AI training',
        'No-code setup and customization',
        'Transparent, explainable AI decisions'
      ],
      messaging: 'The only customer service AI built specifically for small businesses - intelligent enough for complex queries, simple enough to set up in minutes.',
      pricing: {
        strategy: 'Value-based pricing with usage tiers',
        justification: 'Customers save 10-20x our monthly fee in support costs',
        competitiveAdvantage: '60-80% less expensive than enterprise solutions'
      }
    },
    launchStrategy: {
      betaProgram: {
        size: 15,
        duration: '3 months',
        criteria: ['High inquiry volume', 'Willingness to provide feedback', 'Representative of target market']
      },
      publicLaunch: {
        timeline: 'Month 6',
        channels: ['Product Hunt', 'Industry publications', 'Social media', 'Content marketing'],
        budget: 25000
      }
    }
  },
  
  riskAssessment: {
    marketRisks: [
      {
        category: 'market',
        description: 'Large enterprise players (Microsoft, Google) launch SMB-focused AI support products',
        probability: 'medium',
        impact: 'high',
        mitigationStrategies: ['Build strong SMB relationships', 'Focus on niche industries', 'Develop superior SMB-specific features'],
        earlyWarningSignals: ['Enterprise player acquisitions', 'Pricing changes', 'SMB-focused marketing campaigns']
      }
    ],
    technicalRisks: [
      {
        category: 'technical',
        description: 'AI model performance doesn\'t meet customer expectations for accuracy',
        probability: 'medium',
        impact: 'high',
        mitigationStrategies: ['Extensive training data collection', 'Human-in-the-loop fallback', 'Continuous model improvement'],
        earlyWarningSignals: ['Customer complaints about accuracy', 'High escalation rates', 'Churn due to AI issues']
      }
    ],
    executionRisks: [
      {
        category: 'execution',
        description: 'Inability to achieve efficient customer acquisition cost',
        probability: 'medium',
        impact: 'medium',
        mitigationStrategies: ['Diversify acquisition channels', 'Improve product-led growth', 'Optimize conversion funnel'],
        earlyWarningSignals: ['Rising CAC', 'Low conversion rates', 'High churn in early cohorts']
      }
    ],
    financialRisks: [
      {
        category: 'financial',
        description: 'AI inference costs grow faster than revenue',
        probability: 'low',
        impact: 'medium',
        mitigationStrategies: ['Implement usage-based pricing', 'Optimize model efficiency', 'Negotiate volume discounts'],
        earlyWarningSignals: ['Increasing cost per customer', 'Margin compression', 'Usage growth outpacing revenue']
      }
    ],
    mitigationPlans: {
      priority1: ['Build strong customer relationships', 'Focus on SMB-specific features', 'Maintain pricing advantage'],
      priority2: ['Continuous AI model improvement', 'Customer success investment', 'Multiple acquisition channels'],
      priority3: ['Cost optimization', 'Product-led growth', 'Strategic partnerships']
    },
    contingencyPlans: [
      'Pivot to enterprise if SMB market proves challenging',
      'Focus on specific verticals (e.g., e-commerce only)',
      'License technology to larger platforms'
    ]
  },
  
  successMetrics: {
    productMetrics: [
      {
        name: 'Customer Satisfaction (CSAT)',
        description: 'Average customer satisfaction score for AI-handled inquiries',
        target: { month3: '7.5', month6: '8.2', month12: '8.8' },
        measurement: 'Post-interaction surveys',
        importance: 'critical'
      },
      {
        name: 'Query Resolution Rate',
        description: 'Percentage of customer inquiries resolved without human escalation',
        target: { month3: 60, month6: 75, month12: 85 },
        measurement: 'Automated tracking of escalations',
        importance: 'critical'
      }
    ],
    businessMetrics: [
      {
        name: 'Monthly Recurring Revenue (MRR)',
        description: 'Total monthly recurring revenue from subscriptions',
        target: { month3: 7500, month6: 35000, month12: 120000 },
        measurement: 'Revenue tracking system',
        importance: 'critical'
      },
      {
        name: 'Customer Acquisition Cost (CAC)',
        description: 'Total cost to acquire a new paying customer',
        target: { month3: '1200', month6: '800', month12: '400' },
        measurement: 'Marketing spend / new customers',
        importance: 'critical'
      }
    ],
    marketMetrics: [
      {
        name: 'Market Share',
        description: 'Percentage of target market using our solution',
        target: { month3: '0.01%', month6: '0.05%', month12: '0.15%' },
        measurement: 'Customer count / addressable market',
        importance: 'monitoring'
      }
    ],
    keyPerformanceIndicators: {
      primary: 'Monthly Recurring Revenue (MRR)',
      secondary: ['Customer Acquisition Cost (CAC)', 'Monthly Churn Rate', 'Net Promoter Score (NPS)'],
      lagging: ['Market Share', 'Brand Awareness', 'Customer Lifetime Value (LTV)']
    }
  },
  
  confidence: {
    overall: 78,
    breakdown: {
      marketSize: 85,
      customerDemand: 80,
      technicalFeasibility: 75,
      founderFit: 70,
      timing: 88
    }
  },
  
  dataFreshness: {
    lastUpdated: '2025-07-16T00:00:00Z',
    sources: [
      'Gartner Market Research',
      'Customer interviews (15 conducted)',
      'Competitive analysis',
      'Industry reports',
      'Social media sentiment analysis'
    ],
    nextUpdate: '2025-08-16T00:00:00Z',
    dataQuality: 'high'
  },
  
  relatedIdeas: [
    'ai-sales-automation-smb',
    'customer-success-platform',
    'conversational-commerce'
  ],
  
  tags: ['AI', 'customer-service', 'SMB', 'SaaS', 'automation', 'conversational-ai'],
  industry: ['Customer Service', 'SMB Software', 'AI/ML'],
  geographicFocus: ['North America', 'Europe', 'English-speaking markets']
};