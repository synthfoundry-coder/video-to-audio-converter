import { ConversionSettings, ConversionStatus } from '../types';

export interface PersistedItemRecord {
  id: string;
  name: string;
  size: number;
  duration: number;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  settings: ConversionSettings;
  status: ConversionStatus;
  progress: number;
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedSize?: number;
  outputFileName?: string;
  originalFileBlob: Blob;
  createdAt: number;
}

const DB_NAME = 'AudioExtractDB';
const DB_VERSION = 1;
const STORE_NAME = 'batch_items';

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // Automatically request persistent storage if available
        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().catch(() => {});
        }

        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB database.'));
      };
    });

    return this.dbPromise;
  }

  public async saveItem(item: PersistedItemRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async saveAllItems(items: PersistedItemRecord[]): Promise<void> {
    if (items.length === 0) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllItems(): Promise<PersistedItemRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as PersistedItemRecord[];
        // Sort by createdAt ascending
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async deleteItem(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearAll(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new DatabaseService();
