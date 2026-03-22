/**
 * Local IndexedDB Storage for Conversation Memory
 */

const DB_NAME = 'conversa_memory';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
}

class MemoryDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (typeof window === 'undefined') return;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  async addMessage(msg: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const message: Message = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(message);

      request.onsuccess = () => resolve(message);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentContext(limit: number = 10): Promise<Message[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const messages = request.result as Message[];
        // Sort by timestamp and get the latest
        messages.sort((a, b) => a.timestamp - b.timestamp);
        // Only get exactly the limit we need (tail end)
        resolve(messages.slice(-limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const memory = new MemoryDB();
