import {
  NutritionAdherenceAnalysis,
  DailyNutritionLogAnalysis,
  NutritionAdherenceStatus
} from './types';

export interface DailyMealSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export function analyzeNutritionAdherence(
  dailySummaries: DailyMealSummary[],
  targetCalories: number = 2000,
  targetProtein: number = 140,
  totalDaysInPeriod: number = 7
): NutritionAdherenceAnalysis {
  const periodDays = Math.max(1, totalDaysInPeriod);

  const trackedDays = (dailySummaries || []).filter(d => d.totalCalories > 0 || d.mealCount > 0);
  const daysTracked = trackedDays.length;
  const trackingConsistencyRate = Number(((daysTracked / periodDays) * 100).toFixed(1));

  if (daysTracked === 0) {
    return {
      daysTracked: 0,
      totalDaysInPeriod: periodDays,
      trackingConsistencyRate: 0,
      averageCalories: null,
      averageProtein: null,
      targetCalories,
      targetProtein,
      calorieAdherencePercent: null,
      proteinAdherencePercent: null,
      loggingStatus: 'UNTRACKED',
      recentDailyLogs: []
    };
  }

  const sumCalories = trackedDays.reduce((acc, curr) => acc + curr.totalCalories, 0);
  const sumProtein = trackedDays.reduce((acc, curr) => acc + curr.totalProtein, 0);
  const averageCalories = Math.round(sumCalories / daysTracked);
  const averageProtein = Math.round(sumProtein / daysTracked);

  const calorieAdherencePercent = targetCalories > 0
    ? Math.min(100, Number((100 - Math.abs(((averageCalories - targetCalories) / targetCalories) * 100)).toFixed(1)))
    : 100;

  const proteinAdherencePercent = targetProtein > 0
    ? Math.min(100, Number((100 - Math.abs(((averageProtein - targetProtein) / targetProtein) * 100)).toFixed(1)))
    : 100;

  const recentDailyLogs: DailyNutritionLogAnalysis[] = trackedDays.map(d => {
    let status: NutritionAdherenceStatus;
    const calDiff = (d.totalCalories - targetCalories) / Math.max(1, targetCalories);

    if (Math.abs(calDiff) <= 0.12) {
      status = 'TRACKED_NEAR_TARGET';
    } else if (calDiff < -0.12) {
      status = 'TRACKED_BELOW_TARGET';
    } else {
      status = 'TRACKED_ABOVE_TARGET';
    }

    return {
      date: d.date,
      calories: d.totalCalories,
      protein: d.totalProtein,
      carbs: d.totalCarbs,
      fat: d.totalFat,
      targetCalories,
      targetProtein,
      status
    };
  });

  const loggingStatus = daysTracked >= Math.ceil(periodDays * 0.7)
    ? 'FULLY_TRACKED'
    : 'PARTIALLY_TRACKED';

  return {
    daysTracked,
    totalDaysInPeriod: periodDays,
    trackingConsistencyRate,
    averageCalories,
    averageProtein,
    targetCalories,
    targetProtein,
    calorieAdherencePercent: Math.max(0, calorieAdherencePercent),
    proteinAdherencePercent: Math.max(0, proteinAdherencePercent),
    loggingStatus,
    recentDailyLogs
  };
}
