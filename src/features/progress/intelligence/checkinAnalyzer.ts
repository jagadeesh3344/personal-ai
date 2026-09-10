import { CheckinAnalysis, PhotoTimelineAnalysis } from './types';

export interface CheckinInput {
  id: string;
  checkinDate: string;
  weightKg: number;
  adherenceScore?: number;
  summary?: string;
  nextMonthFocus?: string;
}

export interface ProgressPhotoInput {
  id: string;
  date: string;
  pose: 'FRONT' | 'SIDE' | 'BACK';
  storagePath: string;
}

export function analyzeCheckins(checkins: CheckinInput[]): CheckinAnalysis {
  if (!checkins || checkins.length === 0) {
    return {
      completedCheckinsCount: 0,
      latestCheckinDate: null,
      daysSinceLastCheckin: null,
      averageAdherenceScore: null,
      recentSummaries: []
    };
  }

  const sorted = [...checkins].sort(
    (a, b) => new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime()
  );

  const latest = sorted[0];
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(latest.checkinDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  const scores = sorted.filter(c => typeof c.adherenceScore === 'number' && !isNaN(c.adherenceScore as number));
  const avgScore = scores.length > 0
    ? Number((scores.reduce((acc, curr) => acc + (curr.adherenceScore || 0), 0) / scores.length).toFixed(1))
    : null;

  const recentSummaries = sorted.slice(0, 5).map(c => ({
    date: c.checkinDate,
    weightKg: c.weightKg,
    adherenceScore: c.adherenceScore,
    summary: c.summary,
    nextFocus: c.nextMonthFocus,
    nextMonthFocus: c.nextMonthFocus
  }));

  return {
    completedCheckinsCount: sorted.length,
    latestCheckinDate: latest.checkinDate,
    daysSinceLastCheckin: daysSince,
    averageAdherenceScore: avgScore,
    recentSummaries
  };
}

export function analyzePhotos(photos: ProgressPhotoInput[], _periodDays?: number): PhotoTimelineAnalysis {
  const sorted = [...(photos || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mappedPhotos = sorted.map(p => ({
    date: p.date,
    pose: p.pose,
    storagePath: p.storagePath
  }));

  return {
    photoCount: sorted.length,
    totalPhotos: sorted.length,
    hasComparisonPair: sorted.length >= 2,
    entries: mappedPhotos,
    photos: mappedPhotos,
    disclaimer: 'Progress photos are visual milestones for user self-comparison. Photos are qualitative records only. Computer-vision body composition or exact body-fat estimation is not medically validated and is not performed.'
  };
}

export const analyzePhotoTimeline = analyzePhotos;
