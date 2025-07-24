-- =====================================================
-- AI Business Factory - Business Ideas Database Schema
-- Aurora PostgreSQL with JSONB for flexible AI-generated content
-- =====================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search optimization

-- =====================================================
-- Main Business Ideas Table
-- =====================================================

CREATE TABLE business_ideas (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,  -- For future user authentication
    
    -- Basic idea information (extracted for indexing)
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'public' CHECK (tier IN ('public', 'exclusive', 'ai-generated')),
    category TEXT DEFAULT 'ai-automation',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Key metrics (extracted for fast filtering/sorting)
    confidence_overall INTEGER DEFAULT 0 CHECK (confidence_overall >= 0 AND confidence_overall <= 100),
    market_size_tam BIGINT,  -- Total Addressable Market in dollars
    success_probability INTEGER DEFAULT 0,
    time_to_market TEXT DEFAULT '6-12 months',
    initial_investment BIGINT DEFAULT 0,  -- In dollars
    
    -- Full AI analysis as JSONB (flexible nested structure)
    idea_data JSONB NOT NULL,
    
    -- Data freshness tracking
    data_freshness JSONB DEFAULT '{"lastUpdated": null, "sources": [], "analysisVersion": "2.1.0"}'::jsonb,
    
    -- Search optimization
    search_vector TSVECTOR,
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (
        (idea_data->'confidence'->>'overall')::integer BETWEEN 0 AND 100
    )
);

-- =====================================================
-- JSONB Structure Documentation
-- =====================================================

