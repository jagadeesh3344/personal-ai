import { BodyMeasurementAnalysis, BodyMeasurementChange, TrendDirection } from './types';

export interface MeasurementRecordInput {
  date: string;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export function analyzeBodyMeasurements(
  records: MeasurementRecordInput[]
): BodyMeasurementAnalysis {
  if (!records || records.length === 0) {
    return {
      measurementsTracked: 0,
      changes: [],
      latestRecordedDate: null
    };
  }

  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sites: Array<'chest' | 'waist' | 'hips' | 'arms' | 'thighs'> = ['chest', 'waist', 'hips', 'arms', 'thighs'];
  const siteKeyMap: Record<'chest' | 'waist' | 'hips' | 'arms' | 'thighs', keyof MeasurementRecordInput> = {
    chest: 'chestCm',
    waist: 'waistCm',
    hips: 'hipsCm',
    arms: 'armsCm',
    thighs: 'thighsCm'
  };

  const changes: BodyMeasurementChange[] = [];

  for (const site of sites) {
    const key = siteKeyMap[site];
    const valid = sorted.filter(r => typeof r[key] === 'number' && !isNaN(r[key] as number) && (r[key] as number) > 0);

    if (valid.length >= 2) {
      const first = Number(valid[0][key]);
      const latest = Number(valid[valid.length - 1][key]);
      const absoluteChange = Number((latest - first).toFixed(2));
      const percentageChange = Number(((absoluteChange / first) * 100).toFixed(2));

      let trend: TrendDirection = 'STABLE';
      if (absoluteChange > 0.5) {
        trend = 'INCREASING';
      } else if (absoluteChange < -0.5) {
        trend = 'DECREASING';
      } else {
        trend = 'STABLE';
      }

      changes.push({
        site,
        firstRecordedCm: first,
        latestCm: latest,
        absoluteChangeCm: absoluteChange,
        percentageChange,
        trend
      });
    } else if (valid.length === 1) {
      const singleVal = Number(valid[0][key]);
      changes.push({
        site,
        firstRecordedCm: singleVal,
        latestCm: singleVal,
        absoluteChangeCm: 0,
        percentageChange: 0,
        trend: 'INSUFFICIENT_DATA'
      });
    }
  }

  const latestRecordedDate = sorted.length > 0 ? sorted[sorted.length - 1].date : null;

  return {
    measurementsTracked: changes.length,
    changes,
    latestRecordedDate
  };
}
