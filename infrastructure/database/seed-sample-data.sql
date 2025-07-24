-- =====================================================
-- Sample Business Ideas Data for Testing
-- =====================================================

-- Sample business idea with comprehensive data matching UI structure
SELECT insert_sample_business_idea(
    'AI-Powered Customer Support for Small Businesses',
    'Intelligent chatbots that learn from customer interactions and provide 24/7 automated support with human-level understanding for SMBs.',
    'public',
    '{
        "marketAnalysis": {
            "problemStatement": {
                "summary": "Small and medium businesses lose an average of $75,000 annually due to poor customer support, with 67% of customers switching to competitors after a single bad experience. Current solutions are either too expensive (enterprise-grade) or too basic (template chatbots), leaving a gap for intelligent, affordable customer support automation.",
                "quantifiedImpact": "SMBs spend 23% of revenue on customer support operations, with 40% of inquiries being repetitive and automatable. Average response time is 4.2 hours, while customer expectations are <30 minutes.",
                "currentSolutions": [
                    "Expensive enterprise platforms ($200-500/month)",
                    "Basic template chatbots (limited intelligence)",
                    "Outsourced call centers (high turnover, inconsistent quality)",
                    "Manual email/phone support (slow, labor-intensive)"
                ],
                "solutionLimitations": [
                    "Enterprise solutions: Too expensive and complex for SMBs",
                    "Template chatbots: Cannot handle nuanced customer inquiries",
                    "Call centers: High costs, language barriers, quality inconsistency",
                    "Manual support: Does not scale, leads to long response times"
                ],
                "costOfInaction": "Without improved support automation, SMBs face 15-25% annual customer churn, reduced customer lifetime value by 40%, and missed growth opportunities worth 2-3x their support investment."
            },
            "marketSignals": [
                {
                    "type": "search_trend",
                    "description": "Google searches for ''AI customer service small business'' increased 340% in the last 12 months",
                    "strength": "strong",
                    "trend": "growing",
                    "source": "Google Trends",
                    "dateObserved": "2025-07-20",
                    "quantifiedImpact": "287% YoY search volume growth indicates urgent market demand"
                },
                {
                    "type": "funding_activity",
                    "description": "Conversational AI startups raised $2.1B in 2024, with 60% focused on SMB market",
                    "strength": "strong", 
                    "trend": "growing",
                    "source": "Crunchbase",
                    "dateObserved": "2025-07-18",
                    "quantifiedImpact": "$2.3B total funding activity signals investor confidence in market"
                },
                {
                    "type": "social_sentiment",
                    "description": "LinkedIn discussions about AI customer service show 78% positive sentiment among SMB owners",
                    "strength": "moderate",
                    "trend": "stable",
                    "source": "Social Listening Analysis",
                    "dateObserved": "2025-07-19",
                    "quantifiedImpact": "87% of discussions mention budget constraints as primary barrier"
                }
            ],
            "customerEvidence": [
                {
                    "id": "customer-001",
                    "customerProfile": {
                        "industry": "E-commerce",
                        "companySize": "25 employees",
                        "role": "Operations Manager",
                        "geography": "Austin, TX"
                    },
                    "painPoint": "Spending 3 hours daily on repetitive customer inquiries about order status, returns, and product info",
                    "currentSolution": "Manual email responses with 6-hour average response time",
                    "costOfProblem": {
                        "timeWasted": "15 hours/week staff time",
                        "moneyLost": "$12,000/month in overtime costs",
                        "opportunityCost": "Unable to focus on growth initiatives"
                    },
                    "willingnessToPay": {
                        "amount": "$299/month",
                        "confidence": "high",
                        "paymentModel": "monthly",
                        "reasoning": "Would save $8,000/month in labor costs while improving customer experience"
                    },
                    "quote": "We desperately need something smarter than canned responses but can''t afford enterprise solutions.",
                    "validationMethod": "interview",
                    "credibilityScore": 9
                },
                {
                    "id": "customer-002", 
                    "customerProfile": {
                        "industry": "Professional Services",
                        "companySize": "12 employees",
                        "role": "CEO",
                        "geography": "Denver, CO"
                    },
                    "painPoint": "Lost 3 major clients due to slow response times during peak periods",
                    "currentSolution": "Part-time virtual assistant for customer inquiries",
                    "costOfProblem": {
                        "timeWasted": "10 hours/week managing support queue",
                        "moneyLost": "$45,000 in lost client revenue",
                        "opportunityCost": "CEO time diverted from business development"
                    },
                    "willingnessToPay": {
                        "amount": "$199/month",
                        "confidence": "high",
                        "paymentModel": "monthly",
                        "reasoning": "ROI payback in first month through improved client retention"
                    },
                    "quote": "Smart automation that understands context would be a game-changer for our client relationships.",
                    "validationMethod": "interview",
                    "credibilityScore": 8
                }
            ],
            "competitorAnalysis": [
                {
                    "name": "Zendesk",
                    "category": "indirect",
                    "strengths": ["Established brand", "Feature completeness", "Integration ecosystem"],
                    "weaknesses": ["Complex setup", "High cost ($99+/agent/month)", "Over-engineered for SMBs"],
                    "marketShare": "15% of SMB support market",
                    "pricing": "$99-199/agent/month",
                    "differentiationOpportunity": "AI-first approach with 10x simpler setup and 60% lower cost"
                },
                {
                    "name": "Intercom",
                    "category": "indirect", 
                    "strengths": ["Modern UI", "Messaging focus", "Good automation"],
                    "weaknesses": ["Expensive scaling", "Limited AI intelligence", "Complex pricing"],
                    "marketShare": "8% of SMB market",
                    "pricing": "$74-149/seat/month",
                    "differentiationOpportunity": "Purpose-built AI for SMBs vs generalist messaging platform"
                },
                {
                    "name": "Tidio",
                    "category": "direct",
                    "strengths": ["SMB-focused", "Affordable pricing", "Easy setup"],
                    "weaknesses": ["Limited AI capabilities", "Basic analytics", "Template-based responses"],
                    "marketShare": "5% of SMB market", 
                    "pricing": "$29-59/month",
                    "differentiationOpportunity": "Advanced AI understanding vs simple rule-based chatbots"
                },
                {
                    "name": "ChatGPT/Custom AI",
                    "category": "substitute",
                    "strengths": ["Powerful AI", "Flexible", "Cost-effective"],
                    "weaknesses": ["Requires technical setup", "No business context", "Integration challenges"],
                    "marketShare": "Growing DIY segment",
                    "pricing": "$20-100/month API costs",
                    "differentiationOpportunity": "Business-ready AI solution vs DIY technical implementation"
                }
            ],
            "marketTiming": {
                "assessment": "perfect",
                "reasoning": "Convergence of mature AI technology, increased SMB digital adoption post-COVID, and growing customer service expectations creates ideal market conditions. SMBs are now comfortable with AI tools and urgently need cost-effective solutions.",
                "catalysts": [
                    "ChatGPT mainstream adoption increased AI acceptance by 400%",
                    "SMB digital transformation accelerated by COVID-19",
                    "Rising labor costs make automation ROI compelling",
                    "Customer expectations for 24/7 support now standard",
                    "New generation of business owners comfortable with AI tools"
                ],
                "confidence": 92
            }
        },
        "marketSizing": {
            "tam": {
                "value": 24000,
                "unit": "million",
                "confidence": 85,
                "growthRate": 15
            },
            "sam": {
                "value": 8500,
                "unit": "million", 
                "confidence": 78,
                "growthRate": 18
            },
            "som": {
                "value": 150,
                "unit": "million",
                "confidence": 72,
                "growthRate": 25
            },
            "assumptions": {
                "marketGrowth": 15,
                "penetrationRate": 0.05,
                "competitiveResponse": "Moderate - incumbents focused on enterprise, slow to adapt to AI-first approach"
            },
            "projections": [
                {
                    "quarter": "Q1 2025",
                    "metrics": {
                        "customers": {"count": 50, "growth": "100% QoQ"},
                        "revenue": {"total": 15000, "recurring": 12000, "oneTime": 3000},
                        "costs": {
                            "development": 25000,
                            "marketing": 8000,
                            "operations": 3000,
                            "infrastructure": 2000
                        }
                    },
                    "milestones": ["Beta launch", "First 50 customers", "Product-market fit signals"],
                    "assumptions": ["$250 average ACV", "5% monthly churn", "80% gross margins"],
                    "risks": ["Slow customer acquisition", "Higher than expected churn"]
                },
                {
                    "quarter": "Q2 2025",
                    "metrics": {
                        "customers": {"count": 150, "growth": "200% QoQ"},
                        "revenue": {"total": 45000, "recurring": 37500, "oneTime": 7500},
                        "costs": {
                            "development": 35000,
                            "marketing": 18000,
                            "operations": 8000,
                            "infrastructure": 4000
                        }
                    },
                    "milestones": ["Series A funding", "Team expansion", "Feature completeness"],
                    "assumptions": ["$300 average ACV", "4% monthly churn", "83% gross margins"], 
                    "risks": ["Competition from incumbents", "Scaling infrastructure"]
                }
            ]
        },
        "financialModel": {
            "revenueProjections": [
                {
                    "period": "Year 1",
                    "revenue": 180000,
                    "costs": 140000,
                    "profit": 40000,
                    "assumptions": ["300 customers", "$50/month ARPU", "85% gross margin"]
                },
                {
                    "period": "Year 2", 
                    "revenue": 720000,
                    "costs": 480000,
                    "profit": 240000,
                    "assumptions": ["1200 customers", "$60/month ARPU", "87% gross margin"]
                }
            ],
            "costAnalysis": {
                "initialInvestment": 150000,
                "monthlyBurnRate": 28000,
                "breakEvenPoint": "Month 18",
                "categories": {
                    "development": 60000,
                    "marketing": 45000,
                    "operations": 25000,
                    "infrastructure": 20000
                }
            },
            "fundingRequirements": {
                "seedRound": 500000,
                "seriesA": 2000000,
                "timeline": "Seed: Q2 2025, Series A: Q1 2026"
            },
            "keyMetrics": {
                "cac": 120,
                "ltv": 1800,
                "ltvCacRatio": 15,
                "monthlyChurn": 0.04,
                "grossMargin": 0.85
            }
        },
        "founderFit": {
            "requiredSkills": [
                {
                    "category": "technical",
                    "name": "Machine Learning & NLP",
                    "importance": "critical",
                    "description": "Deep understanding of conversational AI, language models, and ML training pipelines",
                    "alternatives": ["Hire ML engineer as co-founder", "Partner with AI research lab", "Use pre-trained models initially"]
                },
                {
                    "category": "business",
                    "name": "SMB Sales & Marketing", 
                    "importance": "critical",
                    "description": "Experience selling to small business owners, understanding their pain points and buying process",
                    "alternatives": ["Hire experienced SMB sales leader early", "Advisory board with SMB expertise"]
                }
            ],
            "investmentNeeds": {
                "seedFunding": {
                    "amount": 500000,
                    "timeline": "Q2 2025",
                    "useOfFunds": [
                        {"category": "Development", "amount": 200000, "percentage": 40},
                        {"category": "Marketing", "amount": 150000, "percentage": 30},
                        {"category": "Operations", "amount": 100000, "percentage": 20},
                        {"category": "Reserve", "amount": 50000, "percentage": 10}
                    ]
                }
            }
        },
        "goToMarket": {
            "targetSegments": [
                {
                    "name": "E-commerce SMBs",
                    "size": "850K companies",
                    "characteristics": "10-100 employees, high customer interaction volume",
                    "painPoints": ["Order inquiries", "Return processing", "Product questions"],
                    "channels": ["Content marketing", "E-commerce partnerships", "Direct outreach"],
                    "priority": "primary"
                }
            ],
            "competitivePositioning": {
                "differentiation": [
                    {"factor": "AI-first design", "advantage": "10x smarter responses than rule-based chatbots"},
                    {"factor": "SMB-focused pricing", "advantage": "60% lower cost than enterprise solutions"}
                ],
                "pricing": {
                    "strategy": "Value-based pricing with freemium entry",
                    "justification": "Price based on customer support cost savings and efficiency gains",
                    "competitiveAdvantage": "Transparent per-business pricing vs complex per-agent models"
                },
                "messaging": "Intelligent customer support that grows with your business - no IT degree required"
            }
        },
        "riskAssessment": {
            "overallRiskScore": 68,
            "riskProfile": "Medium-High",
            "marketRisks": [
                {
                    "category": "Competition",
                    "description": "Major incumbent (Zendesk, Intercom) launches AI-focused SMB product",
                    "probability": "medium",
                    "impact": "high", 
                    "severity": "high",
                    "mitigation": "Build strong brand and customer relationships before incumbents react"
                }
            ],
            "technicalRisks": [
                {
                    "category": "AI Performance",
                    "description": "AI model accuracy falls below customer expectations",
                    "probability": "medium",
                    "impact": "high",
                    "severity": "high",
                    "mitigation": "Extensive training data collection and continuous model improvement"
                }
            ],
            "executionRisks": [
                {
                    "category": "Customer Acquisition",
                    "description": "SMB sales cycles longer than projected, higher CAC",
                    "probability": "high",
                    "impact": "medium",
                    "severity": "medium", 
                    "mitigation": "Multiple acquisition channels and freemium conversion strategy"
                }
            ],
            "financialRisks": [
                {
                    "category": "Unit Economics",
                    "description": "Higher infrastructure costs as AI usage scales",
                    "probability": "medium",
                    "impact": "medium",
                    "severity": "medium",
                    "mitigation": "Multi-cloud strategy and usage-based pricing adjustments"
                }
            ]
        },
        "confidence": {
            "overall": 78,
            "problemValidation": 85,
            "marketSignals": 82,
            "customerEvidence": 87,
            "competitorAnalysis": 75,
            "marketTiming": 92,
            "breakdown": {
                "marketResearch": 84,
                "financialModeling": 73,
                "founderFit": 76,
                "riskAssessment": 68
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
            "timestamp": "2025-07-24T20:30:00Z"
        }
    }'::jsonb
);

