// BMC Box Types
export type BMCBoxType = 
  | 'keyPartners'
  | 'keyActivities'
  | 'valuePropositions'
  | 'customerRelationships'
  | 'customerSegments'
  | 'keyResources'
  | 'channels'
  | 'costStructure'
  | 'revenueStreams';

// Completion levels
export type CompletionLevel = 'none' | 'low' | 'medium' | 'high';

// Todo item
export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  boxType: BMCBoxType;
}

// AI Suggestion
export interface AISuggestion {
  id: string;
  content: string;
  type: 'suggestion' | 'question' | 'template';
  confidence: number;
  createdAt: Date;
  reviewed: boolean;
}

// BMC Box Data
export interface BMCBox {
  id: string;
  type: BMCBoxType;
  title: string;
  description: string;
  content: string;
  aiSuggestions: AISuggestion[];
  todos: TodoItem[];
  completionScore: number;
  completionLevel: CompletionLevel;
  lastUpdated: Date;
  wordCount: number;
  hasUserContent: boolean;
}

// Canvas metadata
export interface CanvasMetadata {
  id: string;
  title: string;
  description: string;
  industry: string;
  targetMarket: string;
  opportunityId?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  collaborators: string[];
  isPublic: boolean;
  tags: string[];
}

// Complete BMC
export interface BusinessModelCanvas {
  metadata: CanvasMetadata;
  boxes: Record<BMCBoxType, BMCBox>;
  overallCompletion: number;
  exportFormats: string[];
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline';
  lastSyncAt?: Date;
}

// AI Model types
export type AIModel = 'claude-haiku' | 'claude-sonnet' | 'claude-opus' | 'gpt-4-turbo';

// AI Request
export interface AIRequest {
  prompt: string;
  context: string;
  boxType: BMCBoxType;
  model: AIModel;
  maxTokens: number;
  temperature: number;
  priority: 'low' | 'medium' | 'high';
}

// AI Response
export interface AIResponse {
  id: string;
  request: AIRequest;
  content: string;
  model: AIModel;
  tokensUsed: number;
  cost: number;
  latency: number;
  cached: boolean;
  createdAt: Date;
  quality: number;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  aiModel: AIModel;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultIndustry: string;
  displayMode: 'mobile' | 'tablet' | 'desktop';
  touchMode: boolean;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  error: string | null;
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'png' | 'markdown' | 'docx' | 'json';
  includeAISuggestions: boolean;
  includeTodos: boolean;
  includeVersionHistory: boolean;
  template: string;
  branding: boolean;
}

// Collaboration
export interface CollaborationEvent {
  id: string;
  canvasId: string;
  userId: string;
  type: 'edit' | 'comment' | 'suggestion' | 'completion';
  boxType?: BMCBoxType;
  content: string;
  timestamp: Date;
}

// Notification
export interface Notification {
  id: string;
  type: 'ai_suggestion' | 'collaboration' | 'sync_complete' | 'error';
  title: string;
  message: string;
  canvasId?: string;
  boxType?: BMCBoxType;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// User session
export interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'starter' | 'professional' | 'enterprise';
  usage: {
    canvasesUsed: number;
    aiRequestsUsed: number;
    exportsUsed: number;
    monthlyLimit: {
      canvases: number;
      aiRequests: number;
      exports: number;
    };
  };
  preferences: UserPreferences;
  lastActivity: Date;
}

// PWA Installation Event
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }
  
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}