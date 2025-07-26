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
    // REQUIREMENT: Keep social proof simple - no complex sections
    if (idea.socialProof?.tags && idea.socialProof.tags.length > 0) {
      return (
        <div className={`text-xs mb-4 transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {idea.socialProof.tags.slice(0, 2).join(' • ')}
        </div>
      );
    }
    return null;
  };

  const renderActions = () => {
    // REQUIREMENT: All idea cards must show Save and Details buttons only
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
            onClick={() => onView(idea.id)}
          >
            <i className="fas fa-eye mr-2"></i>Details
          </button>
        </div>
      </div>
    );
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