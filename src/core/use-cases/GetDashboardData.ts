import type { DateRepository } from '../ports/DateRepository.js';
import type { DateEntry } from '../entities/DateEntry.js';

interface DashboardReadyData {
  status: 'ready';
  dates: DateEntry[];
  progress: { completed: number; total: number };
}

interface DashboardUnavailableData {
  status: 'unavailable';
  dates: DateEntry[];
  progress: { completed: number; total: number };
}

export type DashboardData = DashboardReadyData | DashboardUnavailableData;

export class GetDashboardData {
  constructor(private dateRepository: DateRepository) {}

  async execute(): Promise<DashboardData> {
    try {
      const [dates, progress] = await Promise.all([
        this.dateRepository.findAll(),
        this.dateRepository.getProgress(),
      ]);
      return { status: 'ready', dates, progress };
    } catch {
      return {
        status: 'unavailable',
        dates: [],
        progress: { completed: 0, total: 0 },
      };
    }
  }
}
