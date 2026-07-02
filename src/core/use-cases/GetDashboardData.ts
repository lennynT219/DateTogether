import type { DateRepository } from '../ports/DateRepository.js';
import type { DateEntry } from '../entities/DateEntry.js';

export interface DashboardData {
  dates: DateEntry[];
  progress: { completed: number; total: number };
}

export class GetDashboardData {
  constructor(private dateRepository: DateRepository) {}

  async execute(): Promise<DashboardData> {
    try {
      const [dates, progress] = await Promise.all([
        this.dateRepository.findAll(),
        this.dateRepository.getProgress(),
      ]);
      return { dates, progress };
    } catch {
      return { dates: [], progress: { completed: 0, total: 0 } };
    }
  }
}
