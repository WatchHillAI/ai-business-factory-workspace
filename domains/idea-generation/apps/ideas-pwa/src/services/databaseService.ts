import { DetailedIdea } from '../types/detailedIdea';

/**
 * Database Service for Business Ideas CRUD operations
 * Connects to AWS Lambda CRUD API for persistent storage
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private apiEndpoint: string;

  private constructor() {
    // Use environment variable for API endpoint, fallback to local development
    this.apiEndpoint = import.meta.env.VITE_CRUD_API_URL || 'https://api.example.com/dev/ideas';
    console.log('🗃️ Database service initialized with endpoint:', this.apiEndpoint);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Save a business idea to the database
   */
  async saveIdea(idea: DetailedIdea): Promise<{ id: string; created_at: string; updated_at: string }> {
    console.log('💾 Saving business idea to database:', idea.title);
    
    try {
      const response = await fetch(`${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(idea)
      });

      if (!response.ok) {
        throw new Error(`Failed to save idea: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Idea saved successfully:', {
        id: result.id,
        title: idea.title,
        created_at: result.created_at
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to save idea to database:', error);
      throw error;
    }
  }

  /**
   * Get a specific business idea by ID
   */
  async getIdea(ideaId: string): Promise<DetailedIdea> {
    console.log('🔍 Fetching business idea from database:', ideaId);
    
    try {
      const response = await fetch(`${this.apiEndpoint}/${ideaId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Idea not found: ${ideaId}`);
        }
        throw new Error(`Failed to fetch idea: ${response.status} ${response.statusText}`);
      }

      const idea = await response.json();
      console.log('✅ Idea fetched successfully:', {
        id: idea.id,
        title: idea.title,
        updated_at: idea.updated_at
      });

      return idea;
    } catch (error) {
      console.error('❌ Failed to fetch idea from database:', error);
      throw error;
    }
  }

  /**
   * List business ideas with filtering and pagination
   */
  async listIdeas(options: {
    limit?: number;
    offset?: number;
    tier?: 'public' | 'exclusive' | 'ai-generated';
    minConfidence?: number;
    search?: string;
    sortBy?: 'created_at' | 'updated_at' | 'confidence_overall' | 'market_size_tam' | 'title';
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    ideas: Array<{
      id: string;
      title: string;
      description: string;
      tier: string;
      confidence_overall: number;
      market_size_tam: number;
      created_at: string;
      updated_at: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    console.log('📋 Fetching business ideas list from database with options:', options);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.tier) params.append('tier', options.tier);
      if (options.minConfidence) params.append('minConfidence', options.minConfidence.toString());
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const url = `${this.apiEndpoint}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ideas list: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Ideas list fetched successfully:', {
        count: result.ideas.length,
        total: result.pagination.total,
        hasMore: result.pagination.hasMore
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch ideas list from database:', error);
      throw error;
    }
  }

  /**
   * Update an existing business idea
   */
  async updateIdea(ideaId: string, updates: Partial<DetailedIdea>): Promise<DetailedIdea> {
    console.log('📝 Updating business idea in database:', ideaId);
    
    try {
      const response = await fetch(`${this.apiEndpoint}/${ideaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Idea not found: ${ideaId}`);
        }
        throw new Error(`Failed to update idea: ${response.status} ${response.statusText}`);
      }

      const updatedIdea = await response.json();
      console.log('✅ Idea updated successfully:', {
        id: updatedIdea.id,
        title: updatedIdea.title,
        updated_at: updatedIdea.updated_at
      });

      return updatedIdea;
    } catch (error) {
      console.error('❌ Failed to update idea in database:', error);
      throw error;
    }
  }

  /**
   * Delete a business idea
   */
  async deleteIdea(ideaId: string): Promise<{ id: string; title: string; deleted: boolean }> {
    console.log('🗑️ Deleting business idea from database:', ideaId);
    
    try {
      const response = await fetch(`${this.apiEndpoint}/${ideaId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Idea not found: ${ideaId}`);
        }
        throw new Error(`Failed to delete idea: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Idea deleted successfully:', {
        id: result.id,
        title: result.title
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to delete idea from database:', error);
      throw error;
    }
  }

  /**
   * Check if database service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list ideas with limit 1 as a health check
      await this.listIdeas({ limit: 1 });
      console.log('✅ Database service is healthy');
      return true;
    } catch (error) {
      console.warn('⚠️ Database service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();