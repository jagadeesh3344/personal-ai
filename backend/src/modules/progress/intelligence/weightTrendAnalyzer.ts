import { WeightTrendAnalysis, TrendDirection } from './types.js';

export interface WeightRecordInput {
  date: string;
  weightKg: number;
}

/**
 * Deterministically analyzes bodyweight measurements without guessing or photo inference.
 * Requires at least 2 distinct measurements to determine a trend direction.
 */
export function analyzeWeightTrend(
  rawRecords: WeightRecordInput[],
  targetWeightKg?: number | null
): WeightTrendAnalysis {
  if (!rawRecords || rawRecords.length === 0) {
    return {
      startingWeightKg: null,
      currentWeightKg: null,
      targetWeightKg: targetWeightKg || null,
      absoluteChangeKg: null,
      percentageChange: null,
      recentAverageKg: null,
      previousAverageKg: null,
      trend: 'INSUFFICIENT_DATA',
      measurementCount: 0,
      history: []
    };
  }

  // 1. Sort chronologically (oldest to newest)
  const sorted = [...rawRecords]
    .filter(r => typeof r.weightKg === 'number' && !isNaN(r.weightKg) && r.weightKg > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) {
    return {
      startingWeightKg: null,
      currentWeightKg: null,
      targetWeightKg: targetWeightKg || null,
      absoluteChangeKg: null,
      percentageChange: null,
      recentAverageKg: null,
      previousAverageKg: null,
      trend: 'INSUFFICIENT_DATA',
      measurementCount: 0,
      history: []
    };
  }

  const startingWeight = sorted[0].weightKg;
  const currentWeight = sorted[sorted.length - 1].weightKg;
  const count = sorted.length;

  // Single measurement cannot declare a reliable trend
  if (count === 1) {
    return {
      startingWeightKg: startingWeight,
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeightKg || null,
      absoluteChangeKg: 0,
      percentageChange: 0,
      recentAverageKg: currentWeight,
      previousAverageKg: null,
      trend: 'INSUFFICIENT_DATA',
      measurementCount: 1,
      history: sorted
    };
  }

  // 2. Absolute & percentage changes
  const absoluteChange = Number((currentWeight - startingWeight).toFixed(2));
  const percentageChange = Number(((absoluteChange / startingWeight) * 100).toFixed(2));

  // 3. Rolling window averages to filter daily water noise
  // If count >= 4: split into earlier half and later half
  // If count is 2 or 3: compare latest to first
  let recentAverageKg: number;
  let previousAverageKg: number;

  if (count >= 4) {
    const half = Math.floor(count / 2);
    const earlier = sorted.slice(0, half);
    const later = sorted.slice(half);

    previousAverageKg = Number((earlier.reduce((acc, curr) => acc + curr.weightKg, 0) / earlier.length).toFixed(2));
    recentAverageKg = Number((later.reduce((acc, curr) => acc + curr.weightKg, 0) / later.length).toFixed(2));
  } else {
    previousAverageKg = startingWeight;
    recentAverageKg = currentWeight;
  }

  // 4. Deterministic trend calculation based on averages
  const delta = Number((recentAverageKg - previousAverageKg).toFixed(2));
  let trend: TrendDirection = 'STABLE';

  // Tolerance threshold: 0.4 kg noise band for daily hydration/food mass
  if (delta > 0.4) {
    trend = 'INCREASING';
  } else if (delta < -0.4) {
    trend = 'DECREASING';
  } else {
    trend = 'STABLE';
  }

  return {
    startingWeightKg: startingWeight,
    currentWeightKg: currentWeight,
    targetWeightKg: targetWeightKg || null,
    absoluteChangeKg: absoluteChange,
    percentageChange,
    recentAverageKg,
    previousAverageKg,
    trend,
    measurementCount: count,
    history: sorted
  };
}
