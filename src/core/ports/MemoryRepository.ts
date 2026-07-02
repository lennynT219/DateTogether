import type { Memory } from '../entities/Memory';

export interface MemoryRepository {
  findByDateId(dateId: string): Promise<Memory[]>;
  create(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory>;
  delete(id: string): Promise<void>;
}
