import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-business-factory/ui-components';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { IdeaCard } from './components/IdeaCard';
import { IdeaDetailView } from './components/IdeaDetailView';
import { useTheme } from './hooks/useTheme';
import { sampleIdeas } from './data/sampleIdeas';
import { sampleDetailedIdea } from './data/sampleDetailedIdea';
import { BusinessIdea, UserSession } from './types';
import { aiService } from './services/aiService';
import './styles/theme.css';

// Main app content component
const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State management
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailedIdea, setDetailedIdea] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // Load ideas on component mount
  useEffect(() => {
    const loadIdeas = async () => {
      setIsLoading(true);
      try {
        console.log('Loading ideas...');
        const generatedIdeas = await aiService.generateIdeas();
        setIdeas(generatedIdeas);
        console.log('Ideas loaded:', generatedIdeas.length);
      } catch (error) {
        console.error('Failed to load ideas:', error);
        setIdeas(sampleIdeas); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIdeas();
  }, []);
  
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
    console.log('handleViewIdea called with:', ideaId);
    console.log('Current state before update:', { currentView, selectedIdeaId });
    
    // Find the selected idea
    const selectedIdea = ideas.find(idea => idea.id === ideaId);
    if (!selectedIdea) {
      console.error('Idea not found:', ideaId);
      return;
    }
    
    setSelectedIdeaId(ideaId);
    setCurrentView('detail');
    setIsLoadingDetail(true);
    setDetailedIdea(null);
    
    try {
      // First try to load from database if it's a UUID (database-stored idea)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ideaId);
      
      if (isUUID) {
        console.log('🗃️ Loading detailed idea from database:', ideaId);
        const databaseIdea = await aiService.loadDetailedIdeaFromDatabase(ideaId);
        
        if (databaseIdea) {
          console.log('✅ Detailed idea loaded from database:', databaseIdea.title);
          setDetailedIdea(databaseIdea);
          setIsLoadingDetail(false);
          return;
        }
      }
      
      // If not found in database or not a UUID, generate new analysis
      console.log('🔍 Generating detailed analysis for:', selectedIdea.title);
      const detailedAnalysis = await aiService.generateDetailedAnalysis(
        selectedIdea.title,
        selectedIdea.description
      );
      setDetailedIdea(detailedAnalysis);
      console.log('✅ Detailed analysis loaded');
    } catch (error) {
      console.error('Failed to load detailed analysis:', error);
      // Fallback to sample detailed idea
      setDetailedIdea(sampleDetailedIdea);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedIdeaId(null);
    setDetailedIdea(null);
    setIsLoadingDetail(false);
  };

  const handleExclusiveClick = (ideaId: string) => {
    // Mock exclusive access flow
    alert(`Exclusive access for ${ideaId} - would redirect to payment`);
  };

  const handleAIGenerate = (ideaId: string) => {
    // Mock AI generation flow
    alert(`AI generation for ${ideaId} - would generate new variations`);
  };

  // Show detail view if an idea is selected
  console.log('Render check:', { 
    currentView: currentView, 
    selectedIdeaId: selectedIdeaId, 
    shouldShowDetail: currentView === 'detail' && selectedIdeaId 
  });
  
  if (currentView === 'detail' && selectedIdeaId) {
    console.log('Rendering detail view for:', selectedIdeaId);
    
    if (isLoadingDetail) {
      return (
        <div className={`min-h-screen transition-colors duration-200 ${
          isDark ? 'dark-bg-primary' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className={`text-2xl mb-4 transition-colors duration-200 ${
                isDark ? 'dark-text-primary' : 'text-gray-900'
              }`}>
                🤖 Analyzing Business Opportunity...
              </div>
              <div className={`text-lg transition-colors duration-200 ${
                isDark ? 'dark-text-secondary' : 'text-gray-600'
              }`}>
                {import.meta.env.VITE_USE_AI_GENERATION === 'true' 
                  ? 'Generating live Claude AI analysis with real market data' 
                  : 'Loading business intelligence'
                }
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark-bg-primary' : 'bg-gray-50'
      }`}>
        <IdeaDetailView 
          idea={detailedIdea || sampleDetailedIdea} 
          onBack={handleBackToList}
        />
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
            Browse curated opportunities, see what's trending, and find ideas that match your skills and interests.
          </p>
          <div className={`text-sm mt-2 px-4 py-2 rounded transition-colors duration-200 ${
            isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            🔧 ENV DEBUG: VITE_USE_AI_GENERATION = {import.meta.env.VITE_USE_AI_GENERATION || 'undefined'} | 
            Ideas Count: {ideas.length}
          </div>
        </div>
        
        {/* Idea Cards Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className={`text-lg transition-colors duration-200 ${
              isDark ? 'dark-text-secondary' : 'text-gray-600'
            }`}>
              🚀 Loading AI Business Opportunities... (LIVE)
            </div>
            <div className={`text-sm mt-2 transition-colors duration-200 ${
              isDark ? 'dark-text-tertiary' : 'text-gray-500'
            }`}>
              {import.meta.env.VITE_USE_AI_GENERATION === 'true' 
                ? 'Using live Claude AI analysis' 
                : 'Loading sample data'
              }
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {ideas.map((idea) => (
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
            ))}
          </div>
        )}
        
        <div className={`rounded-lg border p-6 transition-colors duration-200 ${
          isDark 
            ? 'dark-bg-secondary dark-border-primary' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <p className={`text-center transition-colors duration-200 ${
            isDark ? 'dark-text-secondary' : 'text-gray-600'
          }`}>
            ✅ Idea detail views implemented! Click "Details" on any card to explore comprehensive business intelligence
          </p>
          <p className={`text-sm text-center mt-2 transition-colors duration-200 ${
            isDark ? 'dark-text-tertiary' : 'text-gray-500'
          }`}>
            Market analysis, financial projections, founder fit, go-to-market strategy, and risk assessments
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