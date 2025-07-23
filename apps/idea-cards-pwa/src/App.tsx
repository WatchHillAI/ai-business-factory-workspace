import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-business-factory/ui-components';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { IdeaCard } from './components/IdeaCard';
import { IdeaDetailView } from './components/IdeaDetailView';
import { LiveAITest } from './components/LiveAITest';
import { useTheme } from './hooks/useTheme';
import { microservicesIntegration } from './lib/microservicesIntegration';
import { BusinessIdea, UserSession } from './types';
import { sampleDetailedIdea } from './data/sampleDetailedIdea';
import { createLogger } from '@ai-business-factory/ui-components/src/utils/logger';
import './styles/theme.css';

// Initialize logger for Ideas PWA
const logger = createLogger('IdeasPWA');

// Main app content component
const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State management
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'live-test'>('list');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>([]);
  const [liveIdeas, setLiveIdeas] = useState<BusinessIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [selectedIdeaData, setSelectedIdeaData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  
  // Mock user session for progressive disclosure
  const mockSession: UserSession = {
    id: 'demo-user',
    sessionToken: 'demo-token',
    startTime: new Date(),
    isLoggedIn: false,
    ideasViewed: 3,
    detailViews: 1,
    filterUsage: 0,
    exclusiveHovers: 0,
    progressiveDisclosureActive: true,
    savedIdeaIds: savedIdeaIds,
    viewedIdeaIds: ['ai-customer-support-001'],
    currentFilter: 'all'
  };

  // Event handlers
  const handleSaveIdea = (ideaId: string) => {
    setSavedIdeaIds(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  const handleViewIdea = async (ideaId: string) => {
    logger.debug('Details button clicked', { 
      ideaId, 
      currentView, 
      selectedIdeaId, 
      liveIdeasCount: liveIdeas.length 
    });
    
    setSelectedIdeaId(ideaId);
    setIsLoadingIdeas(true);
    
    try {
      // Get comprehensive analysis (will use mock data if feature flags disable it)
      const comprehensiveData = await microservicesIntegration.getComprehensiveAnalysis(ideaId);
      setSelectedIdeaData(comprehensiveData);
      setCurrentView('detail');
    } catch (error) {
      logger.error('Failed to load comprehensive analysis', { 
        error: error.message, 
        ideaId 
      });
      // Show sample detail view as fallback
      setSelectedIdeaData(sampleDetailedIdea);
      setCurrentView('detail');
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedIdeaId(null);
  };

  const handleShowLiveTest = () => {
    setCurrentView('live-test');
    setSelectedIdeaId(null);
  };

  const handleExclusiveClick = (ideaId: string) => {
    // Mock exclusive access flow
    alert(`Exclusive access for ${ideaId} - would redirect to payment`);
  };

  const handleAIGenerate = (ideaId: string) => {
    // Mock AI generation flow
    alert(`AI generation for ${ideaId} - would generate new variations`);
  };

  // Load ideas (live or demo based on feature flags)
  useEffect(() => {
    logger.info('App initializing, loading ideas');
    
    const loadIdeas = async () => {
      setIsLoadingIdeas(true);
      
      try {
        // Check system health first
        const health = await microservicesIntegration.checkSystemHealth();
        setSystemHealth(health);
        
        // Load opportunities (will use demo data if feature flags disable live data)
        const ideas = await microservicesIntegration.getLiveOpportunities(6);
        logger.info('Ideas loaded successfully', { 
          count: ideas.length, 
          source: 'microservices' 
        });
        setLiveIdeas(ideas);
      } catch (error) {
        logger.error('Failed to load ideas', { error: error.message });
        // Fallback to basic demo data on error
        const fallbackIdea: BusinessIdea = {
          id: 'ai-customer-support-001',
          title: 'AI Customer Support Automation',
          description: 'AI-powered customer service platform for small businesses.',
          icon: '🤖',
          category: 'ai-automation',
          tier: 'public',
          metrics: {
            marketSize: '$2.4B',
            techLevel: 'Medium',
            timeToLaunch: '6-8 months',
            startupCost: '$25-50K',
            targetMarket: 'SMB',
            growthRate: '28% annually',
            successProbability: '82%'
          },
          socialProof: {
            trending: true,
            tags: ['Demo Data', 'Error Fallback']
          },
          generatedBy: 'Fallback System',
          validationScore: 82,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setLiveIdeas([fallbackIdea]);
      } finally {
        setIsLoadingIdeas(false);
      }
    };
    
    loadIdeas();
  }, []);

  // Show appropriate view based on current state
  console.log('🔥 Render check:', { 
    currentView: currentView, 
    selectedIdeaId: selectedIdeaId, 
    shouldShowDetail: currentView === 'detail' && selectedIdeaId,
    liveIdeasLength: liveIdeas.length,
    liveIdeas: liveIdeas
  });
  
  if (currentView === 'detail' && selectedIdeaId) {
    console.log('Rendering detail view for:', selectedIdeaId);
    console.log('Available ideas:', liveIdeas.map(idea => idea.id));
    
    // Find the selected idea from live data
    const selectedIdea = liveIdeas.find(idea => idea.id === selectedIdeaId);
    
    if (!selectedIdea) {
      logger.warn('Selected idea not found, returning to list', {
        selectedIdeaId,
        availableIds: liveIdeas.map(idea => idea.id)
      });
      setCurrentView('list');
      setSelectedIdeaId(null);
      return null;
    }

    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark-bg-primary' : 'bg-gray-50'
      }`}>
        <IdeaDetailView 
          idea={selectedIdeaData || sampleDetailedIdea} 
          onBack={handleBackToList}
        />
      </div>
    );
  }

  if (currentView === 'live-test') {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark-bg-primary' : 'bg-gray-50'
      }`}>
        <header className={`shadow-sm border-b transition-colors duration-200 ${
          isDark 
            ? 'dark-bg-secondary dark-border-primary' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className={`text-sm hover:underline transition-colors duration-200 ${
                    isDark ? 'dark-text-secondary hover:dark-text-primary' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ← Back to Ideas
                </button>
                <h1 className={`text-2xl font-bold transition-colors duration-200 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  🤖 Live AI Agent Test
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        <main className="py-8">
          <LiveAITest />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'dark-bg-primary' : 'bg-gray-50'
    }`}>
      <header className={`shadow-sm border-b transition-colors duration-200 ${
        isDark 
          ? 'dark-bg-secondary dark-border-primary' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className={`text-2xl font-bold transition-colors duration-200 ${
                isDark ? 'dark-text-primary' : 'text-gray-900'
              }`}>
                🚀 AI Business Factory
              </h1>
              <span className={`text-sm transition-colors duration-200 ${
                isDark ? 'dark-text-tertiary' : 'text-gray-500'
              }`}>
                Discover Your Next Opportunity
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShowLiveTest}
                className={`text-sm px-3 py-1 rounded border transition-colors duration-200 ${
                  isDark 
                    ? 'border-dark-border-primary dark-text-secondary hover:dark-text-primary hover:border-blue-500' 
                    : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-blue-500'
                }`}
              >
                🤖 Test Live AI
              </button>
              <span className={`text-sm transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                Exploring ideas...
              </span>
              <ThemeToggle className="mr-2" />
              <Button variant="outline" size="sm">Sign In</Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-4 transition-colors duration-200 ${
            isDark ? 'dark-text-primary' : 'text-gray-900'
          }`}>
            Discover Your Next Business Opportunity
          </h2>
          <p className={`text-lg max-w-2xl mx-auto transition-colors duration-200 ${
            isDark ? 'dark-text-secondary' : 'text-gray-600'
          }`}>
            Browse curated opportunities, see what&apos;s trending, and find ideas that match your skills and interests.
          </p>
        </div>
        
        {/* System Health Status */}
        {systemHealth && systemHealth.overallStatus !== 'healthy' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            systemHealth.overallStatus === 'degraded'
              ? 'bg-yellow-900/20 border-yellow-500/30'
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className={`text-sm font-medium ${
              systemHealth.overallStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              ⚠️ {systemHealth.overallStatus === 'degraded' ? 'System Partially Available' : 'System Issues Detected'}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'dark-text-tertiary' : 'text-gray-500'}`}>
              Some microservices may be temporarily unavailable. Live data will be restored shortly.
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingIdeas ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`rounded-lg border p-6 transition-colors duration-200 ${
                isDark 
                  ? 'dark-bg-secondary dark-border-primary' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className={`h-4 rounded mb-4 ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-3 rounded mb-3 ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-3 w-2/3 rounded mb-6 ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex space-x-2">
                    <div className={`h-8 w-16 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-8 w-16 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Live Ideas Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {liveIdeas.map((idea) => {
                console.log('🔥 Rendering IdeaCard for:', idea.id, idea.title);
                return (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSaved={savedIdeaIds.includes(idea.id)}
                  onSave={handleSaveIdea}
                  onView={handleViewIdea}
                  onExclusiveClick={handleExclusiveClick}
                  onAIGenerate={handleAIGenerate}
                  showProgressiveDisclosure={mockSession.progressiveDisclosureActive}
                />
                );
              })}
            </div>

            {/* No Ideas State */}
            {liveIdeas.length === 0 && (
              <div className={`text-center py-12 rounded-lg border ${
                isDark 
                  ? 'dark-bg-secondary dark-border-primary' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDark ? 'dark-text-primary' : 'text-gray-900'
                }`}>
                  Discovering Opportunities
                </h3>
                <p className={`${isDark ? 'dark-text-secondary' : 'text-gray-600'} mb-4`}>
                  Our AI agents are currently analyzing market data to find fresh business opportunities.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Check for New Opportunities
                </button>
              </div>
            )}
          </>
        )}
        
        <div className={`rounded-lg border p-6 transition-colors duration-200 ${
          isDark 
            ? 'dark-bg-secondary dark-border-primary' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <p className={`text-center transition-colors duration-200 ${
            isDark ? 'dark-text-secondary' : 'text-gray-600'
          }`}>
            🚀 <strong>Live Business Intelligence Pipeline</strong> - Real opportunities from market data analysis!
          </p>
          <p className={`text-sm text-center mt-2 transition-colors duration-200 ${
            isDark ? 'dark-text-tertiary' : 'text-gray-500'
          }`}>
            {systemHealth?.overallStatus === 'healthy' 
              ? '✅ All 4 microservices operational: Data Collector → Opportunity Analyzer → Market Validator → Business Generator'
              : `⚠️ System Status: ${systemHealth?.overallStatus || 'checking...'} - Some services may be temporarily unavailable`
            }
          </p>
          <p className={`text-xs text-center mt-1 transition-colors duration-200 ${
            isDark ? 'dark-text-tertiary' : 'text-gray-400'
          }`}>
            Powered by multi-model AI routing with 88% cost optimization
          </p>
        </div>
      </main>
    </div>
  );
};

// Main App component with ThemeProvider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;