import React, { useState } from 'react';
import { aiAgentAPI, BusinessAnalysisRequest, BusinessAnalysisResponse } from '../lib/api';

export const LiveAITest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BusinessAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [businessIdea, setBusinessIdea] = useState(
    'A subscription-based meal planning app that uses AI to generate personalized recipes based on dietary restrictions, budget, and local ingredient availability'
  );

  const handleHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const health = await aiAgentAPI.healthCheck();
      setHealthStatus(health);
      console.log('✅ Health check successful:', health);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      console.error('❌ Health check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: BusinessAnalysisRequest = {
        businessIdea,
        metadata: {
          requestId: `live-test-${Date.now()}`,
          source: 'ideas-pwa-test',
          timestamp: new Date().toISOString()
        }
      };

      const analysis = await aiAgentAPI.analyzeBusinessIdea(request);
      setResult(analysis);
      console.log('✅ Analysis successful:', analysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      console.error('❌ Analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-dark-bg-secondary rounded-lg border border-dark-border-primary p-6">
        <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
          🤖 Live AI Agent System Test
        </h2>
        <p className="text-dark-text-secondary mb-6">
          Test the deployed AI Agent Orchestrator system with live AWS Lambda functions.
        </p>

        {/* Health Check Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-3">System Health Check</h3>
          <button
            onClick={handleHealthCheck}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Checking...' : 'Check System Health'}
          </button>

          {healthStatus && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-md">
              <div className="text-green-400 font-semibold">✅ System Healthy</div>
              <div className="text-dark-text-secondary mt-2">
                <div><strong>Version:</strong> {healthStatus.version}</div>
                <div><strong>Message:</strong> {healthStatus.message}</div>
                <div><strong>Capabilities:</strong></div>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {healthStatus.capabilities?.map((cap: string, index: number) => (
                    <li key={index}>{cap}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Business Analysis Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-3">Business Idea Analysis</h3>
          
          <div className="mb-4">
            <label htmlFor="businessIdea" className="block text-dark-text-secondary mb-2">
              Enter a business idea to analyze:
            </label>
            <textarea
              id="businessIdea"
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              className="w-full p-3 bg-dark-bg-tertiary border border-dark-border-primary rounded-md text-dark-text-primary focus:outline-none focus:border-blue-500 min-h-[100px]"
              placeholder="Describe your business idea..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !businessIdea.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Business Idea'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md">
            <div className="text-red-400 font-semibold">❌ Error</div>
            <div className="text-dark-text-secondary mt-2">{error}</div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mb-6 p-4 bg-dark-bg-tertiary border border-dark-border-primary rounded-md">
            <h4 className="text-lg font-semibold text-dark-text-primary mb-3">
              📊 Analysis Results
            </h4>
            
            <div className="space-y-3 text-dark-text-secondary">
              <div>
                <strong className="text-dark-text-primary">Status:</strong> {result.status}
              </div>
              <div>
                <strong className="text-dark-text-primary">Request ID:</strong> {result.requestId}
              </div>
              <div>
                <strong className="text-dark-text-primary">Message:</strong> {result.message}
              </div>
              
              {result.nextSteps && result.nextSteps.length > 0 && (
                <div>
                  <strong className="text-dark-text-primary">Next Steps:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {result.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <strong className="text-dark-text-primary">Execution Time:</strong> {result.metadata.executionTime}ms
              </div>
              <div>
                <strong className="text-dark-text-primary">Agents Status:</strong> {result.metadata.agentsStatus}
              </div>
              <div>
                <strong className="text-dark-text-primary">Version:</strong> {result.metadata.version}
              </div>
              <div>
                <strong className="text-dark-text-primary">Timestamp:</strong> {new Date(result.metadata.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Raw JSON Display */}
            <details className="mt-4">
              <summary className="text-dark-text-primary cursor-pointer hover:text-blue-400">
                View Raw Response
              </summary>
              <pre className="mt-2 p-3 bg-dark-bg-primary rounded text-xs overflow-auto text-dark-text-secondary">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* API Information */}
        <div className="text-sm text-dark-text-tertiary">
          <div><strong>API Endpoint:</strong> https://bmh6tskmv4.execute-api.us-east-1.amazonaws.com/prod/ai-agents</div>
          <div><strong>Lambda Function:</strong> ai-business-factory-ai-agent-orchestrator</div>
          <div><strong>Environment:</strong> AWS US-East-1 Production</div>
        </div>
      </div>
    </div>
  );
};