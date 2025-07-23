import Dexie, { Table } from 'dexie';
import { BusinessModelCanvas, AISuggestion, TodoItem, Notification, UserSession } from '@/types';

export class BMCDatabase extends Dexie {
  canvases!: Table<BusinessModelCanvas>;
  aiSuggestions!: Table<AISuggestion>;
  todos!: Table<TodoItem>;
  notifications!: Table<Notification>;
  userSessions!: Table<UserSession>;

  constructor() {
    super('BMCDatabase');
    
    this.version(1).stores({
      canvases: 'metadata.id, metadata.createdAt, metadata.updatedAt, metadata.industry, metadata.tags, syncStatus',
      aiSuggestions: 'id, createdAt, type, reviewed',
      todos: 'id, createdAt, completed',
      notifications: 'id, createdAt, read, type, canvasId',
      userSessions: 'id, lastActivity'
    });

    this.version(2).stores({
      canvases: 'metadata.id, metadata.createdAt, metadata.updatedAt, metadata.industry, metadata.tags, syncStatus',
      aiSuggestions: 'id, createdAt, type, reviewed',
      todos: 'id, createdAt, completed, boxType',
      notifications: 'id, createdAt, read, type, canvasId',
      userSessions: 'id, lastActivity'
    });

    this.canvases.hook('creating', (_primKey, obj, _trans) => {
      const canvas = obj as BusinessModelCanvas;
      canvas.metadata.createdAt = new Date();
      canvas.metadata.updatedAt = new Date();
      canvas.syncStatus = 'pending';
    });

    this.canvases.hook('updating', (modifications, _primKey, obj, _trans) => {
      const canvas = obj as BusinessModelCanvas;
      (modifications as any).metadata = {
        ...canvas.metadata,
        updatedAt: new Date()
      };
      (modifications as any).syncStatus = 'pending';
    });
  }
}

export const db = new BMCDatabase();

