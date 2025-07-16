import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle } from 'lucide-react';
import { BMCBox as BMCBoxType, BMCBoxType as BoxType, CompletionLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AISuggestions } from './AISuggestions';
import { TodoList } from './TodoList';
import { cn } from '@/lib/utils';

interface BMCBoxProps {
  config: {
    type: BoxType;
    title: string;
    description: string;
    icon: string;
    color: string;
  };
  data: BMCBoxType;
  onUpdate: (boxType: BoxType, content: string) => void;
  onClick: () => void;
  isMobile: boolean;
  isSelected: boolean;
  // AI functionality
  onRequestAISuggestions: (boxType: BoxType) => Promise<void>;
  onApplySuggestion: (boxType: BoxType, suggestion: any) => Promise<void>;
  // Todo functionality
  onAddTodo: (boxType: BoxType, content: string) => Promise<void>;
  onToggleTodo: (boxType: BoxType, todoId: string) => Promise<void>;
  onDeleteTodo: (boxType: BoxType, todoId: string) => Promise<void>;
}

const getCompletionColor = (level: CompletionLevel) => {
  switch (level) {
    case 'high': return 'bg-bmc-green border-bmc-green';
    case 'medium': return 'bg-bmc-yellow border-bmc-yellow';
    case 'low': return 'bg-bmc-orange border-bmc-orange';
    default: return 'bg-bmc-red border-bmc-red';
  }
};

const getCompletionText = (level: CompletionLevel) => {
  switch (level) {
    case 'high': return 'Well developed';
    case 'medium': return 'Partially complete';
    case 'low': return 'Needs work';
    default: return 'Not started';
  }
};

export const BMCBox: React.FC<BMCBoxProps> = ({
  config,
  data,
  onUpdate,
  onClick,
  isMobile,
  isSelected,
  onRequestAISuggestions,
  onApplySuggestion,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'suggestions' | 'todos'>('content');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(config.type, e.target.value);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const completionPercentage = Math.round(data.completionScore);
  const hasAISuggestions = data.aiSuggestions.length > 0;
  const hasTodos = data.todos.length > 0;
  const completedTodos = data.todos.filter(todo => todo.completed).length;

  return (
    <motion.div
      layout
      className={cn(
        'bmc-box',
        `completed-${data.completionLevel}`,
        isSelected && 'ring-2 ring-primary ring-offset-2',
        config.color
      )}
      onClick={onClick}
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl" role="img" aria-label={config.title}>
            {config.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {config.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {config.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Completion indicator */}
          <div className={cn(
            'w-3 h-3 rounded-full',
            getCompletionColor(data.completionLevel)
          )} />
          
          {/* Expand button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Completion status */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className="text-xs">
            {completionPercentage}% complete
          </Badge>
          <span className="text-xs text-gray-500">
            {getCompletionText(data.completionLevel)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <motion.div
            className={cn(
              'h-1.5 rounded-full',
              data.completionLevel === 'high' ? 'bg-bmc-green' :
              data.completionLevel === 'medium' ? 'bg-bmc-yellow' :
              data.completionLevel === 'low' ? 'bg-bmc-orange' : 'bg-bmc-red'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Content preview */}
      <div className="mb-3">
        <Textarea
          ref={textareaRef}
          value={data.content}
          onChange={handleContentChange}
          placeholder={`Start writing about ${config.title.toLowerCase()}...`}
          className="min-h-[80px] resize-none text-sm"
          onClick={(e) => e.stopPropagation()}
          rows={isMobile ? 3 : 4}
        />
      </div>

      {/* Quick indicators */}
      <div className="flex items-center gap-2 mb-3">
        {hasAISuggestions && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {data.aiSuggestions.length} suggestions
          </Badge>
        )}
        
        {hasTodos && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {completedTodos}/{data.todos.length} done
          </Badge>
        )}
        
        <Badge variant="outline" className="text-xs">
          {data.wordCount} words
        </Badge>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
              <Button
                variant={activeTab === 'content' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('content')}
                className="rounded-none border-none h-8 text-xs"
              >
                Content
              </Button>
              <Button
                variant={activeTab === 'suggestions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('suggestions')}
                className="rounded-none border-none h-8 text-xs relative"
              >
                AI Suggestions
                {hasAISuggestions && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {data.aiSuggestions.length}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === 'todos' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('todos')}
                className="rounded-none border-none h-8 text-xs relative"
              >
                To-Do
                {hasTodos && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {data.todos.length - completedTodos}
                  </span>
                )}
              </Button>
            </div>

            {/* Tab content */}
            <div className="min-h-[150px]">
              {activeTab === 'content' && (
                <div className="space-y-3">
                  <Textarea
                    value={data.content}
                    onChange={handleContentChange}
                    placeholder={`Elaborate on ${config.title.toLowerCase()}...`}
                    className="min-h-[120px] resize-none text-sm"
                    rows={6}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2"
                    onClick={() => onRequestAISuggestions(config.type)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Get AI Suggestions
                  </Button>
                </div>
              )}

              {activeTab === 'suggestions' && (
                <AISuggestions
                  suggestions={data.aiSuggestions}
                  onApply={(suggestion) => onApplySuggestion(config.type, suggestion)}
                  onRequest={() => onRequestAISuggestions(config.type)}
                  onDismiss={(suggestionId) => {
                    // TODO: Implement dismiss functionality
                    console.log('Dismiss suggestion:', suggestionId);
                  }}
                />
              )}

              {activeTab === 'todos' && (
                <TodoList
                  todos={data.todos}
                  onToggle={(todoId) => onToggleTodo(config.type, todoId)}
                  onAdd={(content) => onAddTodo(config.type, content)}
                  onDelete={(todoId) => onDeleteTodo(config.type, todoId)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};