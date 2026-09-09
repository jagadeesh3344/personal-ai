import { ProgressState, WeightRecord, MeasurementRecord } from '../../types';

const PROGRESS_KEY = 'friday_progress_data';

export interface IProgressRepository {
  getProgress(): ProgressState;
  addWeight(weightKg: number, dateStr?: string): ProgressState;
  addMeasurement(record: Omit<MeasurementRecord, 'id'>): ProgressState;
  clear(): void;
}

class LocalProgressRepository implements IProgressRepository {
  getProgress(): ProgressState {
    if (typeof window === 'undefined') {
      return { weights: [], measurements: [], photoUrls: [] };
    }
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return { weights: [], measurements: [], photoUrls: [] };
    }
    try {
      return JSON.parse(raw) as ProgressState;
    } catch {
      return { weights: [], measurements: [], photoUrls: [] };
    }
  }

  addWeight(weightKg: number, dateStr?: string): ProgressState {
    const current = this.getProgress();
    const date = dateStr || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    const record: WeightRecord = {
      id: `w-${Date.now()}`,
      date,
      weightKg
    };
    current.weights.push(record);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(current));
    }
    return current;
  }

  addMeasurement(record: Omit<MeasurementRecord, 'id'>): ProgressState {
    const current = this.getProgress();
    const entry: MeasurementRecord = {
      id: `m-${Date.now()}`,
      ...record
    };
    current.measurements.push(entry);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(current));
    }
    return current;
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export const ProgressRepository: IProgressRepository = new LocalProgressRepository();