// Canvas operations
export const canvasDB = {
  async getCanvas(id: string): Promise<BusinessModelCanvas | undefined> {
    return await db.canvases.get(id);
  },

  async saveCanvas(canvas: BusinessModelCanvas): Promise<void> {
    await db.canvases.put(canvas);
  },

  async getAllCanvases(): Promise<BusinessModelCanvas[]> {
    return await db.canvases.orderBy('metadata.updatedAt').reverse().toArray();
  },

  async deleteCanvas(id: string): Promise<void> {
    await db.canvases.delete(id);
  },

  async searchCanvases(query: string): Promise<BusinessModelCanvas[]> {
    return await db.canvases
      .filter(canvas => 
        canvas.metadata.title.toLowerCase().includes(query.toLowerCase()) ||
        canvas.metadata.description.toLowerCase().includes(query.toLowerCase()) ||
        canvas.metadata.industry.toLowerCase().includes(query.toLowerCase()) ||
        canvas.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async getCanvasesByIndustry(industry: string): Promise<BusinessModelCanvas[]> {
    return await db.canvases
      .where('metadata.industry')
      .equals(industry)
      .toArray();
  },

  async getPendingSyncCanvases(): Promise<BusinessModelCanvas[]> {
    return await db.canvases
      .where('syncStatus')
      .equals('pending')
      .toArray();
  },

  async markAsSynced(id: string): Promise<void> {
    await db.canvases.update(id, { 
      syncStatus: 'synced', 
      lastSyncAt: new Date() 
    });
  },

  async markAsConflict(id: string): Promise<void> {
    await db.canvases.update(id, { syncStatus: 'conflict' });
  }
};

// AI Suggestions operations
export const aiSuggestionsDB = {
  async addSuggestion(suggestion: AISuggestion): Promise<void> {
    await db.aiSuggestions.add(suggestion);
  },

  async getSuggestions(limit: number = 50): Promise<AISuggestion[]> {
    return await db.aiSuggestions
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async markAsReviewed(id: string): Promise<void> {
    await db.aiSuggestions.update(id, { reviewed: true });
  },

  async deleteSuggestion(id: string): Promise<void> {
    await db.aiSuggestions.delete(id);
  },

  async getUnreviewedSuggestions(): Promise<AISuggestion[]> {
    return await db.aiSuggestions
      .where('reviewed')
      .equals(0)
      .toArray();
  }
};

// Todo operations
export const todosDB = {
  async addTodo(todo: TodoItem): Promise<void> {
    await db.todos.add(todo);
  },

  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<void> {
    await db.todos.update(id, { ...updates, updatedAt: new Date() });
  },

  async toggleTodo(id: string): Promise<void> {
    const todo = await db.todos.get(id);
    if (todo) {
      await db.todos.update(id, { 
        completed: !todo.completed, 
        updatedAt: new Date() 
      });
    }
  },

  async deleteTodo(id: string): Promise<void> {
    await db.todos.delete(id);
  },

  async getCompletedTodos(): Promise<TodoItem[]> {
    return await db.todos
      .where('completed')
      .equals(1)
      .toArray();
  },

  async getPendingTodos(): Promise<TodoItem[]> {
    return await db.todos
      .where('completed')
      .equals(0)
      .toArray();
  },

  async getTodosByBox(boxType: string): Promise<TodoItem[]> {
    return await db.todos
      .where('boxType')
      .equals(boxType)
      .toArray();
  }
};

// Notification operations
export const notificationsDB = {
  async addNotification(notification: Notification): Promise<void> {
    await db.notifications.add(notification);
  },

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    return await db.notifications
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async markAsRead(id: string): Promise<void> {
    await db.notifications.update(id, { read: true });
  },

  async markAllAsRead(): Promise<void> {
    await db.notifications
      .where('read')
      .equals(0)
      .modify({ read: true });
  },

  async deleteNotification(id: string): Promise<void> {
    await db.notifications.delete(id);
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    return await db.notifications
      .where('read')
      .equals(0)
      .toArray();
  },

  async getNotificationsByCanvas(canvasId: string): Promise<Notification[]> {
    return await db.notifications
      .where('canvasId')
      .equals(canvasId)
      .toArray();
  }
};

// User session operations
export const userSessionDB = {
  async saveSession(session: UserSession): Promise<void> {
    await db.userSessions.put(session);
  },

  async getSession(id: string): Promise<UserSession | undefined> {
    return await db.userSessions.get(id);
  },

  async getCurrentSession(): Promise<UserSession | undefined> {
    return await db.userSessions
      .orderBy('lastActivity')
      .reverse()
      .first();
  },

  async updateActivity(id: string): Promise<void> {
    await db.userSessions.update(id, { lastActivity: new Date() });
  },

  async clearSession(id: string): Promise<void> {
    await db.userSessions.delete(id);
  }
};

// Database management
export const dbUtils = {
  async clearAllData(): Promise<void> {
    await db.transaction('rw', db.canvases, db.aiSuggestions, db.todos, db.notifications, db.userSessions, async () => {
      await db.canvases.clear();
      await db.aiSuggestions.clear();
      await db.todos.clear();
      await db.notifications.clear();
      await db.userSessions.clear();
    });
  },

  async exportData(): Promise<object> {
    return {
      canvases: await db.canvases.toArray(),
      aiSuggestions: await db.aiSuggestions.toArray(),
      todos: await db.todos.toArray(),
      notifications: await db.notifications.toArray(),
      userSessions: await db.userSessions.toArray(),
      exportedAt: new Date()
    };
  },

  async importData(data: any): Promise<void> {
    await db.transaction('rw', db.canvases, db.aiSuggestions, db.todos, db.notifications, db.userSessions, async () => {
      if (data.canvases) await db.canvases.bulkPut(data.canvases);
      if (data.aiSuggestions) await db.aiSuggestions.bulkPut(data.aiSuggestions);
      if (data.todos) await db.todos.bulkPut(data.todos);
      if (data.notifications) await db.notifications.bulkPut(data.notifications);
      if (data.userSessions) await db.userSessions.bulkPut(data.userSessions);
    });
  },

  async getDatabaseSize(): Promise<number> {
    const estimate = await navigator.storage?.estimate();
    return estimate?.usage || 0;
  },

  async getStorageQuota(): Promise<number> {
    const estimate = await navigator.storage?.estimate();
    return estimate?.quota || 0;
  }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await db.open();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Close database
export const closeDatabase = async (): Promise<void> => {
  await db.close();
};