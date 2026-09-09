import { DailyHydration, HydrationEntry } from '../../types';

const HYDRATION_PREFIX = 'friday_hydration_';

export interface IHydrationRepository {
  getHydration(dateStr: string, defaultTargetMl?: number): DailyHydration;
  logWater(dateStr: string, amountMl: number, defaultTargetMl?: number): DailyHydration;
  removeEntry(dateStr: string, entryId: string): DailyHydration;
  clear(): void;
}

class LocalHydrationRepository implements IHydrationRepository {
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
    return current;
  }

  removeEntry(dateStr: string, entryId: string): DailyHydration {
    const current = this.getHydration(dateStr);
    const target = current.entries.find(e => e.id === entryId);
    if (!target) return current;

    current.entries = current.entries.filter(e => e.id !== entryId);
    current.consumedMl = Math.max(0, current.consumedMl - target.amountMl);

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getKey(dateStr), JSON.stringify(current));
    }
    return current;
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HYDRATION_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}

export const HydrationRepository: IHydrationRepository = new LocalHydrationRepository();
