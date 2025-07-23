// Business Idea Types
export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  icon?: string;
  category: IdeaCategory;
  tier: IdeaTier;
  
  // Metrics
  metrics: {
    marketSize: string;
    techLevel: string;
    timeToLaunch: string;
    startupCost: string;
    targetMarket: string;
    growthRate: string;
    successProbability?: string;
  };
  
  // Social proof data
  socialProof: {
    saveCount?: number;
    viewCount?: number;
    trending: boolean;
    tags: string[];
  };
  
  // Tier-specific data
  exclusivity?: {
    totalSlots: number;
    claimedSlots: number;
    price: string;
    benefits: string[];
  };
  
  personalization?: {
    reason: string;
    uniqueness: string;
    advantages: string[];
  };
  
  // AI-generated content metadata
  generatedBy?: string;
  generationPrompt?: string;
  validationScore?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type IdeaCategory = 
  | 'ai-automation'
  | 'saas'
  | 'fintech'
  | 'edtech'
  | 'healthcare'
  | 'ecommerce'
  | 'marketplace'
  | 'mobile'
  | 'web3'
  | 'sustainability';

export type IdeaTier = 'public' | 'exclusive' | 'ai-generated';

export interface FilterCategories {
  [key: string]: string;
}

// User State Management
export interface UserSession {
  id: string;
  sessionToken: string;
  startTime: Date;
  isLoggedIn: boolean;
  email?: string;
  
  // Progressive disclosure tracking
  ideasViewed: number;
  detailViews: number;
  filterUsage: number;
  exclusiveHovers: number;
  progressiveDisclosureActive: boolean;
  
  // Conversion tracking
  firstSaveAt?: Date;
  signupMethod?: string;
  signupTrigger?: string;
  
  // User preferences
  savedIdeaIds: string[];
  viewedIdeaIds: string[];
  currentFilter: string;
}

// Component Props
export interface IdeaCardProps {
  idea: BusinessIdea;
  isSaved: boolean;
  onSave: (ideaId: string) => void;
  onView: (ideaId: string) => void;
  onExclusiveClick: (ideaId: string) => void;
  onAIGenerate: (ideaId: string) => void;
  showProgressiveDisclosure: boolean;
}

export interface IdeaGridProps {
  ideas: BusinessIdea[];
  loading: boolean;
  savedIdeaIds: string[];
  onSave: (ideaId: string) => void;
  onView: (ideaId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  showProgressiveDisclosure: boolean;
}

export interface FilterBarProps {
  categories: FilterCategories;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onFilterUsage: () => void;
}

export interface ProgressiveHeaderProps {
  savedCount: number;
  sessionState: UserSession;
  onSignIn: () => void;
  onGetPersonalized: () => void;
}

// API Response Types
export interface IdeaResponse {
  ideas: BusinessIdea[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface UserSessionResponse {
  session: UserSession;
  shouldActivateProgressive: boolean;
}

// Event Types
export interface IdeaInteractionEvent {
  type: 'view' | 'save' | 'unsave' | 'exclusive_hover' | 'ai_generate';
  ideaId: string;
  timestamp: Date;
  sessionData: Partial<UserSession>;
}

export interface ProgressiveDisclosureEvent {
  type: 'activate' | 'trigger_check' | 'cta_reveal';
  trigger: string;
  sessionTime: number;
  metrics: {
    ideasViewed: number;
    detailViews: number;
    filterUsage: number;
    exclusiveHovers: number;
  };
}