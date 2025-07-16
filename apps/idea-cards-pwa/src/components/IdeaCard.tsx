import React from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-business-factory/ui-components';
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
  const renderCardHeader = () => {
    let titlePrefix = '';
    let titleClass = 'text-gray-900';
    
    if (idea.tier === 'exclusive') {
      titlePrefix = '👑 ';
      titleClass = 'text-purple-900';
    } else if (idea.tier === 'ai-generated') {
      titlePrefix = '✨ ';
      titleClass = 'text-yellow-900';
    } else if (idea.icon) {
      titlePrefix = `${idea.icon} `;
      titleClass = 'text-blue-900';
    }
    
    return (
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={titleClass}>
            {titlePrefix}{idea.title}
          </CardTitle>
          {renderTierBadge()}
        </div>
      </CardHeader>
    );
  };

  const renderTierBadge = () => {
    if (idea.tier === 'exclusive') {
      return <Badge variant="premium">⭐ Premium</Badge>;
    } else if (idea.tier === 'ai-generated') {
      return <Badge variant="ai-generated">🤖 AI Generated</Badge>;
    } else if (idea.socialProof.trending) {
      return <Badge variant="trending">🔥 Trending</Badge>;
    }
    return null;
  };

  const renderMetrics = () => (
    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">🎯</span>
        <span className="font-medium">{idea.metrics.marketSize}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">💻</span>
        <span className="font-medium">{idea.metrics.techLevel}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">⏰</span>
        <span className="font-medium">{idea.metrics.timeToLaunch}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">💰</span>
        <span className="font-medium">{idea.metrics.startupCost}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">🏢</span>
        <span className="font-medium">{idea.metrics.targetMarket}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">📈</span>
        <span className="font-medium text-green-600">
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
                <span className="font-medium text-blue-900">
                  {saveText} entrepreneurs saved this idea
                </span>
              </div>
              {idea.socialProof.trending && (
                <Badge variant="trending">🔥 Trending</Badge>
              )}
            </div>
            {idea.socialProof.tags && (
              <div className="text-xs text-blue-700 mt-1">
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
                <span className="font-medium text-purple-900">
                  {remaining} of {idea.exclusivity.totalSlots} exclusive slots remaining
                </span>
              </div>
              <Badge variant="premium">⭐ Premium</Badge>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{width: `${progressPercent}%`}}
              />
            </div>
            <div className="text-xs text-purple-700 mt-2">
              🚀 First-mover advantage • Enhanced research included
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400 p-3 rounded-r-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-star text-purple-600"></i>
              <span className="font-medium text-purple-900">Enhanced research available</span>
            </div>
            <div className="text-sm text-purple-700">
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
            <span className="font-medium text-yellow-900">
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
        <CardFooter>
          <Button 
            variant={isSaved ? "save-active" : "save"} 
            className="flex-1 mr-2"
            onClick={() => onSave(idea.id)}
          >
            <i className={`fas fa-heart mr-2 ${isSaved ? 'text-red-500' : ''}`}></i>
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button 
            variant="public" 
            className="flex-1"
            onClick={() => onView(idea.id)}
          >
            <i className="fas fa-eye mr-2"></i>Details
          </Button>
        </CardFooter>
      );
    } else if (idea.tier === 'exclusive') {
      if (showProgressiveDisclosure) {
        return (
          <CardFooter>
            <div className="w-full space-y-3">
              <Button 
                variant="exclusive" 
                className="w-full"
                onClick={() => onExclusiveClick(idea.id)}
              >
                <i className="fas fa-unlock mr-2"></i>
                Claim Exclusive Access - {idea.exclusivity?.price}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onView(idea.id)}
              >
                <i className="fas fa-eye mr-2"></i>Preview Benefits
              </Button>
            </div>
          </CardFooter>
        );
      } else {
        return (
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onView(idea.id)}
            >
              <i className="fas fa-eye mr-2"></i>View Enhanced Research
            </Button>
          </CardFooter>
        );
      }
    } else if (idea.tier === 'ai-generated') {
      return (
        <CardFooter>
          <div className="w-full flex gap-3">
            <Button 
              variant="ai-generated" 
              className="flex-1"
              onClick={() => onAIGenerate(idea.id)}
            >
              <i className="fas fa-star mr-2"></i>Develop This Idea
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onAIGenerate(idea.id)}
            >
              <i className="fas fa-sync mr-2"></i>Generate Alternative
            </Button>
          </div>
        </CardFooter>
      );
    }
    
    return null;
  };

  return (
    <Card variant={idea.tier} className="h-full">
      {renderCardHeader()}
      <CardContent>
        <CardDescription className="mb-4">
          {idea.description}
        </CardDescription>
        {renderMetrics()}
        {renderSocialProof()}
      </CardContent>
      {renderActions()}
    </Card>
  );
};