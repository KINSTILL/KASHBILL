'use client';

import { openDB, type IDBPDatabase } from 'idb';
import type { DocType } from '@prisma/client';

const DB_NAME = 'mycashbill_local';
const DB_VERSION = 1;

export type Draft = {
  id: string;
  type: DocType;
  payload: unknown;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'local' | 'pending' | 'synced' | 'error';
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDb();
  await db.put('drafts', draft);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDb();
  return db.get('drafts', id);
}

export async function listDrafts(): Promise<Draft[]> {
  const db = await getDb();
  return db.getAll('drafts');
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('drafts', id);
}

// ─────────────────────────────────────────────
// File d'attente offline
// ─────────────────────────────────────────────
export type QueuedRequest = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: unknown;
  createdAt: number;
  retryCount: number;
};

export async function enqueueRequest(req: Omit<QueuedRequest, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.put('queue', { ...req, id, createdAt: Date.now(), retryCount: 0 });
  return id;
}

export async function listQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await getDb();
  return db.getAll('queue');
}

export async function removeQueuedRequest(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('queue', id);
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await getDb();
  const entry = await db.get('queue', id);
  if (entry) {
    await db.put('queue', { ...entry, retryCount: entry.retryCount + 1 });
  }
}

