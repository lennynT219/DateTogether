import type { Memory } from './Memory';

export interface DateEntry {
  id: string;
  title: string;
  description?: string;
  category: 'predefined' | 'free';
  orderIndex: number;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  memories: Memory[];
  createdAt: Date;
  updatedAt: Date;
}
