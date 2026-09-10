import { HydrationAnalysis } from './types';

export interface DailyHydrationSummary {
  date: string;
  totalMl: number;
}

export function analyzeHydration(
  dailyHydration: DailyHydrationSummary[],
  targetMl: number = 2500,
  totalDaysInPeriod: number = 7
): HydrationAnalysis {
  const periodDays = Math.max(1, totalDaysInPeriod);
  const trackedDays = (dailyHydration || []).filter(d => d.totalMl > 0);
  const daysTracked = trackedDays.length;
  const trackingConsistencyRate = Number(((daysTracked / periodDays) * 100).toFixed(1));

  if (daysTracked === 0) {
    return {
      daysTracked: 0,
      totalDaysInPeriod: periodDays,
      trackingConsistencyRate: 0,
      averageIntakeMl: null,
      targetIntakeMl: targetMl,
      adherencePercent: null,
      status: 'INSUFFICIENT_DATA'
    };
  }

  const sumIntake = trackedDays.reduce((acc, curr) => acc + curr.totalMl, 0);
  const averageIntakeMl = Math.round(sumIntake / daysTracked);
  const adherencePercent = targetMl > 0
    ? Number(Math.min(100, (averageIntakeMl / targetMl) * 100).toFixed(1))
    : 100;

  let status: 'INSUFFICIENT_DATA' | 'GOOD' | 'LOW' = 'GOOD';
  if (daysTracked < 2) {
    status = 'INSUFFICIENT_DATA';
  } else if (adherencePercent >= 80) {
    status = 'GOOD';
  } else {
    status = 'LOW';
  }

  return {
    daysTracked,
    totalDaysInPeriod: periodDays,
    trackingConsistencyRate,
    averageIntakeMl,
    targetIntakeMl: targetMl,
    adherencePercent,
    status
  };
}
