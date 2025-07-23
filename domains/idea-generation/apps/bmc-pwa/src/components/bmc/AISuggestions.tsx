import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ThumbsUp, ThumbsDown, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISuggestion } from '@/types';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onApply: (suggestion: AISuggestion) => void;
  onRequest: () => void;
  onDismiss?: (suggestionId: string) => void;
  className?: string;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onApply,
  onRequest,
  onDismiss,
  className
}) => {
  const [loadingNew, setLoadingNew] = React.useState(false);

  const handleRequestNew = async () => {
    setLoadingNew(true);
    try {
      await onRequest();
    } finally {
      setLoadingNew(false);
    }
  };

  const handleApply = (suggestion: AISuggestion) => {
    onApply(suggestion);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
  };

  if (suggestions.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            No AI suggestions yet
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Get personalized suggestions to improve this section
          </p>
          <Button
            onClick={handleRequestNew}
            disabled={loadingNew}
            size="sm"
            className="gap-2"
          >
            {loadingNew ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Get AI Suggestions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          AI Suggestions
        </h3>
        <Button
          onClick={handleRequestNew}
          disabled={loadingNew}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {loadingNew ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'ai-suggestion',
                !suggestion.reviewed && 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={suggestion.type === 'suggestion' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {suggestion.type}
                    </Badge>
                    
                    {suggestion.confidence > 0.8 && (
                      <Badge variant="success" className="text-xs">
                        High confidence
                      </Badge>
                    )}
                    
                    {!suggestion.reviewed && (
                      <Badge variant="info" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {suggestion.content}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleApply(suggestion)}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Apply
                    </Button>
                    
                    <Button
                      onClick={() => handleCopy(suggestion.content)}
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                    
                    <Button
                      onClick={() => onDismiss?.(suggestion.id)}
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};