/*
Expected JSONB structure in idea_data field:

{
  "marketAnalysis": {
    "problemStatement": {
      "summary": "Problem description",
      "quantifiedImpact": "Impact metrics",
      "currentSolutions": ["solution1", "solution2"],
      "solutionLimitations": ["limitation1"],
      "costOfInaction": "Cost description"
    },
    "marketSignals": [
      {
        "type": "search_trend|social_sentiment|funding_activity|regulatory|technology",
        "description": "Signal description", 
        "strength": "weak|moderate|strong",
        "trend": "growing|stable|declining",
        "source": "Data source",
        "dateObserved": "ISO date",
        "quantifiedImpact": "Impact details"
      }
    ],
    "customerEvidence": [
      {
        "id": "evidence-id",
        "customerProfile": {
          "industry": "Industry name",
          "companySize": "Company size",
          "role": "Customer role",
          "geography": "Location"
        },
        "painPoint": "Specific pain point",
        "currentSolution": "Current approach",
        "costOfProblem": {
          "timeWasted": "Time cost",
          "moneyLost": "Financial cost", 
          "opportunityCost": "Opportunity cost"
        },
        "willingnessToPay": {
          "amount": "Price willing to pay",
          "confidence": "low|medium|high",
          "reasoning": "Why this price"
        }
      }
    ],
    "competitorAnalysis": [
      {
        "name": "Competitor name",
        "category": "direct|indirect|substitute",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"], 
        "marketShare": "Market share %",
        "pricing": "Pricing model",
        "differentiationOpportunity": "How to differentiate"
      }
    ],
    "marketTiming": {
      "assessment": "perfect|good|early|getting-late",
      "reasoning": "Timing analysis",
      "catalysts": ["catalyst1", "catalyst2"],
      "confidence": 85
    }
  },
  
  "marketSizing": {
    "tam": {
      "value": 24000,
      "unit": "million|billion",
      "confidence": 85,
      "growthRate": 15
    },
    "sam": {
      "value": 8500, 
      "unit": "million|billion",
      "confidence": 78,
      "growthRate": 18
    },
    "som": {
      "value": 150,
      "unit": "million|billion", 
      "confidence": 72,
      "growthRate": 25
    },
    "assumptions": {
      "marketGrowth": 15,
      "penetrationRate": 0.05,
      "competitiveResponse": "Response description"
    },
    "projections": [
      {
        "quarter": "Q1 2025",
        "metrics": {
          "customers": {"count": 100, "growth": "25%"},
          "revenue": {"total": 50000, "recurring": 40000, "oneTime": 10000},
          "costs": {
            "development": 20000,
            "marketing": 15000, 
            "operations": 8000,
            "infrastructure": 5000
          }
        },
        "milestones": ["Launch beta", "First 100 customers"],
        "assumptions": ["Assumption 1", "Assumption 2"],
        "risks": ["Risk 1", "Risk 2"]
      }
    ]
  },
  
  "financialModel": {
    "tamSamSom": "Reference to marketSizing",
    "revenueProjections": [
      {
        "period": "Year 1",
        "revenue": 500000,
        "costs": 300000,
        "profit": 200000,
        "assumptions": ["Key assumption"]
      }
    ],
    "costAnalysis": {
      "initialInvestment": 250000,
      "monthlyBurnRate": 25000,
      "breakEvenPoint": "Month 18",
      "categories": {
        "development": 100000,
        "marketing": 75000,
        "operations": 50000,
        "infrastructure": 25000
      }
    },
    "fundingRequirements": {
      "seedRound": 500000,
      "seriesA": 2000000,
      "timeline": "Seed: Q2 2025, Series A: Q4 2025"
    },
    "keyMetrics": {
      "cac": 150,
      "ltv": 2400,
      "ltvCacRatio": 16,
      "monthlyChurn": 0.05,
      "grossMargin": 0.75
    },
    "scenarios": {
      "optimistic": {"multiplier": 1.5, "description": "Best case"},
      "base": {"multiplier": 1.0, "description": "Expected case"},
      "pessimistic": {"multiplier": 0.7, "description": "Conservative case"}
    }
  },
  
  "founderFit": {
    "requiredSkills": [
      {
        "category": "technical|business|domain|leadership",
        "name": "Skill name",
        "importance": "critical|important|nice-to-have",
        "description": "Skill description",
        "alternatives": ["Alternative 1", "Alternative 2"]
      }
    ],
    "experienceNeeds": [
      {
        "area": "Experience area",
        "level": "entry|mid|senior|expert",
        "duration": "2-3 years",
        "description": "Experience description",
        "compensatingFactors": ["Factor 1", "Factor 2"]
      }
    ],
    "costStructure": {
      "development": {
        "initial": 150000,
        "breakdown": {
          "personnel": 100000,
          "technology": 25000,
          "infrastructure": 15000,
          "thirdParty": 10000
        },
        "scaling": [
          {"period": "Month 6-12", "amount": 200000, "reason": "Team expansion"}
        ]
      },
      "operations": {
        "quarterly": [
          {"period": "Q1", "amount": 75000, "breakdown": "Operational costs"}
        ],
        "breakdown": {
          "customerSuccess": 20000,
          "sales": 25000,
          "marketing": 15000,
          "legal": 8000,
          "finance": 7000
        }
      },
      "aiInference": {
        "costPerRequest": 0.01,
        "expectedVolume": [
          {"period": "Month 1", "requests": 10000, "cost": 100}
        ],
        "scalingFactors": [
          {"factor": "User growth", "impact": "Linear increase"}
        ]
      }
    },
    "investmentNeeds": {
      "bootstrapping": {
        "feasible": true,
        "timeframe": "12-18 months",
        "constraints": ["Limited marketing budget", "Slower hiring"]
      },
      "seedFunding": {
        "amount": 500000,
        "timeline": "Q2 2025",
        "useOfFunds": [
          {"category": "Development", "amount": 200000, "percentage": 40},
          {"category": "Marketing", "amount": 150000, "percentage": 30}
        ]
      },
      "seriesA": {
        "expectedAmount": 2000000,
        "timeframe": "Q4 2025",
        "requirements": ["Product-market fit", "ARR > $1M"]
      }
    },
    "teamComposition": {
      "coFounders": 2,
      "keyHires": [
        {"role": "CTO", "timeline": "Month 3", "salary": 120000}
      ],
      "boardMembers": [
        {"name": "Industry Expert", "expertise": "Domain knowledge"}
      ],
      "advisors": [
        {"name": "Technical Advisor", "contribution": "Technical guidance"}
      ]
    }
  },
  
  "goToMarket": {
    "targetSegments": [
      {
        "name": "Small Businesses",
        "size": "5M companies",
        "characteristics": "10-50 employees",
        "painPoints": ["Manual processes", "Limited budget"],
        "channels": ["Direct sales", "Online marketing"],
        "priority": "primary|secondary|tertiary"
      }
    ],
    "channelStrategy": {
      "early": [
        {"channel": "Direct outreach", "investment": 10000, "expectedROI": "3x"}
      ],
      "growth": [
        {"channel": "Content marketing", "investment": 25000, "expectedROI": "4x"}
      ],
      "scale": [
        {"channel": "Partner network", "investment": 50000, "expectedROI": "5x"}
      ]
    },
    "competitivePositioning": {
      "differentiation": [
        {"factor": "AI-powered", "advantage": "10x faster processing"}
      ],
      "pricing": {
        "strategy": "Value-based pricing",
        "justification": "Based on customer ROI",
        "competitiveAdvantage": "Lower total cost of ownership"
      },
      "messaging": "The intelligent solution for modern businesses"
    },
    "tractionMilestones": [
      {
        "milestone": "First 10 customers",
        "timeline": "Month 3",
        "metrics": {"revenue": 10000, "satisfaction": "90%"}
      }
    ],
    "launchStrategy": {
      "betaProgram": {
        "size": 50,
        "duration": "3 months",
        "criteria": ["Target customer profile", "Willingness to provide feedback"]
      },
      "publicLaunch": {
        "timeline": "Q2 2025",
        "budget": 100000,
        "channels": ["Product Hunt", "Industry conferences", "PR campaign"]
      }
    }
  },
  
  "riskAssessment": {
    "overallRiskScore": 65,
    "riskProfile": "Medium-High",
    "marketRisks": [
      {
        "category": "Competition",
        "description": "Large incumbent enters market",
        "probability": "medium",
        "impact": "high",
        "severity": "high",
        "mitigation": "Build strong brand and customer loyalty"
      }
    ],
    "technicalRisks": [
      {
        "category": "Development",
        "description": "AI model accuracy issues", 
        "probability": "low",
        "impact": "high",
        "severity": "medium",
        "mitigation": "Extensive testing and validation"
      }
    ],
    "executionRisks": [
      {
        "category": "Team",
        "description": "Key team member departure",
        "probability": "medium", 
        "impact": "medium",
        "severity": "medium",
        "mitigation": "Cross-training and documentation"
      }
    ],
    "financialRisks": [
      {
        "category": "Funding",
        "description": "Unable to raise Series A",
        "probability": "medium",
        "impact": "high", 
        "severity": "high",
        "mitigation": "Multiple funding sources and runway extension"
      }
    ],
    "mitigationPlans": {
      "priority1": [
        {
          "risk": "Competition from incumbent",
          "plan": "Focus on SMB market they ignore",
          "timeline": "Immediate",
          "owner": "CEO",
          "status": "planned"
        }
      ],
      "priority2": [
        {
          "risk": "Technical challenges",
          "plan": "Build MVP with core features first", 
          "timeline": "Month 1-3",
          "owner": "CTO",
          "status": "in-progress"
        }
      ],
      "priority3": []
    },
    "contingencyPlans": [
      {
        "scenario": "Funding shortfall",
        "plan": "Reduce burn rate by 50%",
        "triggers": ["6 months runway remaining"],
        "actions": ["Freeze hiring", "Reduce marketing spend"]
      }
    ],
    "monitoringFramework": [
      {
        "metric": "Customer acquisition cost",
        "threshold": "$200",
        "frequency": "Monthly",
        "owner": "CMO"
      }
    ]
  },
  
  "confidence": {
    "overall": 78,
    "problemValidation": 85,
    "marketSignals": 72,
    "customerEvidence": 80,
    "competitorAnalysis": 75,
    "marketTiming": 82,
    "breakdown": {
      "marketResearch": 79,
      "financialModeling": 73,
      "founderFit": 81,
      "riskAssessment": 76
    }
  },
  
  "metadata": {
    "generatedBy": "AI Business Factory - All 4 Agents",
    "agentsUsed": ["MarketResearchAgent", "FinancialModelingAgent", "FounderFitAgent", "RiskAssessmentAgent"],
    "executionTime": 4200,
    "qualityMetrics": {
      "dataFreshness": 0.95,
      "sourceReliability": 0.88,
      "analysisDepth": 0.91
    },
    "timestamp": "2025-07-24T18:42:00Z"
  }
}
*/

