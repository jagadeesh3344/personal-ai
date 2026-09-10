import { apiClient } from './client';
import { BodyMeasurement, MonthlyCheckin, ProgressState } from '../../types';

export const progressApi = {
  async getProgress(): Promise<ProgressState> {
    const res = await apiClient.get<{ success: boolean; progress: any }>('/progress');
    return res.progress;
  },

  async addMeasurement(measurement: Partial<BodyMeasurement>): Promise<BodyMeasurement> {
    const res = await apiClient.post<{ success: boolean; measurement: BodyMeasurement }>('/progress/measurements', measurement);
    return res.measurement;
  },

  async getCheckins(): Promise<MonthlyCheckin[]> {
    const res = await apiClient.get<{ success: boolean; checkins: MonthlyCheckin[] }>('/check-ins');
    return res.checkins;
  },

  async createCheckin(checkin: Partial<MonthlyCheckin>): Promise<MonthlyCheckin> {
    const res = await apiClient.post<{ success: boolean; checkin: MonthlyCheckin }>('/check-ins', checkin);
    return res.checkin;
  },

  async getPhotoUploadUrl(pose: 'FRONT' | 'SIDE' | 'BACK', fileExtension: string, checkinId?: string) {
    return apiClient.post<{ success: boolean; uploadUrl: string; storagePath: string; token: string }>('/progress/photos/upload-url', {
      pose,
      fileExtension,
      checkinId
    });
  },

  async getSignedPhotoUrl(storagePath: string): Promise<string> {
    const res = await apiClient.get<{ success: boolean; signedUrl: string }>(`/progress/photos/signed-url?storagePath=${encodeURIComponent(storagePath)}`);
    return res.signedUrl;
  },

  async getIntelligence(periodDays: number = 30) {
    const res = await apiClient.get<{ success: boolean; intelligence: any }>(`/progress/intelligence?periodDays=${periodDays}`);
    return res.intelligence;
  },

  async getTimeline(periodDays: number = 30) {
    const res = await apiClient.get<{ success: boolean; timeline: any[] }>(`/progress/timeline?periodDays=${periodDays}`);
    return res.timeline;
  }
};
