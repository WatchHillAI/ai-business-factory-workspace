import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { IdeaCardProps } from '../types';

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  isSaved,
  onSave,
  onView,
  onExclusiveClick,
  onAIGenerate,
  showProgressiveDisclosure,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  console.log('🔥 IdeaCard rendered for:', idea.id, 'onView prop:', typeof onView);
  const renderCardHeader = () => {
    let titlePrefix = '';
    let titleClass = '';
    
    if (idea.tier === 'exclusive') {
      titlePrefix = '👑 ';
      titleClass = isDark ? 'dark-exclusive-primary' : 'text-purple-900';
    } else if (idea.tier === 'ai-generated') {
      titlePrefix = '✨ ';
      titleClass = isDark ? 'dark-ai-primary' : 'text-amber-900';
    } else if (idea.icon) {
      titlePrefix = `${idea.icon} `;
      titleClass = isDark ? 'dark-public-primary' : 'text-blue-900';
    } else {
      titleClass = isDark ? 'dark-text-primary' : 'text-gray-900';
    }
    
    return (
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold transition-colors duration-200 ${titleClass}`}>
            {titlePrefix}{idea.title}
          </h3>
          {renderTierBadge()}
        </div>
      </div>
    );
  };

  const renderTierBadge = () => {
    if (idea.tier === 'exclusive') {
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
          isDark ? 'dark-badge-premium' : 'bg-purple-100 text-purple-800'
        }`}>
          ⭐ Premium
        </span>
      );
    } else if (idea.tier === 'ai-generated') {
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
          isDark ? 'dark-badge-ai' : 'bg-amber-100 text-amber-800'
        }`}>
          🤖 AI Generated
        </span>
      );
    } else if (idea.socialProof.trending) {
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
          isDark ? 'dark-badge-trending' : 'bg-red-100 text-red-800'
        }`}>
          🔥 Trending
        </span>
      );
    }
    return null;
  };

  const renderMetrics = () => (
    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>🎯</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>{idea.metrics.marketSize}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>💻</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>{idea.metrics.techLevel}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>⏰</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>{idea.metrics.timeToLaunch}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>💰</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>{idea.metrics.startupCost}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>🏢</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'dark-text-primary' : 'text-gray-900'
        }`}>{idea.metrics.targetMarket}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>📈</span>
        <span className={`font-medium transition-colors duration-200 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          {idea.metrics.growthRate || idea.metrics.successProbability}
        </span>
      </div>
    </div>
  );

  const renderSocialProof = () => {
    if (idea.tier === 'public') {
      if (showProgressiveDisclosure) {
        // Full social proof with numbers
        const saveText = idea.socialProof.saveCount && idea.socialProof.saveCount > 1000 
          ? `${(idea.socialProof.saveCount / 1000).toFixed(1)}K` 
          : idea.socialProof.saveCount?.toString();
        
        return (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-heart text-red-500"></i>
                <span className={`font-medium transition-colors duration-200 ${
                  isDark ? 'dark-public-primary' : 'text-blue-900'
                }`}>
                  {saveText} entrepreneurs saved this idea
                </span>
              </div>
              {idea.socialProof.trending && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                  isDark ? 'dark-badge-trending' : 'bg-red-100 text-red-800'
                }`}>
                  🔥 Trending
                </span>
              )}
            </div>
            {idea.socialProof.tags && (
              <div className={`text-xs mt-1 transition-colors duration-200 ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {idea.socialProof.tags.join(' • ')}
              </div>
            )}
          </div>
        );
      } else {
        // Organic activity indicators
        return (
          <div className="text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <i className="fas fa-eye text-gray-400"></i>
                {idea.socialProof.tags[0] || 'Popular this week'}
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-bookmark text-gray-400"></i>
                {idea.socialProof.tags[1] || 'Frequently saved'}
              </span>
            </div>
          </div>
        );
      }
    } else if (idea.tier === 'exclusive' && idea.exclusivity) {
      const remaining = idea.exclusivity.totalSlots - idea.exclusivity.claimedSlots;
      const progressPercent = (idea.exclusivity.claimedSlots / idea.exclusivity.totalSlots) * 100;
      
      if (showProgressiveDisclosure) {
        return (
          <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-lock text-purple-600"></i>
                <span className={`font-medium transition-colors duration-200 ${
                  isDark ? 'dark-exclusive-primary' : 'text-purple-900'
                }`}>
                  {remaining} of {idea.exclusivity.totalSlots} exclusive slots remaining
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                isDark ? 'dark-badge-premium' : 'bg-purple-100 text-purple-800'
              }`}>
                ⭐ Premium
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{width: `${progressPercent}%`}}
              />
            </div>
            <div className={`text-xs mt-2 transition-colors duration-200 ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`}>
              🚀 First-mover advantage • Enhanced research included
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400 p-3 rounded-r-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-star text-purple-600"></i>
              <span className={`font-medium transition-colors duration-200 ${
                isDark ? 'dark-exclusive-primary' : 'text-purple-900'
              }`}>Enhanced research available</span>
            </div>
            <div className={`text-sm transition-colors duration-200 ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Additional market validation and competitive analysis
            </div>
          </div>
        );
      }
    } else if (idea.tier === 'ai-generated' && idea.personalization) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-magic text-yellow-600"></i>
            <span className={`font-medium transition-colors duration-200 ${
              isDark ? 'dark-ai-primary' : 'text-amber-900'
            }`}>
              Personalized based on your skills & interests
            </span>
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>🤖 AI analyzed 10,000+ successful business models</div>
            <div>💡 {idea.personalization.uniqueness}</div>
            <div>🎯 {idea.metrics.successProbability} match for your profile</div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderActions = () => {
    if (idea.tier === 'public') {
      return (
        <div className="p-6 pt-0">
          <div className="flex gap-2">
            <button 
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isSaved
                  ? isDark 
                    ? 'bg-red-600 text-white hover:bg-red-700 dark-focus-visible'
                    : 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                  : isDark
                    ? 'dark-btn-secondary dark-hover dark-focus-visible'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500'
              }`}
              onClick={() => onSave(idea.id)}
            >
              <i className={`fas fa-heart mr-2 ${isSaved ? 'text-red-100' : ''}`}></i>
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button 
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'dark-btn-primary dark-focus-visible'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              }`}
              onClick={() => {
                console.log('🔥 Details button clicked for idea:', idea.id);
                console.log('🔥 Calling onView function:', onView);
                onView(idea.id);
              }}
            >
              <i className="fas fa-eye mr-2"></i>Details
            </button>
          </div>
        </div>
      );
    } else if (idea.tier === 'exclusive') {
      if (showProgressiveDisclosure) {
        return (
          <div className="p-6 pt-0">
            <div className="w-full space-y-3">
              <button 
                className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-purple-600 text-white hover:bg-purple-700 dark-focus-visible'
                    : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500'
                }`}
                onClick={() => onExclusiveClick(idea.id)}
              >
                <i className="fas fa-unlock mr-2"></i>
                Claim Exclusive Access - {idea.exclusivity?.price}
              </button>
              <button 
                className={`w-full px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  isDark
                    ? 'dark-btn-secondary dark-hover dark-focus-visible border-purple-600'
                    : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50 focus:ring-2 focus:ring-purple-500'
                }`}
                onClick={() => onView(idea.id)}
              >
                <i className="fas fa-eye mr-2"></i>Preview Benefits
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="p-6 pt-0">
            <button 
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                isDark
                  ? 'dark-btn-secondary dark-hover dark-focus-visible border-purple-600'
                  : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50 focus:ring-2 focus:ring-purple-500'
              }`}
              onClick={() => onView(idea.id)}
            >
              <i className="fas fa-eye mr-2"></i>View Enhanced Research
            </button>
          </div>
        );
      }
    } else if (idea.tier === 'ai-generated') {
      return (
        <div className="p-6 pt-0">
          <div className="flex gap-2">
            <button 
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-amber-600 text-white hover:bg-amber-700 dark-focus-visible'
                  : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
              }`}
              onClick={() => {
                console.log('🔥 Details button clicked for AI-generated idea:', idea.id);
                onView(idea.id);
              }}
            >
              <i className="fas fa-eye mr-2"></i>Details
            </button>
            <button 
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                isDark
                  ? 'dark-btn-secondary dark-hover dark-focus-visible border-amber-600'
                  : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500'
              }`}
              onClick={() => onAIGenerate(idea.id)}
            >
              <i className="fas fa-sync mr-2"></i>Generate
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const getCardStyles = () => {
    const baseStyles = "h-full rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md";
    
    if (idea.tier === 'exclusive') {
      return `${baseStyles} ${isDark ? 'dark-card-exclusive' : 'bg-white border-purple-200'}`;
    } else if (idea.tier === 'ai-generated') {
      return `${baseStyles} ${isDark ? 'dark-card-ai' : 'bg-white border-amber-200'}`;
    } else {
      return `${baseStyles} ${isDark ? 'dark-card-public' : 'bg-white border-gray-200'}`;
    }
  };

  return (
    <div className={getCardStyles()}>
      {renderCardHeader()}
      <div className="p-6">
        <p className={`mb-4 transition-colors duration-200 ${
          isDark ? 'dark-text-secondary' : 'text-gray-600'
        }`}>
          {idea.description}
        </p>
        {renderMetrics()}
        {renderSocialProof()}
      </div>
      {renderActions()}
    </div>
  );
};