-- =====================================================
-- Performance Indexes
-- =====================================================

-- Core performance indexes
CREATE INDEX idx_business_ideas_user_created ON business_ideas (user_id, created_at DESC);
CREATE INDEX idx_business_ideas_tier ON business_ideas (tier);
CREATE INDEX idx_business_ideas_category ON business_ideas (category);
CREATE INDEX idx_business_ideas_confidence ON business_ideas (confidence_overall DESC);
CREATE INDEX idx_business_ideas_market_size ON business_ideas (market_size_tam DESC) WHERE market_size_tam IS NOT NULL;

-- JSONB performance indexes  
CREATE INDEX idx_business_ideas_jsonb_gin ON business_ideas USING GIN (idea_data);

-- Specific JSONB field indexes for common queries
CREATE INDEX idx_idea_market_timing ON business_ideas USING GIN ((idea_data->'marketAnalysis'->'marketTiming'));
CREATE INDEX idx_idea_confidence_breakdown ON business_ideas USING GIN ((idea_data->'confidence'));
CREATE INDEX idx_idea_financial_metrics ON business_ideas USING GIN ((idea_data->'financialModel'->'keyMetrics'));

-- Full-text search index
CREATE INDEX idx_business_ideas_search ON business_ideas USING GIN (search_vector);

-- =====================================================
-- Extracted Fields for Fast Queries
-- =====================================================

