import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface ChatContextDB extends DBSchema {
  contexts: {
    key: string; // chatId + timestamp
    value: ChatContext;
    indexes: {
      'by-chat-id': string;
      'by-timestamp': number;
    };
  };
}

// Define the chat context interface
export interface ChatContext {
  id: string;
  chatId: string;
  timestamp: number;
  folderInfo?: {
    path: string;
    fileCount: number;
    files: Array<{
      name: string;
      type: string;
      size: number;
      path: string;
    }>;
  };
  fileInfo?: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
    content?: string;
  }>;
  customData?: Record<string, any>;
}

export class ChatContextManager {
  private db: Promise<IDBPDatabase<ChatContextDB>>;
  private static instance: ChatContextManager;

  private constructor() {
    this.db = this.initDatabase();
  }

  public static getInstance(): ChatContextManager {
    if (!ChatContextManager.instance) {
      ChatContextManager.instance = new ChatContextManager();
    }
    return ChatContextManager.instance;
  }

  private async initDatabase(): Promise<IDBPDatabase<ChatContextDB>> {
    return openDB<ChatContextDB>('chat-context-db', 1, {
      upgrade(db) {
        const contextStore = db.createObjectStore('contexts', {
          keyPath: 'id'
        });
        contextStore.createIndex('by-chat-id', 'chatId');
        contextStore.createIndex('by-timestamp', 'timestamp');
      }
    });
  }

  /**
   * Save a new context for a chat
   */
  public async saveContext(context: Omit<ChatContext, 'timestamp' | 'id'>): Promise<string> {
    const db = await this.db;
    const timestamp = Date.now();
    const id = `${context.chatId}_${timestamp}`;
    
    await db.add('contexts', {
      id,
      ...context,
      timestamp
    });
    
    return id;
  }

  /**
   * Get the latest context for a specific chat
   */
  public async getLatestContextForChat(chatId: string): Promise<ChatContext | null> {
    const db = await this.db;
    const contexts = await db.getAllFromIndex('contexts', 'by-chat-id', chatId);
    
    if (contexts.length === 0) {
      return null;
    }
    
    // Sort by timestamp descending and get the latest
    return contexts.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  /**
   * Get all contexts for a chat sorted by timestamp
   */
  public async getAllContextsForChat(chatId: string): Promise<ChatContext[]> {
    const db = await this.db;
    const contexts = await db.getAllFromIndex('contexts', 'by-chat-id', chatId);
    
    // Sort by timestamp ascending
    return contexts.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Update folder information for the latest chat context
   */
  public async updateFolderInfo(
    chatId: string, 
    folderInfo: ChatContext['folderInfo']
  ): Promise<void> {
    const latestContext = await this.getLatestContextForChat(chatId);
    
    if (!latestContext) {
      // Create a new context if none exists
      await this.saveContext({
        chatId,
        folderInfo
      });
      return;
    }
    
    const db = await this.db;
    await db.put('contexts', {
      ...latestContext,
      folderInfo
    });
  }

  /**
   * Update file information for the latest chat context
   */
  public async updateFileInfo(
    chatId: string, 
    fileInfo: ChatContext['fileInfo']
  ): Promise<void> {
    const latestContext = await this.getLatestContextForChat(chatId);
    
    if (!latestContext) {
      // Create a new context if none exists
      await this.saveContext({
        chatId,
        fileInfo
      });
      return;
    }
    
    const db = await this.db;
    await db.put('contexts', {
      ...latestContext,
      fileInfo
    });
  }

  /**
   * Add custom data to the latest chat context
   */
  public async addCustomData(
    chatId: string,
    key: string,
    value: any
  ): Promise<void> {
    const latestContext = await this.getLatestContextForChat(chatId);
    
    if (!latestContext) {
      // Create a new context if none exists
      await this.saveContext({
        chatId,
        customData: { [key]: value }
      });
      return;
    }
    
    const customData = latestContext.customData || {};
    
    const db = await this.db;
    await db.put('contexts', {
      ...latestContext,
      customData: {
        ...customData,
        [key]: value
      }
    });
  }

  /**
   * Delete all contexts for a specific chat
   */
  public async deleteContextsForChat(chatId: string): Promise<void> {
    const db = await this.db;
    const contexts = await db.getAllFromIndex('contexts', 'by-chat-id', chatId);
    
    const tx = db.transaction('contexts', 'readwrite');
    await Promise.all(
      contexts.map(context => tx.store.delete(context.id))
    );
    await tx.done;
  }
}

// Export a singleton instance
export const chatContextManager = ChatContextManager.getInstance(); 