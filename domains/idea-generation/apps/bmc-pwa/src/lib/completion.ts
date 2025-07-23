import { AISuggestion, TodoItem, CompletionLevel } from '@/types';

/**
 * Calculate completion score for a BMC box based on multiple criteria
 */
export const calculateCompletionScore = (
  content: string,
  aiSuggestions: AISuggestion[],
  todos: TodoItem[]
): number => {
  let score = 0;
  
  // Content length scoring (40% weight)
  const contentLength = content.trim().length;
  const contentScore = Math.min(contentLength / 200, 1) * 40; // 200 chars = full score
  score += contentScore;
  
  // Word count scoring (20% weight)
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const wordScore = Math.min(wordCount / 50, 1) * 20; // 50 words = full score
  score += wordScore;
  
  // Todo completion scoring (25% weight)
  if (todos.length > 0) {
    const completedTodos = todos.filter(todo => todo.completed).length;
    const todoScore = (completedTodos / todos.length) * 25;
    score += todoScore;
  }
  
  // AI suggestion review scoring (15% weight)
  if (aiSuggestions.length > 0) {
    const reviewedSuggestions = aiSuggestions.filter(suggestion => suggestion.reviewed).length;
    const suggestionScore = (reviewedSuggestions / aiSuggestions.length) * 15;
    score += suggestionScore;
  }
  
  return Math.round(Math.min(score, 100));
};

/**
 * Convert completion score to completion level
 */
export const calculateCompletionLevel = (score: number): CompletionLevel => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'none';
};

/**
 * Get completion color based on level
 */
export const getCompletionColor = (level: CompletionLevel): string => {
  switch (level) {
    case 'high': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-orange-600 bg-orange-100';
    default: return 'text-red-600 bg-red-100';
  }
};

/**
 * Get completion text description
 */
export const getCompletionText = (level: CompletionLevel): string => {
  switch (level) {
    case 'high': return 'Well developed';
    case 'medium': return 'Partially complete';
    case 'low': return 'Needs work';
    default: return 'Not started';
  }
};

/**
 * Get completion emoji
 */
export const getCompletionEmoji = (level: CompletionLevel): string => {
  switch (level) {
    case 'high': return '✅';
    case 'medium': return '⚠️';
    case 'low': return '🔶';
    default: return '🔴';
  }
};

/**
 * Calculate overall canvas completion
 */
export const calculateOverallCompletion = (boxScores: number[]): number => {
  const totalScore = boxScores.reduce((sum, score) => sum + score, 0);
  return Math.round(totalScore / boxScores.length);
};

/**
 * Get next actions based on completion analysis
 */
export const getNextActions = (
  content: string,
  aiSuggestions: AISuggestion[],
  todos: TodoItem[]
): string[] => {
  const actions: string[] = [];
  
  // Content-based actions
  if (content.trim().length < 50) {
    actions.push('Add more detailed content');
  }
  
  if (content.trim().split(/\s+/).length < 20) {
    actions.push('Elaborate with more specific examples');
  }
  
  // AI suggestion actions
  const unreviewedSuggestions = aiSuggestions.filter(s => !s.reviewed);
  if (unreviewedSuggestions.length > 0) {
    actions.push(`Review ${unreviewedSuggestions.length} AI suggestions`);
  }
  
  if (aiSuggestions.length === 0) {
    actions.push('Request AI suggestions for ideas');
  }
  
  // Todo actions
  const pendingTodos = todos.filter(t => !t.completed);
  if (pendingTodos.length > 0) {
    actions.push(`Complete ${pendingTodos.length} pending tasks`);
  }
  
  if (todos.length === 0) {
    actions.push('Add action items to work on');
  }
  
  return actions;
};

/**
 * Priority scoring for boxes that need attention
 */
export const getPriorityScore = (
  boxType: string,
  completionScore: number,
  hasUserContent: boolean
): number => {
  let priority = 0;
  
  // Core boxes have higher priority
  const coreBoxes = ['valuePropositions', 'customerSegments', 'revenueStreams'];
  if (coreBoxes.includes(boxType)) {
    priority += 20;
  }
  
  // Low completion = high priority
  priority += (100 - completionScore) * 0.5;
  
  // No user content = higher priority
  if (!hasUserContent) {
    priority += 15;
  }
  
  return Math.round(priority);
};

/**
 * Get recommended box order for completion
 */
export const getRecommendedBoxOrder = (): string[] => {
  return [
    'valuePropositions',   // Start with core value
    'customerSegments',    // Who are we serving
    'customerRelationships', // How do we serve them
    'channels',            // How do we reach them
    'revenueStreams',      // How do we get paid
    'keyActivities',       // What must we do
    'keyResources',        // What do we need
    'keyPartners',         // Who can help us
    'costStructure'        // What will it cost
  ];
};

/**
 * Analyze canvas readiness for export/business plan generation
 */
export const analyzeCanvasReadiness = (boxScores: number[]): {
  ready: boolean;
  missingBoxes: string[];
  recommendations: string[];
} => {
  const boxNames = [
    'Key Partners', 'Key Activities', 'Value Propositions',
    'Customer Relationships', 'Customer Segments', 'Key Resources',
    'Channels', 'Cost Structure', 'Revenue Streams'
  ];
  
  const missingBoxes = boxScores
    .map((score, index) => ({ score, name: boxNames[index] }))
    .filter(box => box.score < 50)
    .map(box => box.name);
  
  const recommendations: string[] = [];
  
  if (missingBoxes.length === 0) {
    recommendations.push('Canvas is ready for business plan generation');
  } else {
    recommendations.push(`Complete ${missingBoxes.length} boxes to proceed`);
    recommendations.push('Focus on Value Propositions and Customer Segments first');
  }
  
  return {
    ready: missingBoxes.length === 0,
    missingBoxes,
    recommendations
  };
};