-- Function to update extracted fields from JSONB
CREATE OR REPLACE FUNCTION update_extracted_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract key metrics for indexing
    NEW.market_size_tam := COALESCE((NEW.idea_data->'marketSizing'->'tam'->>'value')::BIGINT, 0);
    NEW.confidence_overall := COALESCE((NEW.idea_data->'confidence'->>'overall')::INTEGER, 0);
    NEW.success_probability := COALESCE((NEW.idea_data->'confidence'->>'overall')::INTEGER, 0);
    NEW.initial_investment := COALESCE((NEW.idea_data->'founderFit'->'investmentNeeds'->'seedFunding'->>'amount')::BIGINT, 0);
    NEW.time_to_market := COALESCE(NEW.idea_data->'metadata'->>'timeToMarket', '6-12 months');
    
    -- Update search vector
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.idea_data->'marketAnalysis'->'problemStatement'->>'summary', '')
    );
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update extracted fields
CREATE TRIGGER trigger_update_extracted_fields
    BEFORE INSERT OR UPDATE ON business_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_extracted_fields();

-- =====================================================
-- User Management (Future)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key constraint (will be activated when user auth is implemented)
-- ALTER TABLE business_ideas ADD CONSTRAINT fk_business_ideas_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- Analytics Views
-- =====================================================

-- Popular idea categories and metrics
CREATE MATERIALIZED VIEW idea_analytics AS
SELECT 
    date_trunc('month', created_at) as month,
    tier,
    category,
    COUNT(*) as idea_count,
    AVG(confidence_overall) as avg_confidence,
    AVG(market_size_tam) as avg_market_size,
    AVG(initial_investment) as avg_investment
FROM business_ideas 
GROUP BY month, tier, category
ORDER BY month DESC, idea_count DESC;

-- Refresh analytics monthly
CREATE INDEX idx_idea_analytics_month ON idea_analytics (month DESC);

-- =====================================================
-- Sample Data Insertion Function
-- =====================================================

CREATE OR REPLACE FUNCTION insert_sample_business_idea(
    p_title TEXT,
    p_description TEXT,
    p_tier TEXT DEFAULT 'public',
    p_idea_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO business_ideas (title, description, tier, idea_data)
    VALUES (p_title, p_description, p_tier, p_idea_data)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Common Query Functions
-- =====================================================

-- Get ideas with pagination and filtering
CREATE OR REPLACE FUNCTION get_business_ideas(
    p_user_id UUID DEFAULT NULL,
    p_tier TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_confidence INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    tier TEXT,
    confidence_overall INTEGER,
    market_size_tam BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    idea_summary JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bi.id,
        bi.title,
        bi.description, 
        bi.tier,
        bi.confidence_overall,
        bi.market_size_tam,
        bi.created_at,
        jsonb_build_object(
            'marketAnalysis', bi.idea_data->'marketAnalysis'->'problemStatement',
            'confidence', bi.idea_data->'confidence',
            'keyMetrics', jsonb_build_object(
                'marketSize', bi.idea_data->'marketSizing'->'tam',
                'timeToMarket', bi.time_to_market,
                'investment', bi.initial_investment
            )
        ) as idea_summary
    FROM business_ideas bi
    WHERE 
        (p_user_id IS NULL OR bi.user_id = p_user_id)
        AND (p_tier IS NULL OR bi.tier = p_tier)
        AND (p_category IS NULL OR bi.category = p_category)  
        AND bi.confidence_overall >= p_min_confidence
    ORDER BY bi.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Full-text search function
CREATE OR REPLACE FUNCTION search_business_ideas(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    confidence_overall INTEGER,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bi.id,
        bi.title,
        bi.description,
        bi.confidence_overall,
        ts_rank(bi.search_vector, plainto_tsquery('english', p_search_term)) as rank
    FROM business_ideas bi
    WHERE bi.search_vector @@ plainto_tsquery('english', p_search_term)
    ORDER BY rank DESC, bi.confidence_overall DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Permissions & Security
-- =====================================================

-- Grant appropriate permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON business_ideas TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON users TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Row Level Security (when user auth is implemented)
-- ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY business_ideas_user_policy ON business_ideas FOR ALL TO app_user
--     USING (user_id = current_setting('app.current_user_id')::UUID);

COMMENT ON TABLE business_ideas IS 'Stores AI-generated business ideas with comprehensive analysis in JSONB format';
COMMENT ON COLUMN business_ideas.idea_data IS 'Complete AI analysis including market research, financial modeling, founder fit, and risk assessment';
COMMENT ON COLUMN business_ideas.search_vector IS 'Full-text search vector for title, description, and problem statement';
COMMENT ON MATERIALIZED VIEW idea_analytics IS 'Monthly analytics for idea trends and performance metrics';