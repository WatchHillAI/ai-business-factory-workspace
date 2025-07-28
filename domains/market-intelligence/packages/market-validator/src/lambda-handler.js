// Market Validator Lambda Handler
const createLogger = (service) => ({
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', service, message: msg, ...meta })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', service, message: msg, ...meta })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn', service, message: msg, ...meta })),
});

const logger = createLogger('market-validator');

class ValidationService {
  async performValidation(opportunityId, validationType = 'comprehensive') {
    const startTime = Date.now();
    logger.info('Starting validation', { opportunityId, validationType });

    try {
      // Gather validation data (simulated for Lambda)
      const validationData = await this.gatherValidationData(opportunityId);
      
      // Perform validation across multiple dimensions
      const marketDemand = await this.validateMarketDemand(validationData);
      const competitiveAdvantage = await this.validateCompetitiveAdvantage(validationData);
      const technicalFeasibility = await this.validateTechnicalFeasibility(validationData);
      const financialViability = await this.validateFinancialViability(validationData);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        marketDemand,
        competitiveAdvantage,
        technicalFeasibility,
        financialViability
      );
      
      // Generate insights
      const recommendations = this.generateRecommendations(
        marketDemand,
        competitiveAdvantage,
        technicalFeasibility,
        financialViability
      );
      
      const risks = this.identifyRisks(
        marketDemand,
        competitiveAdvantage,
        technicalFeasibility,
        financialViability
      );

      const processingTime = Date.now() - startTime;

      const validationResult = {
        id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        opportunityId,
        validationType,
        marketDemand,
        competitiveAdvantage,
        technicalFeasibility,
        financialViability,
        overallScore,
        recommendations,
        risks,
        insights: {
          marketReadiness: this.assessMarketReadiness(marketDemand, competitiveAdvantage),
          implementationComplexity: this.assessImplementationComplexity(technicalFeasibility),
          financialProjection: this.generateFinancialProjection(financialViability),
          riskLevel: this.assessOverallRisk(risks)
        },
        metadata: {
          validatedAt: new Date().toISOString(),
          processingTime,
          validationMethod: 'multi-criteria-analysis',
          algorithm: 'weighted-scoring'
        }
      };

      logger.info('Validation completed', { 
        opportunityId, 
        overallScore, 
        processingTime,
        riskLevel: validationResult.insights.riskLevel
      });

      return validationResult;

    } catch (error) {
      logger.error('Validation failed', { opportunityId, error: error.message });
      throw error;
    }
  }

  async gatherValidationData(opportunityId) {
    // Simulate gathering data from multiple sources
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      opportunityId,
      marketData: {
        size: Math.floor(1000000 + Math.random() * 50000000), // $1M - $50M
        growth: 0.05 + Math.random() * 0.25, // 5% - 30% growth
        saturation: Math.random() * 0.8, // 0% - 80% saturated
        trends: this.generateMarketTrends(),
        customerDemand: 0.3 + Math.random() * 0.7 // 30% - 100%
      },
      competitiveData: {
        competitors: Math.floor(2 + Math.random() * 15), // 2-15 competitors
        marketShare: Math.random() * 0.3, // 0% - 30% available share
        differentiation: Math.random(), // 0-1 differentiation score
        barrierToEntry: this.randomChoice(['low', 'medium', 'high']),
        competitorStrength: Math.random()
      },
      technicalData: {
        complexity: this.randomChoice(['low', 'medium', 'high']),
        resources: this.randomChoice(['limited', 'available', 'abundant']),
        timeline: this.randomChoice(['3-6 months', '6-12 months', '12+ months']),
        risks: this.generateTechnicalRisks(),
        feasibilityScore: 0.4 + Math.random() * 0.6
      },
      financialData: {
        initialInvestment: Math.floor(50000 + Math.random() * 1000000), // $50K - $1M
        projectedRevenue: this.generateRevenueProjection(),
        operatingCosts: Math.floor(20000 + Math.random() * 500000), // $20K - $500K
        breakEvenMonths: Math.floor(6 + Math.random() * 24), // 6-30 months
        roi: Math.random() * 3 // 0-300% ROI
      }
    };
  }

  async validateMarketDemand(data) {
    const { marketData } = data;
    
    // Market Demand Validation (40% weight in overall score)
    const sizeScore = Math.min(marketData.size / 10000000, 1); // Normalize by $10M
    const growthScore = Math.min(marketData.growth * 4, 1); // Growth rate scoring
    const saturationScore = 1 - marketData.saturation; // Lower saturation = higher score
    const demandScore = marketData.customerDemand;
    
    const score = (sizeScore * 0.3 + growthScore * 0.3 + saturationScore * 0.2 + demandScore * 0.2) * 100;
    
    return {
      score: Math.round(score),
      details: {
        marketSize: {
          value: marketData.size,
          score: Math.round(sizeScore * 100),
          assessment: marketData.size > 5000000 ? 'Large' : marketData.size > 1000000 ? 'Medium' : 'Small'
        },
        growthRate: {
          value: marketData.growth,
          score: Math.round(growthScore * 100),
          assessment: marketData.growth > 0.2 ? 'High' : marketData.growth > 0.1 ? 'Medium' : 'Low'
        },
        saturation: {
          value: marketData.saturation,
          score: Math.round(saturationScore * 100),
          assessment: marketData.saturation < 0.3 ? 'Low' : marketData.saturation < 0.7 ? 'Medium' : 'High'
        },
        customerDemand: {
          value: marketData.customerDemand,
          score: Math.round(demandScore * 100),
          assessment: marketData.customerDemand > 0.7 ? 'High' : marketData.customerDemand > 0.4 ? 'Medium' : 'Low'
        }
      },
      trends: marketData.trends
    };
  }

  async validateCompetitiveAdvantage(data) {
    const { competitiveData } = data;
    
    // Competitive Advantage Validation (25% weight)
    const competitorScore = Math.max(0, (15 - competitiveData.competitors) / 15); // Fewer competitors = higher score
    const shareScore = competitiveData.marketShare;
    const differentiationScore = competitiveData.differentiation;
    const barrierScore = competitiveData.barrierToEntry === 'low' ? 0.3 : 
                        competitiveData.barrierToEntry === 'medium' ? 0.6 : 0.9;
    
    const score = (competitorScore * 0.3 + shareScore * 0.25 + differentiationScore * 0.25 + barrierScore * 0.2) * 100;
    
    return {
      score: Math.round(score),
      details: {
        competitorDensity: {
          value: competitiveData.competitors,
          score: Math.round(competitorScore * 100),
          assessment: competitiveData.competitors < 5 ? 'Low' : competitiveData.competitors < 10 ? 'Medium' : 'High'
        },
        marketShare: {
          value: competitiveData.marketShare,
          score: Math.round(shareScore * 100),
          assessment: competitiveData.marketShare > 0.2 ? 'High' : competitiveData.marketShare > 0.1 ? 'Medium' : 'Low'
        },
        differentiation: {
          value: competitiveData.differentiation,
          score: Math.round(differentiationScore * 100),
          assessment: competitiveData.differentiation > 0.7 ? 'High' : competitiveData.differentiation > 0.4 ? 'Medium' : 'Low'
        },
        barrierToEntry: {
          value: competitiveData.barrierToEntry,
          score: Math.round(barrierScore * 100),
          assessment: competitiveData.barrierToEntry
        }
      }
    };
  }

  async validateTechnicalFeasibility(data) {
    const { technicalData } = data;
    
    // Technical Feasibility Validation (20% weight)
    const complexityScore = technicalData.complexity === 'low' ? 0.9 : 
                           technicalData.complexity === 'medium' ? 0.6 : 0.3;
    const resourceScore = technicalData.resources === 'abundant' ? 0.9 :
                         technicalData.resources === 'available' ? 0.6 : 0.3;
    const timelineScore = technicalData.timeline === '3-6 months' ? 0.9 :
                         technicalData.timeline === '6-12 months' ? 0.6 : 0.3;
    const feasibilityScore = technicalData.feasibilityScore;
    
    const score = (complexityScore * 0.3 + resourceScore * 0.25 + timelineScore * 0.25 + feasibilityScore * 0.2) * 100;
    
    return {
      score: Math.round(score),
      details: {
        complexity: {
          value: technicalData.complexity,
          score: Math.round(complexityScore * 100),
          assessment: technicalData.complexity
        },
        resourceAvailability: {
          value: technicalData.resources,
          score: Math.round(resourceScore * 100),
          assessment: technicalData.resources
        },
        timeToMarket: {
          value: technicalData.timeline,
          score: Math.round(timelineScore * 100),
          assessment: technicalData.timeline
        },
        technicalRisks: technicalData.risks
      }
    };
  }

  async validateFinancialViability(data) {
    const { financialData } = data;
    
    // Financial Viability Validation (25% weight)
    const investmentScore = Math.max(0, (1000000 - financialData.initialInvestment) / 1000000); // Lower investment = higher score
    const roiScore = Math.min(financialData.roi / 2, 1); // ROI scoring, capped at 200%
    const breakEvenScore = Math.max(0, (36 - financialData.breakEvenMonths) / 36); // Faster breakeven = higher score
    const revenueScore = Math.min(financialData.projectedRevenue[2] / 2000000, 1); // Revenue potential
    
    const score = (investmentScore * 0.25 + roiScore * 0.35 + breakEvenScore * 0.2 + revenueScore * 0.2) * 100;
    
    return {
      score: Math.round(score),
      details: {
        initialInvestment: {
          value: financialData.initialInvestment,
          score: Math.round(investmentScore * 100),
          assessment: financialData.initialInvestment < 100000 ? 'Low' : financialData.initialInvestment < 500000 ? 'Medium' : 'High'
        },
        roi: {
          value: financialData.roi,
          score: Math.round(roiScore * 100),
          assessment: financialData.roi > 1.5 ? 'High' : financialData.roi > 0.5 ? 'Medium' : 'Low'
        },
        breakEvenTime: {
          value: financialData.breakEvenMonths,
          score: Math.round(breakEvenScore * 100),
          assessment: financialData.breakEvenMonths < 12 ? 'Fast' : financialData.breakEvenMonths < 24 ? 'Medium' : 'Slow'
        },
        revenueProjection: {
          value: financialData.projectedRevenue,
          score: Math.round(revenueScore * 100),
          assessment: financialData.projectedRevenue[2] > 1000000 ? 'High' : financialData.projectedRevenue[2] > 500000 ? 'Medium' : 'Low'
        }
      }
    };
  }

  calculateOverallScore(marketDemand, competitiveAdvantage, technicalFeasibility, financialViability) {
    // Weighted scoring: Market (40%) + Competitive (25%) + Technical (20%) + Financial (25%)
    return Math.round(
      marketDemand.score * 0.3 +
      competitiveAdvantage.score * 0.25 +
      technicalFeasibility.score * 0.2 +
      financialViability.score * 0.25
    );
  }

  generateRecommendations(marketDemand, competitiveAdvantage, technicalFeasibility, financialViability) {
    const recommendations = [];
    
    if (marketDemand.score > 80) {
      recommendations.push('Strong market opportunity - proceed with confidence');
    } else if (marketDemand.score < 40) {
      recommendations.push('Market validation needed - consider pivot or niche focus');
    }
    
    if (competitiveAdvantage.score > 70) {
      recommendations.push('Good competitive positioning - leverage differentiation');
    } else if (competitiveAdvantage.score < 50) {
      recommendations.push('Strengthen competitive advantage before launch');
    }
    
    if (technicalFeasibility.score > 75) {
      recommendations.push('Technical implementation is feasible - proceed with development');
    } else if (technicalFeasibility.score < 50) {
      recommendations.push('Address technical challenges before proceeding');
    }
    
    if (financialViability.score > 70) {
      recommendations.push('Financially attractive - secure funding and launch');
    } else if (financialViability.score < 40) {
      recommendations.push('Financial model needs improvement');
    }
    
    return recommendations;
  }

  identifyRisks(marketDemand, competitiveAdvantage, technicalFeasibility, financialViability) {
    const risks = [];
    
    if (marketDemand.details.saturation.value > 0.7) {
      risks.push({ type: 'market', severity: 'high', description: 'Market saturation risk' });
    }
    
    if (competitiveAdvantage.details.competitorDensity.value > 10) {
      risks.push({ type: 'competitive', severity: 'medium', description: 'High competition risk' });
    }
    
    if (technicalFeasibility.details.complexity.value === 'high') {
      risks.push({ type: 'technical', severity: 'high', description: 'Technical complexity risk' });
    }
    
    if (financialViability.details.breakEvenTime.value > 24) {
      risks.push({ type: 'financial', severity: 'medium', description: 'Long payback period risk' });
    }
    
    return risks;
  }

  // Helper methods
  generateMarketTrends() {
    const trends = ['ai', 'automation', 'sustainability', 'remote-work', 'digitalization', 'health-tech', 'fintech'];
    return this.randomSample(trends, Math.floor(1 + Math.random() * 3));
  }

  generateTechnicalRisks() {
    const risks = ['scalability', 'security', 'integration', 'performance', 'maintenance'];
    return this.randomSample(risks, Math.floor(1 + Math.random() * 2));
  }

  generateRevenueProjection() {
    const year1 = Math.floor(50000 + Math.random() * 200000);
    const year2 = Math.floor(year1 * (2 + Math.random() * 3));
    const year3 = Math.floor(year2 * (1.5 + Math.random() * 2));
    return [year1, year2, year3];
  }

  assessMarketReadiness(marketDemand, competitiveAdvantage) {
    const combined = (marketDemand.score + competitiveAdvantage.score) / 2;
    return combined > 70 ? 'Ready' : combined > 50 ? 'Needs work' : 'Not ready';
  }

  assessImplementationComplexity(technicalFeasibility) {
    return technicalFeasibility.score > 70 ? 'Low' : technicalFeasibility.score > 50 ? 'Medium' : 'High';
  }

  generateFinancialProjection(financialViability) {
    return {
      confidence: financialViability.score > 70 ? 'High' : financialViability.score > 50 ? 'Medium' : 'Low',
      recommendedInvestment: financialViability.details.initialInvestment.value,
      expectedROI: financialViability.details.roi.value
    };
  }

  assessOverallRisk(risks) {
    const highRisks = risks.filter(r => r.severity === 'high').length;
    return highRisks > 1 ? 'High' : highRisks === 1 ? 'Medium' : 'Low';
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomSample(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

const validationService = new ValidationService();

// API Gateway handler
exports.apiHandler = async (event, context) => {
  logger.info('API request received', { 
    path: event.path, 
    method: event.httpMethod 
  });

  try {
    // Health check
    if (event.path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          service: 'market-validator',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: ['market-validation', 'competitive-analysis', 'financial-modeling', 'risk-assessment'],
          algorithms: ['multi-criteria-analysis', 'weighted-scoring'],
          account: context.invokedFunctionArn.split(':')[4]
        }),
      };
    }

    // Validate opportunity endpoint
    if (event.path === '/validate' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { opportunityId, validationType = 'comprehensive' } = body;

      if (!opportunityId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'opportunityId is required' }),
        };
      }

      const result = await validationService.performValidation(opportunityId, validationType);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    logger.error('API handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// Default handler
exports.handler = exports.apiHandler;