import { BusinessModelCanvas, APIResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || null; // No default API - will work offline only

export class SyncService {
  private isOnline = navigator.onLine;
  private syncQueue: BusinessModelCanvas[] = [];
  private syncInProgress = false;

  constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Sync canvas with server
   */
  async syncCanvas(canvas: BusinessModelCanvas): Promise<void> {
    // If no API URL is configured, skip sync (local-only mode)
    if (!API_BASE_URL) {
      console.log('No API configured - operating in local-only mode');
      return;
    }

    if (!this.isOnline) {
      this.addToSyncQueue(canvas);
      throw new Error('Offline - canvas queued for sync');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvases/${canvas.metadata.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(canvas)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result: APIResponse<BusinessModelCanvas> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown sync error');
      }

      // Update local canvas with server version if needed
      if (result.data && result.data.metadata.version > canvas.metadata.version) {
        // Handle version conflict
        throw new Error('Version conflict - server has newer version');
      }

    } catch (error) {
      this.addToSyncQueue(canvas);
      throw error;
    }
  }

  /**
   * Download canvas from server
   */
  async downloadCanvas(canvasId: string): Promise<BusinessModelCanvas> {
    if (!API_BASE_URL) {
      throw new Error('No API configured - download not available');
    }

    if (!this.isOnline) {
      throw new Error('Cannot download canvas while offline');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvases/${canvasId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const result: APIResponse<BusinessModelCanvas> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Canvas not found');
      }

      return result.data;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Get list of user's canvases from server
   */
  async getCanvasList(): Promise<BusinessModelCanvas[]> {
    if (!this.isOnline) {
      throw new Error('Cannot fetch canvas list while offline');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvases`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const result: APIResponse<BusinessModelCanvas[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch canvas list');
      }

      return result.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  /**
   * Delete canvas from server
   */
  async deleteCanvas(canvasId: string): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot delete canvas while offline');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvases/${canvasId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const result: APIResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * Add canvas to sync queue
   */
  private addToSyncQueue(canvas: BusinessModelCanvas): void {
    // Remove any existing version of this canvas from queue
    this.syncQueue = this.syncQueue.filter(c => c.metadata.id !== canvas.metadata.id);
    
    // Add current version to queue
    this.syncQueue.push(canvas);
  }

  /**
   * Process sync queue when coming back online
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const canvas = this.syncQueue.shift();
      if (canvas) {
        await this.syncCanvas(canvas);
        // Recursively process next item
        await this.processSyncQueue();
      }
    } catch (error) {
      console.error('Sync queue processing error:', error);
      // Continue processing other items
      await this.processSyncQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // This would integrate with your authentication system
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate token expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }
    } catch (error) {
      throw new Error('Invalid token');
    }

    return token;
  }

  /**
   * Get sync queue status
   */
  getSyncStatus(): {
    isOnline: boolean;
    queueLength: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Force sync all queued canvases
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.processSyncQueue();
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue = [];
  }
}

export const syncService = new SyncService();

/**
 * S3 Storage Service for canvas files
 */
export class S3StorageService {
  private bucketName = import.meta.env.VITE_S3_BUCKET || 'ai-business-factory-bmcs';
  // private region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

  /**
   * Upload canvas to S3
   */
  async uploadCanvas(canvas: BusinessModelCanvas): Promise<string> {
    const key = `canvases/${canvas.metadata.id}/canvas.json`;
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          bucket: this.bucketName,
          key,
          contentType: 'application/json'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl } = await response.json();

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(canvas)
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      return key;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  /**
   * Download canvas from S3
   */
  async downloadCanvas(canvasId: string): Promise<BusinessModelCanvas> {
    const key = `canvases/${canvasId}/canvas.json`;
    
    try {
      const response = await fetch(`${API_BASE_URL}/download-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          bucket: this.bucketName,
          key
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { downloadUrl } = await response.json();

      // Download from S3
      const downloadResponse = await fetch(downloadUrl);

      if (!downloadResponse.ok) {
        throw new Error('Failed to download from S3');
      }

      return await downloadResponse.json();
    } catch (error) {
      console.error('S3 download error:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }
}

export const s3StorageService = new S3StorageService();