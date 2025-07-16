import { useState, useEffect, useCallback } from 'react';
import { BusinessModelCanvas, BMCBoxType, AISuggestion, TodoItem } from '@/types';
import { canvasDB, aiSuggestionsDB, todosDB } from '@/lib/database';
import { calculateCompletionScore, calculateCompletionLevel } from '@/lib/completion';
import { syncService } from '@/lib/sync';
import { aiService } from '@/lib/ai-service';

const DEFAULT_CANVAS: BusinessModelCanvas = {
  metadata: {
    id: 'default',
    title: 'My Business Model Canvas',
    description: 'A new business model canvas',
    industry: '',
    targetMarket: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    collaborators: [],
    isPublic: false,
    tags: []
  },
  boxes: {
    keyPartners: {
      id: 'keyPartners',
      type: 'keyPartners',
      title: 'Key Partners',
      description: 'Who are our key partners and suppliers?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    keyActivities: {
      id: 'keyActivities',
      type: 'keyActivities',
      title: 'Key Activities',
      description: 'What key activities does our value proposition require?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    valuePropositions: {
      id: 'valuePropositions',
      type: 'valuePropositions',
      title: 'Value Propositions',
      description: 'What value do we deliver to the customer?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    customerRelationships: {
      id: 'customerRelationships',
      type: 'customerRelationships',
      title: 'Customer Relationships',
      description: 'What type of relationship does each customer segment expect?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    customerSegments: {
      id: 'customerSegments',
      type: 'customerSegments',
      title: 'Customer Segments',
      description: 'For whom are we creating value?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    keyResources: {
      id: 'keyResources',
      type: 'keyResources',
      title: 'Key Resources',
      description: 'What key resources does our value proposition require?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    channels: {
      id: 'channels',
      type: 'channels',
      title: 'Channels',
      description: 'Through which channels do we reach our customers?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    costStructure: {
      id: 'costStructure',
      type: 'costStructure',
      title: 'Cost Structure',
      description: 'What are the most important costs inherent in our business model?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    },
    revenueStreams: {
      id: 'revenueStreams',
      type: 'revenueStreams',
      title: 'Revenue Streams',
      description: 'For what value are our customers willing to pay?',
      content: '',
      aiSuggestions: [],
      todos: [],
      completionScore: 0,
      completionLevel: 'none',
      lastUpdated: new Date(),
      wordCount: 0,
      hasUserContent: false
    }
  },
  overallCompletion: 0,
  exportFormats: ['pdf', 'png', 'markdown'],
  syncStatus: navigator.onLine ? 'synced' : 'offline',
  lastSyncAt: undefined
};

export const useCanvas = (canvasId: string = 'default') => {
  const [canvas, setCanvas] = useState<BusinessModelCanvas>(DEFAULT_CANVAS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<number | null>(null);

  // Load canvas from IndexedDB
  const loadCanvas = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedCanvas = await canvasDB.getCanvas(canvasId);
      
      if (savedCanvas) {
        // Load todos for each box type and merge with canvas
        const canvasWithTodos = { ...savedCanvas };
        
        for (const boxType of Object.keys(savedCanvas.boxes) as BMCBoxType[]) {
          const todos = await todosDB.getTodosByBox(boxType);
          canvasWithTodos.boxes[boxType] = {
            ...savedCanvas.boxes[boxType],
            todos: todos || []
          };
        }
        
        setCanvas(canvasWithTodos);
      } else {
        // Create new canvas
        const newCanvas = { ...DEFAULT_CANVAS, metadata: { ...DEFAULT_CANVAS.metadata, id: canvasId } };
        await canvasDB.saveCanvas(newCanvas);
        setCanvas(newCanvas);
      }
    } catch (err) {
      setError('Failed to load canvas');
      console.error('Error loading canvas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [canvasId]);

  // Save canvas to IndexedDB
  const saveCanvas = useCallback(async (updatedCanvas: BusinessModelCanvas) => {
    try {
      await canvasDB.saveCanvas(updatedCanvas);
      
      // Attempt to sync with server if online
      if (navigator.onLine) {
        try {
          await syncService.syncCanvas(updatedCanvas);
          setCanvas(prev => ({ ...prev, syncStatus: 'synced', lastSyncAt: new Date() }));
        } catch (syncError) {
          console.warn('Sync failed:', syncError);
          setCanvas(prev => ({ ...prev, syncStatus: 'pending' }));
        }
      } else {
        setCanvas(prev => ({ ...prev, syncStatus: 'offline' }));
      }
    } catch (err) {
      setError('Failed to save canvas');
      console.error('Error saving canvas:', err);
    }
  }, []);

  // Update a specific box
  const updateBox = useCallback((boxType: BMCBoxType, content: string) => {
    setCanvas(prev => {
      const wordCount = content.trim().split(/\\s+/).filter(word => word.length > 0).length;
      const completionScore = calculateCompletionScore(content, prev.boxes[boxType].aiSuggestions, prev.boxes[boxType].todos);
      const completionLevel = calculateCompletionLevel(completionScore);
      
      const updatedBox = {
        ...prev.boxes[boxType],
        content,
        wordCount,
        completionScore,
        completionLevel,
        lastUpdated: new Date(),
        hasUserContent: content.trim().length > 0
      };

      const updatedBoxes = { ...prev.boxes, [boxType]: updatedBox };
      
      // Calculate overall completion
      const overallCompletion = Math.round(
        Object.values(updatedBoxes).reduce((sum, box) => sum + box.completionScore, 0) / 9
      );

      const updatedCanvas = {
        ...prev,
        boxes: updatedBoxes,
        overallCompletion,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date()
        },
        syncStatus: 'pending' as const
      };

      // Auto-save with debounce
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        saveCanvas(updatedCanvas);
      }, 1000); // 1 second debounce
      
      setAutoSaveTimer(timer as any);
      
      return updatedCanvas;
    });
  }, [autoSaveTimer, saveCanvas]);

  // Update canvas metadata
  const updateMetadata = useCallback((updates: Partial<BusinessModelCanvas['metadata']>) => {
    setCanvas(prev => {
      const updatedCanvas = {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...updates,
          updatedAt: new Date()
        },
        syncStatus: 'pending' as const
      };

      saveCanvas(updatedCanvas);
      return updatedCanvas;
    });
  }, [saveCanvas]);

  // Export canvas
  const exportCanvas = useCallback(async (format: string) => {
    try {
      // This would integrate with export service
      console.log('Exporting canvas as', format);
      // TODO: Implement export functionality
    } catch (err) {
      setError('Failed to export canvas');
      console.error('Error exporting canvas:', err);
    }
  }, []);

  // Load canvas on mount
  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Handle online/offline sync
  useEffect(() => {
    // Set initial sync status based on network state
    setCanvas(prev => ({ 
      ...prev, 
      syncStatus: navigator.onLine ? 'synced' : 'offline' 
    }));

    const handleOnline = () => {
      setCanvas(prev => ({ ...prev, syncStatus: 'synced' }));
      // Auto-sync if we were previously offline
      if (canvas.syncStatus === 'offline' || canvas.syncStatus === 'pending') {
        saveCanvas(canvas);
      }
    };

    const handleOffline = () => {
      setCanvas(prev => ({ ...prev, syncStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [canvas, saveCanvas]);

  // AI Suggestions functionality
  const requestAISuggestions = useCallback(async (boxType: BMCBoxType) => {
    try {
      const boxData = canvas.boxes[boxType];
      const suggestions = await aiService.getSuggestions(
        boxType,
        boxData.content,
        JSON.stringify(canvas.metadata)
      );

      // Update box with new suggestions
      setCanvas(prev => ({
        ...prev,
        boxes: {
          ...prev.boxes,
          [boxType]: {
            ...prev.boxes[boxType],
            aiSuggestions: [...prev.boxes[boxType].aiSuggestions, ...suggestions]
          }
        }
      }));

      // Save suggestions to database
      for (const suggestion of suggestions) {
        await aiSuggestionsDB.addSuggestion(suggestion);
      }

    } catch (err) {
      setError('Failed to get AI suggestions');
      console.error('AI suggestions error:', err);
      throw err;
    }
  }, [canvas]);

  const applySuggestion = useCallback(async (boxType: BMCBoxType, suggestion: AISuggestion) => {
    const currentContent = canvas.boxes[boxType].content;
    const newContent = currentContent + (currentContent ? '\n\n' : '') + suggestion.content;
    
    // Update content
    updateBox(boxType, newContent);
    
    // Mark suggestion as reviewed
    await aiSuggestionsDB.markAsReviewed(suggestion.id);
    
    // Update local state
    setCanvas(prev => ({
      ...prev,
      boxes: {
        ...prev.boxes,
        [boxType]: {
          ...prev.boxes[boxType],
          aiSuggestions: prev.boxes[boxType].aiSuggestions.map(s =>
            s.id === suggestion.id ? { ...s, reviewed: true } : s
          )
        }
      }
    }));
  }, [canvas, updateBox]);

  // Todo functionality
  const addTodo = useCallback(async (boxType: BMCBoxType, content: string) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      boxType
    };

    // Add to database
    await todosDB.addTodo(newTodo);

    // Update canvas
    setCanvas(prev => ({
      ...prev,
      boxes: {
        ...prev.boxes,
        [boxType]: {
          ...prev.boxes[boxType],
          todos: [...prev.boxes[boxType].todos, newTodo]
        }
      }
    }));

  }, []);

  const toggleTodo = useCallback(async (boxType: BMCBoxType, todoId: string) => {
    // Update database
    await todosDB.toggleTodo(todoId);

    // Update canvas
    setCanvas(prev => ({
      ...prev,
      boxes: {
        ...prev.boxes,
        [boxType]: {
          ...prev.boxes[boxType],
          todos: prev.boxes[boxType].todos.map(todo =>
            todo.id === todoId 
              ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
              : todo
          )
        }
      }
    }));
  }, []);

  const deleteTodo = useCallback(async (boxType: BMCBoxType, todoId: string) => {
    // Remove from database
    await todosDB.deleteTodo(todoId);

    // Update canvas
    setCanvas(prev => ({
      ...prev,
      boxes: {
        ...prev.boxes,
        [boxType]: {
          ...prev.boxes[boxType],
          todos: prev.boxes[boxType].todos.filter(todo => todo.id !== todoId)
        }
      }
    }));
  }, []);

  // Generate business plan
  const generateBusinessPlan = useCallback(async () => {
    try {
      const businessPlan = await aiService.generateBusinessPlan(canvas);
      return businessPlan;
    } catch (err) {
      setError('Failed to generate business plan');
      console.error('Business plan generation error:', err);
      throw err;
    }
  }, [canvas]);

  return {
    canvas,
    isLoading,
    error,
    updateBox,
    updateMetadata,
    exportCanvas,
    reload: loadCanvas,
    // AI functionality
    requestAISuggestions,
    applySuggestion,
    generateBusinessPlan,
    // Todo functionality
    addTodo,
    toggleTodo,
    deleteTodo
  };
};