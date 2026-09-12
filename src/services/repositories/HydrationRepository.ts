import { DailyHydration, HydrationEntry } from '../../types';
import { hydrationApi } from '../api/hydrationApi';

const HYDRATION_PREFIX = 'friday_hydration_';

export interface IHydrationRepository {
  getHydration(dateStr: string, defaultTargetMl?: number): DailyHydration;
  logWater(dateStr: string, amountMl: number, defaultTargetMl?: number): DailyHydration;
  removeEntry(dateStr: string, entryId: string): DailyHydration;
  syncFromBackend(dateStr: string): Promise<DailyHydration>;
  clear(): void;
}

class ApiBackedHydrationRepository implements IHydrationRepository {
  private getKey(dateStr: string): string {
    return `${HYDRATION_PREFIX}${dateStr}`;
  }

  getHydration(dateStr: string, defaultTargetMl = 2500): DailyHydration {
    if (typeof window === 'undefined') {
      return { date: dateStr, targetMl: defaultTargetMl, consumedMl: 0, entries: [] };
    }
    const raw = localStorage.getItem(this.getKey(dateStr));
    if (!raw) {
      return { date: dateStr, targetMl: defaultTargetMl, consumedMl: 0, entries: [] };
    }
    try {
      const parsed = JSON.parse(raw) as DailyHydration;
      if (defaultTargetMl && defaultTargetMl > 0) {
        parsed.targetMl = defaultTargetMl;
      }
      return parsed;
    } catch {
      return { date: dateStr, targetMl: defaultTargetMl, consumedMl: 0, entries: [] };
    }
  }

  logWater(dateStr: string, amountMl: number, defaultTargetMl = 2500): DailyHydration {
    const current = this.getHydration(dateStr, defaultTargetMl);
    const newEntry: HydrationEntry = {
      id: `hyt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amountMl,
      timestamp: new Date().toISOString()
    };
    current.entries.push(newEntry);
    current.consumedMl += amountMl;

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getKey(dateStr), JSON.stringify(current));
    }

    // Backend sync with optimistic rollback on failure
    hydrationApi.logHydration(amountMl, dateStr).then(entry => {
      if (entry && entry.id) {
        newEntry.id = entry.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.getKey(dateStr), JSON.stringify(current));
        }
      }
    }).catch(err => {
      console.warn('[HydrationRepository] Background water log sync failed. Rolling back optimistic state:', err.message);
      current.consumedMl = Math.max(0, current.consumedMl - amountMl);
      current.entries = current.entries.filter(e => e.id !== newEntry.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.getKey(dateStr), JSON.stringify(current));
      }
    });

    return current;
  }

  removeEntry(dateStr: string, entryId: string): DailyHydration {
    const current = this.getHydration(dateStr);
    const target = current.entries.find(e => e.id === entryId);
    if (!target) return current;

    current.consumedMl = Math.max(0, current.consumedMl - target.amountMl);
    current.entries = current.entries.filter(e => e.id !== entryId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getKey(dateStr), JSON.stringify(current));
    }

    hydrationApi.deleteHydration(entryId).catch(err => {
      console.warn('[HydrationRepository] Background water delete sync failed:', err.message);
    });

    return current;
  }

  async syncFromBackend(dateStr: string): Promise<DailyHydration> {
    try {
      const remote = await hydrationApi.getTodayHydration(dateStr);
      if (remote) {
        const result: DailyHydration = {
          date: remote.date,
          targetMl: remote.targetMl,
          consumedMl: remote.consumedMl,
          entries: (remote.entries || []).map((e: any) => ({
            id: e.id,
            amountMl: e.amountMl,
            timestamp: e.loggedAt
          }))
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.getKey(dateStr), JSON.stringify(result));
        }
        return result;
      }
    } catch (err: any) {
      console.warn('[HydrationRepository] Backend sync failed:', err.message);
    }
    return this.getHydration(dateStr);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HYDRATION_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const HydrationRepository: IHydrationRepository = new ApiBackedHydrationRepository();
