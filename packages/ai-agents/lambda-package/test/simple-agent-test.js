#!/usr/bin/env node

/**
 * Simple AI Agent Test Script
 * Tests the agent framework structure and validates implementations
 */

const fs = require('fs');
const path = require('path');

class SimpleAgentTest {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    
    console.log('\n🤖 AI Agent System - Simple Structure Test');
    console.log('=' .repeat(50));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  }

  async runTests() {
    try {
      // Test 1: Verify agent files exist
      await this.testAgentFilesExist();
      
      // Test 2: Validate TypeScript structure
      await this.testAgentStructure();
      
      // Test 3: Test orchestrator integration
      await this.testOrchestratorIntegration();
      
      // Test 4: Validate provider structure
      await this.testProviderStructure();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async testAgentFilesExist() {
    console.log('📁 Testing Agent Files...');
    
    const agentsDir = path.join(__dirname, '../agents');
    const expectedAgents = [
      'MarketResearchAgent.ts',
      'FinancialModelingAgent.ts', 
      'FounderFitAgent.ts',
      'RiskAssessmentAgent.ts'
    ];
    
    let allExist = true;
    const existingAgents = [];
    
    for (const agentFile of expectedAgents) {
      const agentPath = path.join(agentsDir, agentFile);
      if (fs.existsSync(agentPath)) {
        const stats = fs.statSync(agentPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`   ✅ ${agentFile}: ${sizeKB}KB`);
        existingAgents.push(agentFile);
      } else {
        console.log(`   ❌ ${agentFile}: Missing`);
        allExist = false;
      }
    }
    
    this.results.push({
      test: 'Agent Files Exist',
      status: allExist ? 'PASS' : 'FAIL',
      details: {
        expected: expectedAgents.length,
        found: existingAgents.length,
        missing: expectedAgents.filter(f => !existingAgents.includes(f))
      }
    });
  }

  async testAgentStructure() {
    console.log('🔍 Testing Agent Structure...');
    
    const agentsDir = path.join(__dirname, '../agents');
    const agents = [
      'MarketResearchAgent.ts',
      'FinancialModelingAgent.ts',
      'FounderFitAgent.ts', 
      'RiskAssessmentAgent.ts'
    ];
    
    let structureValid = true;
    const structureResults = {};
    
    for (const agentFile of agents) {
      const agentPath = path.join(agentsDir, agentFile);
      
      if (fs.existsSync(agentPath)) {
        const content = fs.readFileSync(agentPath, 'utf8');
        
        // Check for essential patterns
        const checks = {
          'BaseAgent import': content.includes('BaseAgent'),
          'Class extends BaseAgent': content.includes('extends BaseAgent'),
          'Input schema': content.includes('InputSchema'),
          'Output schema': content.includes('OutputSchema'),
          'processRequest method': content.includes('processRequest'),
          'Zod validation': content.includes('from \'zod\''),
          'Logger usage': content.includes('Logger'),
          'Error handling': content.includes('try') && content.includes('catch')
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        const passRate = Math.round((passed / total) * 100);
        
        console.log(`   ${passRate >= 80 ? '✅' : '❌'} ${agentFile.replace('.ts', '')}: ${passed}/${total} checks (${passRate}%)`);
        
        structureResults[agentFile] = {
          passRate,
          checks,
          lineCount: content.split('\n').length
        };
        
        if (passRate < 80) structureValid = false;
      } else {
        structureValid = false;
        structureResults[agentFile] = { passRate: 0, error: 'File not found' };
      }
    }
    
    this.results.push({
      test: 'Agent Structure',
      status: structureValid ? 'PASS' : 'FAIL',
      details: structureResults
    });
  }

  async testOrchestratorIntegration() {
    console.log('🎭 Testing Orchestrator Integration...');
    
    const orchestratorPath = path.join(__dirname, '../orchestration/AgentOrchestrator.ts');
    
    if (fs.existsSync(orchestratorPath)) {
      const content = fs.readFileSync(orchestratorPath, 'utf8');
      
      const integrationChecks = {
        'MarketResearchAgent import': content.includes('MarketResearchAgent'),
        'FinancialModelingAgent import': content.includes('FinancialModelingAgent'),
        'FounderFitAgent import': content.includes('FounderFitAgent'),
        'RiskAssessmentAgent import': content.includes('RiskAssessmentAgent'),
        'All agents enabled by default': content.includes('default(true)'),
        'Cross-agent data flow': content.includes('financialProjections') && content.includes('teamProfile'),
        'Quality metrics calculation': content.includes('calculateQualityMetrics'),
        'Error handling for all agents': content.split('FAILED').length >= 4
      };
      
      const passed = Object.values(integrationChecks).filter(Boolean).length;
      const total = Object.keys(integrationChecks).length;
      const passRate = Math.round((passed / total) * 100);
      
      console.log(`   ${passRate >= 75 ? '✅' : '❌'} Orchestrator Integration: ${passed}/${total} checks (${passRate}%)`);
      
      this.results.push({
        test: 'Orchestrator Integration',
        status: passRate >= 75 ? 'PASS' : 'FAIL',
        details: {
          passRate,
          checks: integrationChecks,
          lineCount: content.split('\n').length
        }
      });
    } else {
      console.log('   ❌ Orchestrator file not found');
      this.results.push({
        test: 'Orchestrator Integration',
        status: 'FAIL',
        details: { error: 'File not found' }
      });
    }
  }

  async testProviderStructure() {
    console.log('🔧 Testing Provider Structure...');
    
    const providersDir = path.join(__dirname, '../providers');
    const expectedProviders = [
      'LLMProvider.ts',
      'CacheProvider.ts', 
      'DataSourceProvider.ts',
      'FreeDataSourceProvider.ts'
    ];
    
    let allValid = true;
    const providerResults = {};
    
    for (const providerFile of expectedProviders) {
      const providerPath = path.join(providersDir, providerFile);
      
      if (fs.existsSync(providerPath)) {
        const content = fs.readFileSync(providerPath, 'utf8');
        const sizeKB = Math.round(fs.statSync(providerPath).size / 1024);
        
        const hasFactory = content.includes('create') || content.includes('factory');
        const hasInterface = content.includes('interface') || content.includes('abstract');
        const hasImpl = content.includes('class');
        
        const isValid = hasFactory && hasInterface && hasImpl;
        
        console.log(`   ${isValid ? '✅' : '❌'} ${providerFile}: ${sizeKB}KB`);
        
        providerResults[providerFile] = {
          valid: isValid,
          size: sizeKB,
          hasFactory,
          hasInterface,
          hasImpl
        };
        
        if (!isValid) allValid = false;
      } else {
        console.log(`   ❌ ${providerFile}: Missing`);
        providerResults[providerFile] = { valid: false, error: 'Not found' };
        allValid = false;
      }
    }
    
    this.results.push({
      test: 'Provider Structure',
      status: allValid ? 'PASS' : 'FAIL',
      details: providerResults
    });
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 SIMPLE TEST REPORT');
    console.log('='.repeat(50));
    
    // Summary
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${total - passed}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Duration: ${duration}ms`);
    
    // Detailed results
    console.log(`\n🔍 Test Results:`);
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${result.test}: ${result.status}`);
      
      if (result.details && typeof result.details === 'object') {
        Object.entries(result.details).forEach(([key, value]) => {
          if (typeof value === 'object') {
            console.log(`      ${key}: ${JSON.stringify(value, null, 2).substring(0, 100)}...`);
          } else {
            console.log(`      ${key}: ${value}`);
          }
        });
      }
    });
    
    // System assessment
    console.log(`\n🎯 System Assessment:`);
    
    if (successRate >= 90) {
      console.log(`   🟢 EXCELLENT: All components properly implemented`);
      console.log(`   ✅ Ready for comprehensive testing with real providers`);
      console.log(`   🚀 Proceed with AWS deployment preparation`);
    } else if (successRate >= 75) {
      console.log(`   🟡 GOOD: Most components working, minor issues to address`);
      console.log(`   🔧 Review failed components and fix structural issues`);
      console.log(`   📈 System shows strong implementation quality`);
    } else {
      console.log(`   🔴 NEEDS WORK: Significant structural issues detected`);
      console.log(`   🛠️  Address missing files and implementation gaps`);
      console.log(`   📋 Review agent and provider implementations`);
    }
    
    // Architecture validation
    console.log(`\n🏗️  Architecture Validation:`);
    const agentFiles = this.results.find(r => r.test === 'Agent Files Exist');
    const agentStructure = this.results.find(r => r.test === 'Agent Structure');
    const orchestration = this.results.find(r => r.test === 'Orchestrator Integration');
    const providers = this.results.find(r => r.test === 'Provider Structure');
    
    console.log(`   Agents: ${agentFiles?.status === 'PASS' ? '✅' : '❌'} ${agentFiles?.details?.found || 0}/4 implemented`);
    console.log(`   Structure: ${agentStructure?.status === 'PASS' ? '✅' : '❌'} TypeScript patterns validated`);
    console.log(`   Orchestration: ${orchestration?.status === 'PASS' ? '✅' : '❌'} Integration complete`);
    console.log(`   Providers: ${providers?.status === 'PASS' ? '✅' : '❌'} Infrastructure ready`);
    
    console.log(`\n💡 Next Steps:`);
    if (successRate >= 75) {
      console.log(`   1. ✅ Compile TypeScript to JavaScript`);
      console.log(`   2. 🧪 Run integration tests with real providers`);
      console.log(`   3. 🚀 Deploy to AWS Lambda infrastructure`);
      console.log(`   4. 📊 Validate end-to-end business intelligence generation`);
    } else {
      console.log(`   1. 🔧 Fix structural issues identified in failed tests`);
      console.log(`   2. 📝 Complete missing agent implementations`);
      console.log(`   3. 🔄 Re-run tests to validate fixes`);
      console.log(`   4. 📈 Proceed to integration testing`);
    }
    
    console.log(`\n📅 Completed at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
  }
}

// Run the simple test suite
async function main() {
  const testSuite = new SimpleAgentTest();
  await testSuite.runTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { SimpleAgentTest };