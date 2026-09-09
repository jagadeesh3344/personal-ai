import { ProgressState, WeightRecord, MeasurementRecord } from '../../types';
import { progressApi } from '../api/progressApi';

const PROGRESS_KEY = 'friday_progress_data';

export interface IProgressRepository {
  getProgress(): ProgressState;
  addWeight(weightKg: number, dateStr?: string): ProgressState;
  addMeasurement(record: Omit<MeasurementRecord, 'id'>): ProgressState;
  syncFromBackend(): Promise<ProgressState>;
  clear(): void;
}

class ApiBackedProgressRepository implements IProgressRepository {
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

    // Backend sync
    progressApi.addMeasurement({ weightKg }).catch(err => {
      console.warn('[ProgressRepository] Background weight sync failed:', err.message);
    });

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

    progressApi.addMeasurement({
      chestCm: record.chestCm,
      waistCm: record.waistCm,
      hipsCm: record.hipsCm,
      armsCm: record.armsCm,
      thighsCm: record.thighsCm,
      weightKg: record.weightKg
    }).catch(err => {
      console.warn('[ProgressRepository] Background measurement sync failed:', err.message);
    });

    return current;
  }

  async syncFromBackend(): Promise<ProgressState> {
    try {
      const data = await progressApi.getProgress();
      if (data) {
        const state: ProgressState = {
          weights: (data.measurements || []).map((m: any) => ({
            id: m.id,
            date: m.date,
            weightKg: m.weightKg
          })),
          measurements: (data.measurements || []).map((m: any) => ({
            id: m.id,
            date: m.date,
            weightKg: m.weightKg,
            chestCm: m.chestCm || 0,
            waistCm: m.waistCm || 0,
            armsCm: m.armsCm || 0,
            thighsCm: m.thighsCm || 0
          })),
          photoUrls: []
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
        }
        return state;
      }
    } catch (err: any) {
      console.warn('[ProgressRepository] Backend progress fetch failed:', err.message);
    }
    return this.getProgress();
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export const ProgressRepository: IProgressRepository = new ApiBackedProgressRepository();
