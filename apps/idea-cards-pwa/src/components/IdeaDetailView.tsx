import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { DetailedIdea, MarketSignal, CustomerEvidence } from '../types/detailedIdea';

interface IdeaDetailViewProps {
  idea: DetailedIdea;
  onBack: () => void;
  onSave?: (ideaId: string) => void;
  onShare?: (ideaId: string) => void;
}

type TabType = 'overview' | 'market' | 'financial' | 'team' | 'strategy' | 'risks';

export const IdeaDetailView: React.FC<IdeaDetailViewProps> = ({
  idea,
  onBack,
  onSave,
  onShare
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const getTierIcon = () => {
    switch (idea.tier) {
      case 'exclusive': return '👑';
      case 'ai-generated': return '✨';
      default: return '🚀';
    }
  };

  const getTierColor = () => {
    switch (idea.tier) {
      case 'exclusive': return isDark ? 'dark-exclusive-primary' : 'text-purple-600';
      case 'ai-generated': return isDark ? 'dark-ai-primary' : 'text-amber-600';
      default: return isDark ? 'dark-public-primary' : 'text-blue-600';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return isDark ? 'text-green-400' : 'text-green-600';
    if (score >= 60) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const formatCurrency = (amount: number | undefined | null | any) => {
    // Handle undefined, null, objects, or non-numeric values
    if (amount === undefined || amount === null || typeof amount === 'object' || isNaN(Number(amount))) {
      return '$0';
    }
    
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return '$0';
    }
    
    if (numAmount >= 1000000000) return `$${(numAmount / 1000000000).toFixed(1)}B`;
    if (numAmount >= 1000000) return `$${(numAmount / 1000000).toFixed(1)}M`;
    if (numAmount >= 1000) return `$${(numAmount / 1000).toFixed(0)}K`;
    return `$${numAmount}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'market', label: 'Market Analysis', icon: '🔍' },
    { id: 'financial', label: 'Financial Model', icon: '💰' },
    { id: 'team', label: 'Team & Costs', icon: '👥' },
    { id: 'strategy', label: 'Go-to-Market', icon: '🚀' },
    { id: 'risks', label: 'Risk Assessment', icon: '⚠️' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'dark-bg-primary' : 'bg-white'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'dark-btn-secondary dark-hover dark-focus-visible' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500'
                }`}
                aria-label="Close detail view"
              >
                <i className="fas fa-arrow-left text-sm"></i>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-2xl" role="img" aria-label="Idea type">
                  {getTierIcon()}
                </span>
                <div>
                  <h1 className={`text-lg font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {idea.title}
                  </h1>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Updated {new Date(idea.dataFreshness.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-100'
              }`}>
                <span className={`transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Confidence:
                </span>
                <span className={`font-bold ${getConfidenceColor(idea.confidence.overall)}`}>
                  {idea.confidence.overall}%
                </span>
              </div>
              
              {onSave && (
                <button
                  onClick={() => onSave(idea.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDark 
                      ? 'dark-btn-secondary dark-hover dark-focus-visible' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <i className="fas fa-bookmark mr-2"></i>Save
                </button>
              )}
              
              {onShare && (
                <button
                  onClick={() => onShare(idea.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDark 
                      ? 'dark-btn-primary dark-focus-visible' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <i className="fas fa-share mr-2"></i>Share
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={`border-b transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? `border-blue-500 ${isDark ? 'dark-public-primary' : 'text-blue-600'}`
                    : `border-transparent ${
                        isDark ? 'dark-text-tertiary hover:dark-text-secondary' : 'text-gray-500 hover:text-gray-700'
                      }`
                }`}
              >
                <span role="img" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {activeTab === 'overview' && (
          <OverviewTab idea={idea} isDark={isDark} formatCurrency={formatCurrency} />
        )}
        {activeTab === 'market' && (
          <MarketAnalysisTab idea={idea} isDark={isDark} />
        )}
        {activeTab === 'financial' && (
          <FinancialModelTab idea={idea} isDark={isDark} formatCurrency={formatCurrency} />
        )}
        {activeTab === 'team' && (
          <TeamCostsTab idea={idea} isDark={isDark} formatCurrency={formatCurrency} />
        )}
        {activeTab === 'strategy' && (
          <StrategyTab idea={idea} isDark={isDark} />
        )}
        {activeTab === 'risks' && (
          <RiskAssessmentTab idea={idea} isDark={isDark} />
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  idea: DetailedIdea;
  isDark: boolean;
  formatCurrency: (amount: any) => string;
}> = ({ idea, isDark, formatCurrency }) => {
  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Market Size"
          value={formatCurrency(idea.marketSizing.tam.value * 1000000)}
          subtitle="Total Addressable"
          icon="🌍"
          isDark={isDark}
        />
        <MetricCard
          title="Time to Market"
          value="6-12 months"
          subtitle="Estimated launch"
          icon="⏱️"
          isDark={isDark}
        />
        <MetricCard
          title="Initial Investment"
          value={formatCurrency(idea.founderFit.investmentNeeds.seedFunding.amount)}
          subtitle="Seed funding"
          icon="💰"
          isDark={isDark}
        />
        <MetricCard
          title="Success Probability"
          value="72%"
          subtitle="Based on analysis"
          icon="🎯"
          isDark={isDark}
        />
      </div>

      {/* Problem Statement */}
      <div className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Problem Statement
        </h3>
        <p className={`text-sm leading-relaxed transition-colors duration-200 ${
          isDark ? 'dark-text-secondary' : 'text-gray-600'
        }`}>
          {idea.marketAnalysis.problemStatement.summary}
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Quantified Impact
            </h4>
            <p className={`text-xs transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              {idea.marketAnalysis.problemStatement.quantifiedImpact}
            </p>
          </div>
          <div>
            <h4 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Current Solutions
            </h4>
            <ul className={`text-xs space-y-1 transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              {idea.marketAnalysis.problemStatement.currentSolutions.map((solution, idx) => (
                <li key={idx}>• {solution}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Cost of Inaction
            </h4>
            <p className={`text-xs transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              {idea.marketAnalysis.problemStatement.costOfInaction}
            </p>
          </div>
        </div>
      </div>

      {/* Top Market Signals */}
      <div className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          📈 Key Market Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {idea.marketAnalysis.marketSignals.slice(0, 4).map((signal, idx) => (
            <div key={idx} className={`p-4 rounded-lg transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium capitalize transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {signal.type.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  signal.strength === 'strong' 
                    ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    : signal.strength === 'moderate'
                    ? isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {signal.strength}
                </span>
              </div>
              <p className={`text-xs transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {signal.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  isDark: boolean;
}> = ({ title, value, subtitle, icon, isDark }) => (
  <div className={`p-6 rounded-lg border transition-colors duration-200 ${
    isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
  }`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
      <span className={`text-xs transition-colors duration-200 ${
        isDark ? 'dark-text-tertiary' : 'text-gray-500'
      }`}>
        {subtitle}
      </span>
    </div>
    <div className={`text-2xl font-bold mb-1 transition-colors duration-200 ${
      isDark ? 'dark-text-primary' : 'text-gray-900'
    }`}>
      {value}
    </div>
    <div className={`text-sm font-medium transition-colors duration-200 ${
      isDark ? 'dark-text-secondary' : 'text-gray-600'
    }`}>
      {title}
    </div>
  </div>
);

// Market Analysis Tab with detailed insights
const MarketAnalysisTab: React.FC<{idea: DetailedIdea; isDark: boolean}> = ({ idea, isDark }) => {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  const getSignalIcon = (type: string) => {
    const icons = {
      search_trend: '📈',
      social_sentiment: '💬',
      funding_activity: '💰',
      regulatory: '⚖️',
      technology: '🔬'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getStrengthColor = (strength: string) => {
    if (strength === 'strong') return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
    if (strength === 'moderate') return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-800 bg-yellow-100';
    return isDark ? 'text-gray-400 bg-gray-800/20' : 'text-gray-600 bg-gray-100';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'growing') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  return (
    <div className="space-y-8">
      {/* Problem Statement Section */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Problem Statement & Impact
        </h2>
        
        <div className={`p-4 rounded-lg mb-6 transition-colors duration-200 ${
          isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
        }`}>
          <p className={`text-base leading-relaxed transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-800'
          }`}>
            {idea.marketAnalysis.problemStatement.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`p-4 rounded-lg border transition-colors duration-200 ${
            isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold text-sm mb-3 text-amber-600 flex items-center`}>
              📊 Quantified Impact
            </h4>
            <p className={`text-sm leading-relaxed transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              {idea.marketAnalysis.problemStatement.quantifiedImpact}
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors duration-200 ${
            isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold text-sm mb-3 text-blue-600 flex items-center`}>
              🔧 Current Solutions
            </h4>
            <ul className={`text-sm space-y-2 transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              {idea.marketAnalysis.problemStatement.currentSolutions.map((solution, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {solution}
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-4 rounded-lg border transition-colors duration-200 ${
            isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold text-sm mb-3 text-red-600 flex items-center`}>
              ⚠️ Cost of Inaction
            </h4>
            <p className={`text-sm leading-relaxed transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              {idea.marketAnalysis.problemStatement.costOfInaction}
            </p>
          </div>
        </div>
      </section>

      {/* Market Signals Section */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          📈 Market Signals & Trends
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {idea.marketAnalysis.marketSignals.map((signal, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                expandedSignal === signal.type 
                  ? isDark ? 'dark-bg-primary dark-border-secondary ring-2 ring-blue-500' : 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                  : isDark ? 'dark-bg-tertiary dark-border-primary hover:dark-bg-primary' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}
              onClick={() => setExpandedSignal(expandedSignal === signal.type ? null : signal.type)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getSignalIcon(signal.type)}</span>
                  <span className={`font-medium capitalize transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {signal.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStrengthColor(signal.strength)}`}>
                    {signal.strength}
                  </span>
                  <span className="text-sm" title={`Trend: ${signal.trend}`}>
                    {getTrendIcon(signal.trend)}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm mb-3 transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {signal.description}
              </p>
              
              {expandedSignal === signal.type && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  {signal.quantifiedImpact && (
                    <div>
                      <span className={`text-xs font-medium transition-colors duration-200 ${
                        isDark ? 'dark-text-tertiary' : 'text-gray-500'
                      }`}>
                        Impact:
                      </span>
                      <p className={`text-sm transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {signal.quantifiedImpact}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className={`text-xs font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      Source:
                    </span>
                    <p className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {signal.source} • {new Date(signal.dateObserved).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Customer Evidence Section */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          👥 Customer Evidence & Validation
        </h2>
        
        <div className="space-y-4">
          {idea.marketAnalysis.customerEvidence.map((customer, idx) => (
            <div
              key={customer.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                expandedCustomer === customer.id 
                  ? isDark ? 'dark-bg-primary dark-border-secondary' : 'bg-blue-50 border-blue-200'
                  : isDark ? 'dark-bg-tertiary dark-border-primary hover:dark-bg-primary' : 'bg-gray-50 border-gray-200 hover:bg-white'
              }`}
              onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium transition-colors duration-200 ${
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.customerProfile.industry}
                    </span>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {customer.customerProfile.companySize} • {customer.customerProfile.role}
                    </span>
                  </div>
                  <blockquote className={`text-sm italic border-l-2 pl-3 transition-colors duration-200 ${
                    isDark ? 'border-blue-500 dark-text-primary' : 'border-blue-300 text-gray-800'
                  }`}>
                    "{customer.quote}"
                  </blockquote>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    customer.willingnessToPay.confidence === 'high' 
                      ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      : customer.willingnessToPay.confidence === 'medium'
                      ? isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.willingnessToPay.amount}
                  </span>
                  <span className={`text-xs transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Score: {customer.credibilityScore}/10
                  </span>
                </div>
              </div>
              
              {expandedCustomer === customer.id && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <h5 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      Pain Point
                    </h5>
                    <p className={`text-xs transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {customer.painPoint}
                    </p>
                  </div>
                  <div>
                    <h5 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      Current Solution
                    </h5>
                    <p className={`text-xs transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {customer.currentSolution}
                    </p>
                  </div>
                  <div>
                    <h5 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      Cost of Problem
                    </h5>
                    <div className={`text-xs space-y-1 transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      <p><span className="font-medium">Time:</span> {customer.costOfProblem.timeWasted}</p>
                      <p><span className="font-medium">Money:</span> {customer.costOfProblem.moneyLost}</p>
                      <p><span className="font-medium">Opportunity:</span> {customer.costOfProblem.opportunityCost}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Market Timing Assessment */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          ⏰ Market Timing Assessment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-200 ${
                idea.marketAnalysis.marketTiming.assessment === 'perfect' 
                  ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                  : idea.marketAnalysis.marketTiming.assessment === 'getting-late'
                  ? isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                  : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {idea.marketAnalysis.marketTiming.assessment.toUpperCase()}
              </span>
            </div>
            <p className={`text-sm leading-relaxed transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              {idea.marketAnalysis.marketTiming.reasoning}
            </p>
          </div>
          
          <div>
            <h4 className={`font-semibold text-sm mb-3 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Key Market Catalysts
            </h4>
            <ul className={`text-sm space-y-2 transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              {idea.marketAnalysis.marketTiming.catalysts.map((catalyst, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {catalyst}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

const FinancialModelTab: React.FC<{idea: DetailedIdea; isDark: boolean; formatCurrency: (n: any) => string}> = ({ idea, isDark, formatCurrency }) => {
  const [selectedProjection, setSelectedProjection] = useState<number>(0);
  
  const getGrowthColor = (value: number) => {
    if (value >= 15) return isDark ? 'text-green-400' : 'text-green-600';
    if (value >= 8) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
    if (confidence === 'medium') return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-800 bg-yellow-100';
    return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-100';
  };

  const calculateNetRevenue = (projection: any) => {
    const totalCosts = projection.metrics.costs.development + 
                      projection.metrics.costs.marketing + 
                      projection.metrics.costs.operations + 
                      projection.metrics.costs.infrastructure;
    return projection.metrics.revenue.total - totalCosts;
  };

  const calculateCAC = (projection: any) => {
    return Math.round(projection.metrics.costs.marketing / projection.metrics.customers.count);
  };

  return (
    <div className="space-y-8">
      {/* Market Sizing Overview */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🌍 Market Size & Opportunity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`text-center p-6 rounded-lg transition-colors duration-200 ${
            isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
          }`}>
            <div className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              {formatCurrency(idea.marketSizing.tam.value * (idea.marketSizing.tam.unit === 'billion' ? 1000000000 : 1000000))}
            </div>
            <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              Total Addressable Market
            </div>
            <div className={`text-xs flex items-center justify-center space-x-2 transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              <span className={`px-2 py-1 rounded-full ${getConfidenceColor(idea.marketSizing.tam.confidence)}`}>
                {idea.marketSizing.tam.confidence} confidence
              </span>
              <span className={getGrowthColor(idea.marketSizing.tam.growthRate)}>
                {idea.marketSizing.tam.growthRate}% growth
              </span>
            </div>
          </div>

          <div className={`text-center p-6 rounded-lg transition-colors duration-200 ${
            isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
          }`}>
            <div className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              {formatCurrency(idea.marketSizing.sam.value * (idea.marketSizing.sam.unit === 'billion' ? 1000000000 : 1000000))}
            </div>
            <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              Serviceable Addressable Market
            </div>
            <div className={`text-xs flex items-center justify-center space-x-2 transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              <span className={`px-2 py-1 rounded-full ${getConfidenceColor(idea.marketSizing.sam.confidence)}`}>
                {idea.marketSizing.sam.confidence} confidence
              </span>
              <span className={getGrowthColor(idea.marketSizing.sam.growthRate)}>
                {idea.marketSizing.sam.growthRate}% growth
              </span>
            </div>
          </div>

          <div className={`text-center p-6 rounded-lg transition-colors duration-200 ${
            isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
          }`}>
            <div className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              {formatCurrency(idea.marketSizing.som.value * (idea.marketSizing.som.unit === 'billion' ? 1000000000 : 1000000))}
            </div>
            <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              Serviceable Obtainable Market
            </div>
            <div className={`text-xs flex items-center justify-center space-x-2 transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              <span className={`px-2 py-1 rounded-full ${getConfidenceColor(idea.marketSizing.som.confidence)}`}>
                {idea.marketSizing.som.confidence} confidence
              </span>
              <span className={getGrowthColor(idea.marketSizing.som.growthRate)}>
                {idea.marketSizing.som.growthRate}% growth
              </span>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg transition-colors duration-200 ${
          isDark ? 'dark-bg-primary' : 'bg-blue-50'
        }`}>
          <h4 className={`font-semibold text-sm mb-2 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Market Assumptions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isDark ? 'dark-text-tertiary' : 'text-gray-500'
              }`}>
                Market Growth Rate:
              </span>
              <span className={`ml-2 text-sm font-semibold ${getGrowthColor(idea.marketSizing.assumptions.marketGrowth)}`}>
                {idea.marketSizing.assumptions.marketGrowth}% annually
              </span>
            </div>
            <div>
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isDark ? 'dark-text-tertiary' : 'text-gray-500'
              }`}>
                Target Penetration:
              </span>
              <span className={`ml-2 text-sm font-semibold transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-700'
              }`}>
                {(idea.marketSizing.assumptions.penetrationRate * 100).toFixed(3)}%
              </span>
            </div>
            <div className="md:col-span-2">
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isDark ? 'dark-text-tertiary' : 'text-gray-500'
              }`}>
                Competitive Response:
              </span>
              <span className={`ml-2 text-sm transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-700'
              }`}>
                {idea.marketSizing.assumptions.competitiveResponse}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quarterly Projections */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          📊 Financial Projections (Year 1)
        </h2>

        {/* Quarter Selection */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {idea.marketSizing.projections.map((projection, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedProjection(idx)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedProjection === idx
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : isDark ? 'dark-btn-secondary dark-hover' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {projection.quarter} {projection.year}
            </button>
          ))}
        </div>

        {/* Selected Quarter Details */}
        {idea.marketSizing.projections[selectedProjection] && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg text-center transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold mb-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {idea.marketSizing.projections[selectedProjection].metrics.customers.count}
                </div>
                <div className={`text-sm font-medium transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Customers
                </div>
              </div>

              <div className={`p-4 rounded-lg text-center transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold mb-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.revenue.total)}
                </div>
                <div className={`text-sm font-medium transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Total Revenue
                </div>
              </div>

              <div className={`p-4 rounded-lg text-center transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  calculateNetRevenue(idea.marketSizing.projections[selectedProjection]) >= 0 
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  {formatCurrency(calculateNetRevenue(idea.marketSizing.projections[selectedProjection]))}
                </div>
                <div className={`text-sm font-medium transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Net Revenue
                </div>
              </div>

              <div className={`p-4 rounded-lg text-center transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold mb-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {formatCurrency(calculateCAC(idea.marketSizing.projections[selectedProjection]))}
                </div>
                <div className={`text-sm font-medium transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Customer CAC
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  💰 Revenue Breakdown
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Recurring Revenue:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.revenue.recurring)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      One-time Revenue:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.revenue.oneTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  💸 Cost Breakdown
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Development:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.costs.development)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Marketing:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.costs.marketing)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Operations:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.costs.operations)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Infrastructure:
                    </span>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.marketSizing.projections[selectedProjection].metrics.costs.infrastructure)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones & Assumptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-green-600 flex items-center`}>
                  🎯 Key Milestones
                </h4>
                <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {idea.marketSizing.projections[selectedProjection].metrics.milestones.map((milestone, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-blue-600 flex items-center`}>
                  📋 Key Assumptions
                </h4>
                <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {idea.marketSizing.projections[selectedProjection].assumptions.map((assumption, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risk Factors */}
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
            }`}>
              <h4 className={`font-semibold text-sm mb-3 text-amber-600 flex items-center`}>
                ⚠️ Risk Factors for {idea.marketSizing.projections[selectedProjection].quarter}
              </h4>
              <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {idea.marketSizing.projections[selectedProjection].risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-amber-500 mr-2">▲</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const TeamCostsTab: React.FC<{idea: DetailedIdea; isDark: boolean; formatCurrency: (n: any) => string}> = ({ idea, isDark, formatCurrency }) => {
  const [selectedCostCategory, setSelectedCostCategory] = useState<'development' | 'operations' | 'aiInference'>('development');
  
  const getImportanceColor = (importance: string) => {
    if (importance === 'critical') return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-800 bg-red-100';
    if (importance === 'important') return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-800 bg-yellow-100';
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-100';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technical: isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-800 bg-blue-100',
      business: isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100',
      domain: isDark ? 'text-purple-400 bg-purple-900/20' : 'text-purple-800 bg-purple-100'
    };
    return colors[category as keyof typeof colors] || colors.technical;
  };

  const getExperienceIcon = (type: string) => {
    const icons = {
      startup: '🚀',
      industry: '🏭',
      functional: '⚙️',
      network: '🔗'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  return (
    <div className="space-y-8">
      {/* Required Skills & Experience */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Founder Skills & Experience Requirements
        </h2>

        {/* Skills Grid */}
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Required Skills
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(idea.founderFit?.requiredSkills || []).map((skill, idx) => (
              <div key={idx} className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(skill?.category || 'technical')}`}>
                    {skill?.category || 'N/A'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImportanceColor(skill?.importance || 'nice-to-have')}`}>
                    {skill?.importance || 'N/A'}
                  </span>
                </div>
                <h4 className={`font-semibold text-sm mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {skill?.name || 'N/A'}
                </h4>
                <p className={`text-xs mb-3 leading-relaxed transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {skill?.description || 'No description available'}
                </p>
                <div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Alternatives:
                  </span>
                  <ul className={`text-xs mt-1 space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    {(skill?.alternatives || []).map((alt, altIdx) => (
                      <li key={altIdx} className="flex items-start">
                        <span className="text-gray-400 mr-1">•</span>
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Requirements */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Experience Requirements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(idea.founderFit?.experienceNeeds || []).map((exp, idx) => (
              <div key={idx} className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getExperienceIcon(exp?.type || 'startup')}</span>
                    <span className={`font-medium capitalize transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {exp?.type || 'N/A'} Experience
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImportanceColor(exp?.importance || 'nice-to-have')}`}>
                    {exp?.importance || 'N/A'}
                  </span>
                </div>
                <p className={`text-sm mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {exp?.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Required: {exp?.timeRequired || 'N/A'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Substitutes:
                  </span>
                  <ul className={`text-xs mt-1 space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    {(exp?.substitutesWith || []).map((sub, subIdx) => (
                      <li key={subIdx} className="flex items-start">
                        <span className="text-gray-400 mr-1">•</span>
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Structure Analysis */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          💰 Cost Structure & Investment Analysis
        </h2>

        {/* Cost Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'development', label: 'Development Costs', icon: '💻' },
            { key: 'operations', label: 'Operations', icon: '🏢' },
            { key: 'aiInference', label: 'AI Inference', icon: '🤖' }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCostCategory(category.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCostCategory === category.key
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : isDark ? 'dark-btn-secondary dark-hover' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Development Costs */}
        {selectedCostCategory === 'development' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-blue-600`}>
                  🚀 Initial Development (Months 1-6)
                </h4>
                <div className={`text-2xl font-bold mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  {formatCurrency(idea.founderFit?.costStructure?.development?.initial)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Personnel:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.development?.breakdown?.personnel)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Technology:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.development?.breakdown?.technology)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Infrastructure:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.development?.breakdown?.infrastructure)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Third Party:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.development?.breakdown?.thirdParty)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-green-600`}>
                  📈 Quarterly Scaling Costs
                </h4>
                <div className="space-y-3">
                  {(idea.founderFit?.costStructure?.development?.scaling || []).map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className={`text-sm transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        Q{idx + 1}:
                      </span>
                      <span className={`font-semibold transition-colors duration-200 ${
                        isDark ? 'dark-text-primary' : 'text-gray-900'
                      }`}>
                        {formatCurrency(cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Costs */}
        {selectedCostCategory === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-purple-600`}>
                  📊 Quarterly Operations Costs
                </h4>
                <div className="space-y-3">
                  {Object.entries(idea.founderFit?.costStructure?.operations?.quarterly || {}).map(([quarter, amount]) => (
                    <div key={quarter} className="flex justify-between items-center">
                      <span className={`text-sm transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {quarter}:
                      </span>
                      <span className={`font-semibold transition-colors duration-200 ${
                        isDark ? 'dark-text-primary' : 'text-gray-900'
                      }`}>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-purple-600`}>
                  🏢 Operations Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Customer Success:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.operations?.breakdown?.customerSuccess)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Sales:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.operations?.breakdown?.sales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Marketing:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.operations?.breakdown?.marketing)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Legal:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.operations?.breakdown?.legal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Finance:</span>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {formatCurrency(idea.founderFit?.costStructure?.operations?.breakdown?.finance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Inference Costs */}
        {selectedCostCategory === 'aiInference' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-cyan-600`}>
                  🤖 AI Cost Structure
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>Cost per Request:</span>
                    <span className={`font-semibold transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      ${idea.founderFit?.costStructure?.aiInference?.costPerRequest || 0}
                    </span>
                  </div>
                  <div>
                    <span className={`text-sm font-medium mb-2 block transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      Expected Volume Growth:
                    </span>
                    <div className="space-y-2">
                      {(idea.founderFit?.costStructure?.aiInference?.expectedVolume || []).map((volume, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className={`transition-colors duration-200 ${
                            isDark ? 'dark-text-secondary' : 'text-gray-600'
                          }`}>Q{idx + 1}:</span>
                          <span className={`font-medium transition-colors duration-200 ${
                            isDark ? 'dark-text-primary' : 'text-gray-900'
                          }`}>
                            {volume.toLocaleString()} requests
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-cyan-600`}>
                  📉 Cost Optimization Factors
                </h4>
                <ul className={`text-sm space-y-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {(idea.founderFit?.costStructure?.aiInference?.scalingFactors || []).map((factor, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-cyan-500 mr-2">•</span>
                      <div>
                        {typeof factor === 'string' ? factor : 
                          <><strong>{(factor as any).factor}</strong>: {(factor as any).impact} ({(factor as any).timeline})</>
                        }
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Investment & Team Composition */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🏦 Investment Strategy & Team Composition
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Investment Needs */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Investment Roadmap
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                idea.founderFit.investmentNeeds.bootstrapping.feasible
                  ? isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-200'
                  : isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    💪 Bootstrapping
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    idea.founderFit.investmentNeeds.bootstrapping.feasible
                      ? isDark ? 'text-green-300 bg-green-900/30' : 'text-green-800 bg-green-100'
                      : isDark ? 'text-red-300 bg-red-900/30' : 'text-red-800 bg-red-100'
                  }`}>
                    {idea.founderFit.investmentNeeds.bootstrapping.feasible ? 'Feasible' : 'Not Recommended'}
                  </span>
                </div>
                <p className={`text-sm mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Timeframe: {idea.founderFit.investmentNeeds.bootstrapping.timeframe}
                </p>
                <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-tertiary' : 'text-gray-500'
                }`}>
                  {idea.founderFit.investmentNeeds.bootstrapping.constraints.map((constraint, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-gray-400 mr-1">•</span>
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    🌱 Seed Funding
                  </h4>
                  <span className={`text-lg font-bold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {formatCurrency(idea.founderFit.investmentNeeds.seedFunding.amount)}
                  </span>
                </div>
                <p className={`text-sm mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Timeline: {idea.founderFit.investmentNeeds.seedFunding.timeline}
                </p>
                <div className="space-y-1 text-xs">
                  <span className={`font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Use of Funds:
                  </span>
                  {idea.founderFit.investmentNeeds.seedFunding.useOfFunds.map((use, idx) => (
                    <div key={idx} className={`flex items-start transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      <span className="text-gray-400 mr-1">•</span>
                      {use}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-primary dark-border-primary' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    🚀 Series A
                  </h4>
                  <span className={`text-lg font-bold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {formatCurrency(idea.founderFit.investmentNeeds.seriesA.expectedAmount)}
                  </span>
                </div>
                <p className={`text-sm mb-2 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  Timeframe: {idea.founderFit.investmentNeeds.seriesA.timeframe}
                </p>
                <div className="space-y-1 text-xs">
                  <span className={`font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Requirements:
                  </span>
                  {idea.founderFit.investmentNeeds.seriesA.requirements.map((req, idx) => (
                    <div key={idx} className={`flex items-start transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      <span className="text-gray-400 mr-1">•</span>
                      {req}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team Composition */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Team Structure
            </h3>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-blue-600`}>
                  👥 Core Team ({idea.founderFit.teamComposition.coFounders} Co-founders)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>Key Hires:</span>
                    <ul className={`mt-1 space-y-1 text-xs transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {idea.founderFit.teamComposition.keyHires.map((hire, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {hire}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>Board Members:</span>
                    <ul className={`mt-1 space-y-1 text-xs transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      {idea.founderFit.teamComposition.boardMembers.map((member, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {member}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 text-purple-600`}>
                  🎯 Advisory Board
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {idea.founderFit.teamComposition.advisors.map((advisor, idx) => (
                    <div key={idx} className={`text-sm p-2 rounded transition-colors duration-200 ${
                      isDark ? 'dark-bg-primary' : 'bg-white'
                    }`}>
                      <span className="text-purple-500 mr-2">📋</span>
                      <span className={`transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-700'
                      }`}>
                        {advisor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StrategyTab: React.FC<{idea: DetailedIdea; isDark: boolean}> = ({ idea, isDark }) => {
  const [selectedPhase, setSelectedPhase] = useState<'phase1' | 'phase2' | 'phase3'>('phase1');
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  
  const getAccessibilityColor = (difficulty: string) => {
    if (difficulty === 'easy') return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
    if (difficulty === 'moderate') return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-800 bg-yellow-100';
    return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-100';
  };

  const getCapacityColor = (capacity: string) => {
    if (capacity === 'high') return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
    if (capacity === 'medium') return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-800 bg-yellow-100';
    return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-100';
  };

  const getInfluenceColor = (influence: string) => {
    if (influence === 'high') return isDark ? 'text-purple-400 bg-purple-900/20' : 'text-purple-800 bg-purple-100';
    if (influence === 'medium') return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-800 bg-blue-100';
    return isDark ? 'text-gray-400 bg-gray-800/20' : 'text-gray-600 bg-gray-100';
  };

  const getChannelIcon = (type: string) => {
    const icons = {
      'direct-sales': '🎯',
      'self-serve': '🔄',
      'partner': '🤝',
      'marketplace': '🛍️',
      'content': '📝',
      'community': '👥'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getEffectivenessColor = (effectiveness: string) => {
    if (effectiveness === 'high') return isDark ? 'text-green-400' : 'text-green-600';
    if (effectiveness === 'medium') return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Target Segments */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Target Customer Segments
        </h2>

        <div className="space-y-4">
          {idea.goToMarket.targetSegments.map((segment, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                expandedSegment === segment.name
                  ? isDark ? 'dark-bg-primary dark-border-secondary ring-2 ring-blue-500' : 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                  : isDark ? 'dark-bg-tertiary dark-border-primary hover:dark-bg-primary' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}
              onClick={() => setExpandedSegment(expandedSegment === segment.name ? null : segment.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-2 transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {segment.name}
                  </h3>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {segment.description}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary bg-gray-800' : 'text-gray-700 bg-gray-100'
                  }`}>
                    {segment.size.toLocaleString()} companies
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAccessibilityColor(segment.accessDifficulty)}`}>
                    Access: {segment.accessDifficulty}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCapacityColor(segment.paymentCapacity)}`}>
                    Payment: {segment.paymentCapacity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getInfluenceColor(segment.influenceOnOthers)}`}>
                    Influence: {segment.influenceOnOthers}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                  segment.adoptionSpeed === 'fast' 
                    ? isDark ? 'text-green-300 bg-green-900/30' : 'text-green-800 bg-green-100'
                    : segment.adoptionSpeed === 'medium'
                    ? isDark ? 'text-yellow-300 bg-yellow-900/30' : 'text-yellow-800 bg-yellow-100'
                    : isDark ? 'text-red-300 bg-red-900/30' : 'text-red-800 bg-red-100'
                }`}>
                  {segment.adoptionSpeed} adoption
                </span>
              </div>

              {expandedSegment === segment.name && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
                        isDark ? 'dark-text-primary' : 'text-gray-900'
                      }`}>
                        🔍 Key Pain Points
                      </h5>
                      <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {segment.keyPainPoints.map((pain, painIdx) => (
                          <li key={painIdx} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {pain}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className={`font-medium text-sm mb-2 transition-colors duration-200 ${
                        isDark ? 'dark-text-primary' : 'text-gray-900'
                      }`}>
                        📢 Specific Channels
                      </h5>
                      <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {segment.specificChannels.map((channel, channelIdx) => (
                          <li key={channelIdx} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {channel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Channel Strategy */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🚀 Channel Strategy Evolution
        </h2>

        {/* Phase Selection */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'phase1', label: 'Phase 1: Foundation', icon: '🌱' },
            { key: 'phase2', label: 'Phase 2: Growth', icon: '📈' },
            { key: 'phase3', label: 'Phase 3: Scale', icon: '🚀' }
          ].map((phase) => (
            <button
              key={phase.key}
              onClick={() => setSelectedPhase(phase.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedPhase === phase.key
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : isDark ? 'dark-btn-secondary dark-hover' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{phase.icon}</span>
              <span>{phase.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Phase Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {idea.goToMarket.channelStrategy[selectedPhase].map((channel, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getChannelIcon(channel.type)}</span>
                  <h4 className={`font-semibold text-sm capitalize transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {channel.type.replace('-', ' ')}
                  </h4>
                </div>
                <div className="flex space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    getEffectivenessColor(channel.costEffectiveness)
                  } ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                    Cost: {channel.costEffectiveness}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    getEffectivenessColor(channel.scalability)
                  } ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                    Scale: {channel.scalability}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm mb-3 transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {channel.description}
              </p>
              
              <div className="space-y-3">
                <div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Time to Results: 
                  </span>
                  <span className={`ml-1 text-sm font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {channel.timeToResults}
                  </span>
                </div>
                
                <div>
                  <span className={`text-xs font-medium block mb-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Required Resources:
                  </span>
                  <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {channel.requiredResources.map((resource, resIdx) => (
                      <li key={resIdx} className="flex items-start">
                        <span className="text-blue-500 mr-1">•</span>
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <span className={`text-xs font-medium block mb-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Success Metrics:
                  </span>
                  <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {channel.successMetrics.map((metric, metIdx) => (
                      <li key={metIdx} className="flex items-start">
                        <span className="text-green-500 mr-1">📊</span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive Positioning */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          ⚔️ Competitive Positioning & Differentiation
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Differentiation */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              🎯 Key Differentiators
            </h3>
            <div className="space-y-3">
              {idea.goToMarket.competitivePositioning.differentiation.map((diff, idx) => (
                <div key={idx} className={`p-3 rounded-lg transition-colors duration-200 ${
                  isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start">
                    <span className="text-blue-500 mr-3 mt-0.5">✨</span>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-800'
                    }`}>
                      {diff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Strategy */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              💰 Pricing Strategy
            </h3>
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div>
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Strategy:
                  </span>
                  <p className={`text-sm font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {idea.goToMarket.competitivePositioning.pricing.strategy}
                  </p>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Justification:
                  </span>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {idea.goToMarket.competitivePositioning.pricing.justification}
                  </p>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Competitive Advantage:
                  </span>
                  <p className={`text-sm font-semibold text-green-600`}>
                    {idea.goToMarket.competitivePositioning.pricing.competitiveAdvantage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Messaging */}
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            📢 Core Messaging
          </h3>
          <div className={`p-4 rounded-lg border-l-4 border-blue-500 transition-colors duration-200 ${
            isDark ? 'dark-bg-tertiary' : 'bg-blue-50'
          }`}>
            <blockquote className={`text-lg font-medium italic transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-800'
            }`}>
              "{idea.goToMarket.competitivePositioning.messaging}"
            </blockquote>
          </div>
        </div>
      </section>

      {/* Traction Milestones */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Traction Milestones & Launch Strategy
        </h2>

        {/* Traction Milestones */}
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Key Milestones
          </h3>
          <div className="space-y-4">
            {idea.goToMarket.tractionMilestones.map((milestone, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  expandedMilestone === milestone.name
                    ? isDark ? 'dark-bg-primary dark-border-secondary' : 'bg-blue-50 border-blue-200'
                    : isDark ? 'dark-bg-tertiary dark-border-primary hover:dark-bg-primary' : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}
                onClick={() => setExpandedMilestone(expandedMilestone === milestone.name ? null : milestone.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {milestone.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {milestone.timeframe}
                  </span>
                </div>
                <p className={`text-sm transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {milestone.description}
                </p>

                {expandedMilestone === milestone.name && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div>
                      <h5 className={`font-medium text-xs mb-2 text-green-600`}>
                        ✅ Success Criteria
                      </h5>
                      <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {milestone.successCriteria.map((criteria, cIdx) => (
                          <li key={cIdx} className="flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className={`font-medium text-xs mb-2 text-blue-600`}>
                        📋 Dependencies
                      </h5>
                      <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {milestone.dependencies.map((dep, dIdx) => (
                          <li key={dIdx} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {dep}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className={`font-medium text-xs mb-2 text-amber-600`}>
                        ⚠️ Risk Factors
                      </h5>
                      <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {milestone.riskFactors.map((risk, rIdx) => (
                          <li key={rIdx} className="flex items-start">
                            <span className="text-amber-500 mr-1">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Launch Strategy */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Launch Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-semibold text-sm mb-3 text-green-600`}>
                🧪 Beta Program
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>Size:</span>
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {idea.goToMarket.launchStrategy.betaProgram.size} customers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>Duration:</span>
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {idea.goToMarket.launchStrategy.betaProgram.duration}
                  </span>
                </div>
                <div className="mt-3">
                  <span className={`text-xs font-medium block mb-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Selection Criteria:
                  </span>
                  <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {idea.goToMarket.launchStrategy.betaProgram.criteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-1">•</span>
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-semibold text-sm mb-3 text-purple-600`}>
                🚀 Public Launch
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>Timeline:</span>
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {idea.goToMarket.launchStrategy.publicLaunch.timeline}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>Budget:</span>
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    ${idea.goToMarket.launchStrategy.publicLaunch.budget.toLocaleString()}
                  </span>
                </div>
                <div className="mt-3">
                  <span className={`text-xs font-medium block mb-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Launch Channels:
                  </span>
                  <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {idea.goToMarket.launchStrategy.publicLaunch.channels.map((channel, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-purple-500 mr-1">•</span>
                        {channel}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const RiskAssessmentTab: React.FC<{idea: DetailedIdea; isDark: boolean}> = ({ idea, isDark }) => {
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<'marketRisks' | 'technicalRisks' | 'executionRisks' | 'financialRisks'>('marketRisks');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  
  const getRiskColor = (impact: string, probability: string) => {
    const riskScore = getRiskScore(impact, probability);
    if (riskScore >= 7) return isDark ? 'border-red-500 bg-red-900/20' : 'border-red-200 bg-red-50';
    if (riskScore >= 5) return isDark ? 'border-amber-500 bg-amber-900/20' : 'border-amber-200 bg-amber-50';
    return isDark ? 'border-green-500 bg-green-900/20' : 'border-green-200 bg-green-50';
  };

  const getRiskScore = (impact: string, probability: string) => {
    const impactScore = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
    const probabilityScore = probability === 'high' ? 3 : probability === 'medium' ? 2 : 1;
    return impactScore * probabilityScore;
  };

  const getRiskLabel = (impact: string, probability: string) => {
    const score = getRiskScore(impact, probability);
    if (score >= 7) return { label: 'HIGH RISK', color: isDark ? 'text-red-300' : 'text-red-700' };
    if (score >= 5) return { label: 'MEDIUM RISK', color: isDark ? 'text-amber-300' : 'text-amber-700' };
    return { label: 'LOW RISK', color: isDark ? 'text-green-300' : 'text-green-700' };
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-800 bg-red-100';
    if (impact === 'medium') return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-800 bg-amber-100';
    return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
  };

  const getProbabilityColor = (probability: string) => {
    if (probability === 'high') return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-800 bg-red-100';
    if (probability === 'medium') return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-800 bg-amber-100';
    return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-800 bg-green-100';
  };

  const getRiskCategoryIcon = (category: string) => {
    const icons = {
      marketRisks: '🏪',
      technicalRisks: '⚙️',
      executionRisks: '🎯',
      financialRisks: '💰'
    };
    return icons[category as keyof typeof icons] || '⚠️';
  };

  const getRiskCategoryName = (category: string) => {
    const names = {
      marketRisks: 'Market Risks',
      technicalRisks: 'Technical Risks',
      executionRisks: 'Execution Risks',
      financialRisks: 'Financial Risks'
    };
    return names[category as keyof typeof names] || 'Risks';
  };

  const getAllRisks = () => {
    return [
      ...idea.riskAssessment.marketRisks,
      ...idea.riskAssessment.technicalRisks,
      ...idea.riskAssessment.executionRisks,
      ...idea.riskAssessment.financialRisks
    ];
  };

  const getHighestRisks = () => {
    return getAllRisks()
      .map(risk => ({ ...risk, score: getRiskScore(risk.impact, risk.probability) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  return (
    <div className="space-y-8">
      {/* Risk Overview Dashboard */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          📊 Risk Assessment Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { category: 'marketRisks', label: 'Market', icon: '🏪', count: idea.riskAssessment.marketRisks.length },
            { category: 'technicalRisks', label: 'Technical', icon: '⚙️', count: idea.riskAssessment.technicalRisks.length },
            { category: 'executionRisks', label: 'Execution', icon: '🎯', count: idea.riskAssessment.executionRisks.length },
            { category: 'financialRisks', label: 'Financial', icon: '💰', count: idea.riskAssessment.financialRisks.length }
          ].map((cat) => (
            <div key={cat.category} className={`p-4 text-center rounded-lg transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary' : 'bg-gray-50'
            }`}>
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className={`text-2xl font-bold mb-1 transition-colors duration-200 ${
                isDark ? 'dark-text-primary' : 'text-gray-900'
              }`}>
                {cat.count}
              </div>
              <div className={`text-sm font-medium transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {cat.label} Risks
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 Highest Risks */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            🚨 Highest Priority Risks
          </h3>
          <div className="space-y-3">
            {getHighestRisks().map((risk, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-colors duration-200 ${
                  getRiskColor(risk.impact, risk.probability)
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getRiskCategoryIcon(risk.category)}</span>
                    <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                      isDark ? 'dark-text-primary' : 'text-gray-900'
                    }`}>
                      {risk.category.replace('Risks', '').toUpperCase()} RISK
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getRiskLabel(risk.impact, risk.probability).color} ${
                      isDark ? 'bg-gray-800/50' : 'bg-white/80'
                    }`}>
                      {getRiskLabel(risk.impact, risk.probability).label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(risk.impact)}`}>
                      {risk.impact} impact
                    </span>
                  </div>
                </div>
                <p className={`text-sm transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {risk.description}
                </p>
                <div className="mt-2">
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isDark ? 'dark-text-tertiary' : 'text-gray-500'
                  }`}>
                    Top Mitigation: 
                  </span>
                  <span className={`ml-1 text-xs transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {risk.mitigationStrategies[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Risk Analysis */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🔍 Detailed Risk Analysis
        </h2>

        {/* Risk Category Selection */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'marketRisks', label: 'Market Risks', icon: '🏪' },
            { key: 'technicalRisks', label: 'Technical Risks', icon: '⚙️' },
            { key: 'executionRisks', label: 'Execution Risks', icon: '🎯' },
            { key: 'financialRisks', label: 'Financial Risks', icon: '💰' }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedRiskCategory(category.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedRiskCategory === category.key
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : isDark ? 'dark-btn-secondary dark-hover' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Category Risks */}
        <div className="space-y-4">
          {idea.riskAssessment[selectedRiskCategory].map((risk, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                expandedRisk === `${selectedRiskCategory}-${idx}`
                  ? getRiskColor(risk.impact, risk.probability)
                  : isDark ? 'dark-bg-tertiary dark-border-primary hover:dark-bg-primary' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}
              onClick={() => setExpandedRisk(expandedRisk === `${selectedRiskCategory}-${idx}` ? null : `${selectedRiskCategory}-${idx}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm mb-2 transition-colors duration-200 ${
                    isDark ? 'dark-text-primary' : 'text-gray-900'
                  }`}>
                    {getRiskCategoryName(selectedRiskCategory)} #{idx + 1}
                  </h4>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {risk.description}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${getRiskLabel(risk.impact, risk.probability).color} ${
                    isDark ? 'bg-gray-800/50' : 'bg-white/80'
                  }`}>
                    {getRiskLabel(risk.impact, risk.probability).label}
                  </span>
                  <div className="flex space-x-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getProbabilityColor(risk.probability)}`}>
                      {risk.probability}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(risk.impact)}`}>
                      {risk.impact}
                    </span>
                  </div>
                </div>
              </div>

              {expandedRisk === `${selectedRiskCategory}-${idx}` && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className={`font-medium text-sm mb-2 text-blue-600`}>
                        🛡️ Mitigation Strategies
                      </h5>
                      <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {risk.mitigationStrategies.map((strategy, sIdx) => (
                          <li key={sIdx} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className={`font-medium text-sm mb-2 text-amber-600`}>
                        🚨 Early Warning Signals
                      </h5>
                      <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                        isDark ? 'dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {risk.earlyWarningSignals.map((signal, wIdx) => (
                          <li key={wIdx} className="flex items-start">
                            <span className="text-amber-500 mr-2">▲</span>
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mitigation Plans & Contingencies */}
      <section className={`rounded-lg border p-6 transition-colors duration-200 ${
        isDark ? 'dark-bg-secondary dark-border-primary' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>
          🎯 Strategic Mitigation & Contingency Plans
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority-Based Mitigation Plans */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Priority Mitigation Plans
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-3">
                  <span className="text-red-500 text-lg mr-2">🔴</span>
                  <h4 className={`font-semibold text-sm text-red-700`}>
                    Priority 1 (Critical)
                  </h4>
                </div>
                <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {idea.riskAssessment.mitigationPlans.priority1.map((plan, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center mb-3">
                  <span className="text-amber-500 text-lg mr-2">🟡</span>
                  <h4 className={`font-semibold text-sm text-amber-700`}>
                    Priority 2 (Important)
                  </h4>
                </div>
                <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {idea.riskAssessment.mitigationPlans.priority2.map((plan, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-3">
                  <span className="text-green-500 text-lg mr-2">🟢</span>
                  <h4 className={`font-semibold text-sm text-green-700`}>
                    Priority 3 (Monitor)
                  </h4>
                </div>
                <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'dark-text-secondary' : 'text-gray-600'
                }`}>
                  {idea.riskAssessment.mitigationPlans.priority3.map((plan, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Contingency Plans */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              isDark ? 'dark-text-primary' : 'text-gray-900'
            }`}>
              Contingency Plans
            </h3>
            
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center mb-4">
                <span className="text-blue-500 text-lg mr-2">📋</span>
                <h4 className={`font-semibold text-sm transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  Alternative Strategic Options
                </h4>
              </div>
              <div className="space-y-3">
                {idea.riskAssessment.contingencyPlans.map((plan, idx) => (
                  <div key={idx} className={`p-3 rounded-lg transition-colors duration-200 ${
                    isDark ? 'dark-bg-primary' : 'bg-white'
                  }`}>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-3 mt-0.5">🔄</span>
                      <div>
                        <h5 className={`font-medium text-sm mb-1 transition-colors duration-200 ${
                          isDark ? 'dark-text-primary' : 'text-gray-800'
                        }`}>
                          Option {idx + 1}
                        </h5>
                        <p className={`text-sm transition-colors duration-200 ${
                          isDark ? 'dark-text-secondary' : 'text-gray-600'
                        }`}>
                          {plan}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Monitoring Framework */}
            <div className="mt-6">
              <h4 className={`font-semibold text-sm mb-3 transition-colors duration-200 ${
                isDark ? 'dark-text-primary' : 'text-gray-900'
              }`}>
                📈 Risk Monitoring Framework
              </h4>
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDark ? 'dark-bg-tertiary dark-border-primary' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      Review Frequency:
                    </span>
                    <p className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Monthly risk assessment reviews
                    </p>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      Escalation Trigger:
                    </span>
                    <p className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      High-risk probability increases
                    </p>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      Success Metrics:
                    </span>
                    <p className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Risk impact reduction &gt;50%
                    </p>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      Team Responsibility:
                    </span>
                    <p className={`transition-colors duration-200 ${
                      isDark ? 'dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Founder + Board oversight
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IdeaDetailView;