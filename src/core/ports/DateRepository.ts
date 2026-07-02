import type { DateEntry } from '../entities/DateEntry';

export interface DateRepository {
  findAll(): Promise<DateEntry[]>;
  findById(id: string): Promise<DateEntry | null>;
  findByCategory(category: 'predefined' | 'free'): Promise<DateEntry[]>;
  markAsCompleted(id: string, completedBy: string): Promise<DateEntry>;
  markAsIncomplete(id: string): Promise<DateEntry>;
  getProgress(): Promise<{ completed: number; total: number }>;
}