-- Second sample idea
SELECT insert_sample_business_idea(
    'AI-Powered Content Creation for Social Media',
    'Automated content generation and scheduling tool that creates engaging social media posts, captions, and visuals tailored to brand voice and audience.',
    'ai-generated',
    '{
        "marketAnalysis": {
            "problemStatement": {
                "summary": "Small businesses struggle with consistent social media presence, spending 5-10 hours weekly on content creation while seeing poor engagement. 73% of SMBs report social media marketing as their biggest digital challenge.",
                "quantifiedImpact": "SMBs spend average $2,400/month on social media management, with 40% reporting inconsistent posting and 60% struggling with content ideas.",
                "currentSolutions": ["Manual content creation", "Generic scheduling tools", "Expensive agencies", "Freelance content creators"],
                "costOfInaction": "Businesses with poor social media presence lose 23% of potential customers and have 40% lower brand awareness."
            }
        },
        "marketSizing": {
            "tam": {"value": 16200, "unit": "million", "confidence": 80, "growthRate": 22},
            "sam": {"value": 5400, "unit": "million", "confidence": 75, "growthRate": 28},
            "som": {"value": 95, "unit": "million", "confidence": 70, "growthRate": 35}
        },
        "confidence": {
            "overall": 72,
            "breakdown": {"marketResearch": 75, "financialModeling": 68, "founderFit": 74, "riskAssessment": 71}
        }
    }'::jsonb
);

