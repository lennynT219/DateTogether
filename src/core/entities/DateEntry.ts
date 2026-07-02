import type { Memory } from './Memory';

export interface DateEntry {
  id: string;
  title: string;
  description?: string;
  category: 'predefined' | 'free';
  completed: boolean;
  completedAt?: Date;
  memories: Memory[];
}
