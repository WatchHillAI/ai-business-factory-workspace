import React, { useState } from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-business-factory/ui-components';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { IdeaCard } from './components/IdeaCard';
import { IdeaDetailView } from './components/IdeaDetailView';
import { useTheme } from './hooks/useTheme';
import { sampleIdeas } from './data/sampleIdeas';
import { sampleDetailedIdea } from './data/sampleDetailedIdea';
import { BusinessIdea, UserSession } from './types';
import './styles/theme.css';

// Main app content component
const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State management
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>([]);
  
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

  const handleViewIdea = (ideaId: string) => {
    console.log('handleViewIdea called with:', ideaId);
    console.log('Current state before update:', { currentView, selectedIdeaId });
    setSelectedIdeaId(ideaId);
    setCurrentView('detail');
    console.log('State update calls completed');
  };

  const handleBackToList = () => {
    setCurrentView('list');
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

  // Show detail view if an idea is selected
  console.log('Render check:', { 
    currentView: currentView, 
    selectedIdeaId: selectedIdeaId, 
    shouldShowDetail: currentView === 'detail' && selectedIdeaId 
  });
  
  if (currentView === 'detail' && selectedIdeaId) {
    console.log('Rendering detail view for:', selectedIdeaId);
    // For demo, always show the sample detailed idea
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark-bg-primary' : 'bg-gray-50'
      }`}>
        <IdeaDetailView 
          idea={sampleDetailedIdea} 
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
        </div>
        
        {/* Idea Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {sampleIdeas.map((idea) => (
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