#!/usr/bin/env ts-node

import { 
  createDevelopmentOrchestrator,
  BusinessIdeaAnalysisInput,
  BusinessIdeaAnalysisOutput 
} from '../src/index';

async function demonstrateAgentSystem() {
  console.log('🚀 AI Business Factory - Agent System Demo\n');
  
  // Create orchestrator with mock providers for demo
  const orchestrator = createDevelopmentOrchestrator();
  
  // Check system health
  const health = orchestrator.getHealthStatus();
  console.log('📊 System Health:', health);
  console.log('');

  // Demo business idea
  const businessIdea: BusinessIdeaAnalysisInput = {
    idea: {
      title: 'AI-Powered Customer Support for Small Businesses',
      description: 'Intelligent chatbots that help small businesses provide 24/7 customer support without hiring additional staff. Uses advanced NLP to understand customer queries and provide accurate, personalized responses.',
      category: 'ai-automation',
      tier: 'public'
    },
    userContext: {
      skills: ['software engineering', 'product management'],
      experience: ['startup', 'saas'],
      budget: 50000,
      timeframe: '6-12 months'
    },
    analysisDepth: 'comprehensive',
    enabledAgents: {
      marketResearch: true,
      financialModeling: false, // Not implemented yet
      founderFit: false,        // Not implemented yet
      riskAssessment: false,    // Not implemented yet
    }
  };

  try {
    console.log('🔍 Analyzing business idea:', businessIdea.idea.title);
    console.log('📝 Description:', businessIdea.idea.description);
    console.log('🏷️  Category:', businessIdea.idea.category);
    console.log('📊 Analysis depth:', businessIdea.analysisDepth);
    console.log('');

    const startTime = Date.now();
    
    // Execute analysis
    const result: BusinessIdeaAnalysisOutput = await orchestrator.analyzeBusiness(businessIdea);
    
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Analysis completed in ${executionTime}ms\n`);
    
    // Display results
    console.log('📊 RESULTS SUMMARY');
    console.log('==================');
    console.log(`Success: ${result.success}`);
    console.log(`Request ID: ${result.requestId}`);
    console.log(`Overall Confidence: ${result.metadata.overallConfidence}%`);
    console.log(`Agents Executed: ${result.metadata.agentsExecuted.join(', ')}`);
    console.log(`Total Execution Time: ${result.metadata.totalExecutionTime}ms`);
    console.log('');

    // Quality metrics
    console.log('📈 QUALITY METRICS');
    console.log('==================');
    console.log(`Completeness: ${result.qualityMetrics.completeness}%`);
    console.log(`Consistency: ${result.qualityMetrics.consistency}%`);
    console.log(`Actionability: ${result.qualityMetrics.actionability}%`);
    console.log(`Reliability: ${result.qualityMetrics.reliability}%`);
    console.log('');

    // Market Research Results
    if (result.marketResearch?.success && result.marketResearch.data) {
      const mr = result.marketResearch.data;
      
      console.log('🔍 MARKET RESEARCH ANALYSIS');
      console.log('============================');
      
      // Problem Statement
      console.log('📋 Problem Statement:');
      console.log(`   ${mr.problemStatement.summary}`);
      console.log(`   📊 Impact: ${mr.problemStatement.quantifiedImpact}`);
      console.log(`   💸 Cost of Inaction: ${mr.problemStatement.costOfInaction}`);
      console.log('');

      // Market Signals
      console.log('📡 Market Signals:');
      mr.marketSignals.forEach((signal, i) => {
        console.log(`   ${i + 1}. [${signal.type.toUpperCase()}] ${signal.description}`);
        console.log(`      Strength: ${signal.strength} | Trend: ${signal.trend}`);
        if (signal.quantifiedImpact) {
          console.log(`      Impact: ${signal.quantifiedImpact}`);
        }
      });
      console.log('');

      // Customer Evidence
      console.log('👥 Customer Evidence:');
      mr.customerEvidence.forEach((evidence, i) => {
        console.log(`   ${i + 1}. ${evidence.customerProfile.industry} ${evidence.customerProfile.companySize} company`);
        console.log(`      Pain: "${evidence.painPoint.quote}"`);
        console.log(`      Impact: ${evidence.painPoint.quantifiedImpact}`);
        console.log(`      Willing to pay: ${evidence.willingnessToPay.amount} (${evidence.willingnessToPay.confidence} confidence)`);
        console.log(`      Credibility: ${evidence.credibilityScore}%`);
      });
      console.log('');

      // Competitors
      console.log('🏢 Competitive Analysis:');
      mr.competitorAnalysis.forEach((competitor, i) => {
        console.log(`   ${i + 1}. ${competitor.name} (${competitor.marketPosition})`);
        console.log(`      Funding: ${competitor.funding.totalRaised}`);
        console.log(`      Opportunity: ${competitor.differentiationOpportunity}`);
      });
      console.log('');

      // Market Timing
      console.log('⏰ Market Timing:');
      console.log(`   Assessment: ${mr.marketTiming.assessment.toUpperCase()}`);
      console.log(`   Reasoning: ${mr.marketTiming.reasoning}`);
      console.log(`   Catalysts:`);
      mr.marketTiming.catalysts.forEach(catalyst => {
        console.log(`   • ${catalyst}`);
      });
      console.log(`   Confidence: ${mr.marketTiming.confidence}%`);
      console.log('');

      // Agent Confidence Breakdown
      console.log('🎯 CONFIDENCE BREAKDOWN');
      console.log('=======================');
      console.log(`Problem Validation: ${mr.confidence.breakdown.problemValidation}%`);
      console.log(`Market Signals: ${mr.confidence.breakdown.marketSignals}%`);
      console.log(`Customer Evidence: ${mr.confidence.breakdown.customerEvidence}%`);
      console.log(`Competitor Analysis: ${mr.confidence.breakdown.competitorAnalysis}%`);
      console.log(`Market Timing: ${mr.confidence.breakdown.marketTiming}%`);
      console.log(`Overall: ${mr.confidence.overall}%`);
      console.log('');

      // Agent Performance Metrics
      console.log('⚡ AGENT PERFORMANCE');
      console.log('===================');
      const metrics = result.marketResearch.metadata.metrics;
      console.log(`Execution Time: ${metrics.executionTime}ms`);
      console.log(`Tokens Used: ${metrics.tokensUsed}`);
      console.log(`API Calls: ${metrics.apiCalls}`);
      console.log(`Cache Hits: ${metrics.cacheHits}`);
      console.log(`Cache Misses: ${metrics.cacheMisses}`);
      console.log(`Quality Score: ${metrics.qualityScore}%`);
    }

    if (result.marketResearch && !result.marketResearch.success) {
      console.log('❌ MARKET RESEARCH FAILED');
      console.log('=========================');
      console.log(`Error: ${result.marketResearch.error?.message}`);
    }

  } catch (error) {
    console.error('💥 Demo failed:', error);
  } finally {
    // Cleanup orchestrator
    await orchestrator.cleanup();
    console.log('\n🧹 Orchestrator cleaned up');
  }
}

// Self-executing demo
if (require.main === module) {
  demonstrateAgentSystem().catch(console.error);
}

export { demonstrateAgentSystem };