-- Third sample idea
SELECT insert_sample_business_idea(
    'Smart Inventory Management for Restaurants',
    'IoT-enabled inventory tracking system with predictive analytics to reduce food waste and optimize purchasing for restaurants.',
    'exclusive',
    '{
        "marketAnalysis": {
            "problemStatement": {
                "summary": "Restaurants waste $165 billion annually in food costs due to poor inventory management. 85% of restaurants struggle with accurate inventory tracking and 70% over-order perishables.",
                "quantifiedImpact": "Average restaurant loses 18% of food inventory to waste, costing $75,000 annually for mid-size establishments.",
                "currentSolutions": ["Manual spreadsheets", "Basic POS integration", "Expensive enterprise solutions"],
                "costOfInaction": "Without proper inventory management, restaurants face 15-25% food cost overruns and reduced profitability."
            }
        },
        "marketSizing": {
            "tam": {"value": 8900, "unit": "million", "confidence": 88, "growthRate": 12},
            "sam": {"value": 2200, "unit": "million", "confidence": 85, "growthRate": 18},
            "som": {"value": 45, "unit": "million", "confidence": 78, "growthRate": 30}
        },
        "confidence": {
            "overall": 81,
            "breakdown": {"marketResearch": 85, "financialModeling": 79, "founderFit": 78, "riskAssessment": 82}
        }
    }'::jsonb
);

-- Display inserted data
SELECT 
    id,
    title,
    tier,
    confidence_overall,
    market_size_tam,
    created_at
FROM business_ideas
ORDER BY created_at DESC;