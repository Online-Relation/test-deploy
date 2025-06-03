// src/lib/db.ts
import Dexie, { Table } from 'dexie';

export interface Note {
  id: string;
  text: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  notes: Note[];
  completed?: boolean;
}

export interface BucketCategory {
  id: string;
  title: string;
  type: 'personlig' | 'par';
  goals: Goal[];
  imageUrl?: string;
  description?: string;
}

class BucketDB extends Dexie {
  buckets!: Table<BucketCategory, string>;

  constructor() {
    super('BucketDatabase');
    this.version(1).stores({
      buckets: 'id',
    });
  }
}

export const db = new BucketDB();
