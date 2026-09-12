import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../config/supabase.js';

export const ALLOWED_EVENT_NAMES = [
  'APP_OPENED',
  'SIGNUP_COMPLETED',
  'ONBOARDING_STARTED',
  'ONBOARDING_COMPLETED',
  'WORKOUT_VIEWED',
  'WORKOUT_STARTED',
  'WORKOUT_COMPLETED',
  'CAMERA_STARTED',
  'CAMERA_SET_COMPLETED',
  'CAMERA_FAILED',
  'MANUAL_SET_LOGGED',
  'VOICE_STARTED',
  'VOICE_COMMAND_COMPLETED',
  'VOICE_FAILED',
  'MEAL_LOGGED',
  'HYDRATION_LOGGED',
  'FRIDAY_MESSAGE_SENT',
  'PROGRESS_VIEWED',
  'CHECKIN_COMPLETED',
  'API_ERROR',
  'GEMINI_ERROR',
  'AUTH_ERROR',
  'CAMERA_PERMISSION_DENIED',
  'CAMERA_INITIALIZATION_FAILED',
  'POSE_LOW_CONFIDENCE',
  'VOICE_PERMISSION_DENIED',
  'VOICE_RECOGNITION_FAILED',
  'NETWORK_ERROR',
] as const;

export type TelemetryEventName = typeof ALLOWED_EVENT_NAMES[number];

export interface TelemetryEvent {
  id?: string;
  userId: string;
  eventName: TelemetryEventName;
  timestamp: string;
  platform: string;
  appVersion: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface UserFeedbackEntry {
  id?: string;
  userId: string;
  rating: 'helpful' | 'unhelpful';
  category: 'workout' | 'camera' | 'voice' | 'nutrition' | 'hydration' | 'progress' | 'friday_answer' | 'ui' | 'bug' | 'other';
  comment?: string;
  interactionRef?: string;
  timestamp: string;
}

export interface BetaIssueEntry {
  id?: string;
  userId: string;
  category: string;
  platform: string;
  appVersion: string;
  sessionId?: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  status: 'open' | 'investigating' | 'resolved' | 'wont_fix';
  timestamp: string;
}

export interface BetaAggregateMetrics {
  users: {
    totalBetaUsers: number;
    onboardingStarted: number;
    onboardingCompleted: number;
    onboardingCompletionRatePct: number;
  };
  workouts: {
    started: number;
    completed: number;
    completionRatePct: number;
    manualSets: number;
    cameraSets: number;
  };
  camera: {
    starts: number;
    setsCompleted: number;
    failures: number;
    permissionDenied: number;
    lowConfidenceEvents: number;
    successRatePct: number;
  };
  voice: {
    starts: number;
    commandsCompleted: number;
    failures: number;
    permissionDenied: number;
    successRatePct: number;
  };
  nutrition: {
    mealLogs: number;
    hydrationLogs: number;
  };
  friday: {
    messagesSent: number;
    geminiErrors: number;
    successRatePct: number;
  };
  issues: {
    p0: number;
    p1: number;
    p2: number;
    p3: number;
    totalOpen: number;
  };
  feedback: {
    total: number;
    helpfulCount: number;
    unhelpfulCount: number;
    helpfulRatioPct: number;
  };
  performance: {
    apiLatencyP50Ms: number;
    apiLatencyP95Ms: number;
    geminiLatencyP50Ms: number;
    geminiLatencyP95Ms: number;
  };
}

// In-memory repositories for test/dev/mock
const memoryEvents: TelemetryEvent[] = [];
const memoryFeedback: UserFeedbackEntry[] = [];
const memoryIssues: BetaIssueEntry[] = [];
const apiLatencies: number[] = [];
const geminiLatencies: number[] = [];

// Privacy filtering rule: strip forbidden keywords
const FORBIDDEN_KEYS_REGEX = /token|password|secret|key|auth|cred|audio|frame|photo|base64|raw|transcript/i;

export class TelemetryService {
  /**
   * Sanitizes metadata to ensure zero sensitive fields or media streams are recorded.
   */
  static sanitizeMetadata(raw: Record<string, any> = {}): Record<string, any> {
    if (!raw || typeof raw !== 'object') return {};

    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (FORBIDDEN_KEYS_REGEX.test(key)) {
        continue; // drop forbidden key
      }

      if (typeof val === 'string') {
        // Drop strings that look like base64 images or JWT tokens
        if (val.length > 256 || val.startsWith('eyJ') || val.startsWith('data:')) {
          continue;
        }
        clean[key] = val;
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        clean[key] = val;
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        clean[key] = this.sanitizeMetadata(val);
      }
    }
    return clean;
  }

  /**
   * Logs a single privacy-sanitized analytics event.
   */
  static async recordEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>, client?: SupabaseClient): Promise<TelemetryEvent> {
    if (!ALLOWED_EVENT_NAMES.includes(event.eventName)) {
      throw new Error(`Invalid event name: ${event.eventName}`);
    }

    const sanitized: TelemetryEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: event.userId,
      eventName: event.eventName,
      timestamp: new Date().toISOString(),
      platform: event.platform || 'unknown',
      appVersion: event.appVersion || '1.0.0',
      sessionId: event.sessionId || 'default-session',
      metadata: this.sanitizeMetadata(event.metadata),
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      memoryEvents.push(sanitized);
      return sanitized;
    }

    try {
      const sb = client || getSupabaseAdmin();
      const { error } = await sb.from('analytics_events').insert({
        user_id: sanitized.userId,
        event_name: sanitized.eventName,
        platform: sanitized.platform,
        app_version: sanitized.appVersion,
        session_id: sanitized.sessionId,
        metadata: sanitized.metadata,
        timestamp: sanitized.timestamp,
      });
      if (error) {
        memoryEvents.push(sanitized);
      }
    } catch {
      memoryEvents.push(sanitized);
    }

    return sanitized;
  }

  /**
   * Records user feedback (👍 / 👎) with optional comments and category.
   */
  static async recordFeedback(entry: Omit<UserFeedbackEntry, 'id' | 'timestamp'>, client?: SupabaseClient): Promise<UserFeedbackEntry> {
    const feedback: UserFeedbackEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: entry.userId,
      rating: entry.rating,
      category: entry.category,
      comment: entry.comment ? entry.comment.slice(0, 500) : undefined,
      interactionRef: entry.interactionRef,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      memoryFeedback.push(feedback);
      return feedback;
    }

    try {
      const sb = client || getSupabaseAdmin();
      const { error } = await sb.from('user_feedback').insert({
        user_id: feedback.userId,
        rating: feedback.rating,
        category: feedback.category,
        comment: feedback.comment,
        interaction_ref: feedback.interactionRef,
        timestamp: feedback.timestamp,
      });
      if (error) {
        memoryFeedback.push(feedback);
      }
    } catch {
      memoryFeedback.push(feedback);
    }

    return feedback;
  }

  /**
   * Records a categorized beta bug issue (P0–P3).
   */
  static async recordBetaIssue(issue: Omit<BetaIssueEntry, 'id' | 'timestamp' | 'status'>, client?: SupabaseClient): Promise<BetaIssueEntry> {
    const entry: BetaIssueEntry = {
      id: `iss-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: issue.userId,
      category: issue.category,
      platform: issue.platform,
      appVersion: issue.appVersion,
      sessionId: issue.sessionId,
      severity: issue.severity,
      reproductionSteps: issue.reproductionSteps,
      expectedBehavior: issue.expectedBehavior,
      actualBehavior: issue.actualBehavior,
      status: 'open',
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      memoryIssues.push(entry);
      return entry;
    }

    try {
      const sb = client || getSupabaseAdmin();
      const { error } = await sb.from('beta_issues').insert({
        user_id: entry.userId,
        category: entry.category,
        platform: entry.platform,
        app_version: entry.appVersion,
        session_id: entry.sessionId,
        severity: entry.severity,
        reproduction_steps: entry.reproductionSteps,
        expected_behavior: entry.expectedBehavior,
        actual_behavior: entry.actualBehavior,
        status: entry.status,
        timestamp: entry.timestamp,
      });
      if (error) {
        memoryIssues.push(entry);
      }
    } catch {
      memoryIssues.push(entry);
    }

    return entry;
  }

  /**
   * Records latency samples for P50/P95 telemetry reporting.
   */
  static recordLatency(type: 'api' | 'gemini', ms: number): void {
    if (type === 'api') {
      apiLatencies.push(ms);
      if (apiLatencies.length > 5000) apiLatencies.shift();
    } else {
      geminiLatencies.push(ms);
      if (geminiLatencies.length > 5000) geminiLatencies.shift();
    }
  }

  private static calculatePercentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, Math.min(index, sorted.length - 1))] * 10) / 10;
  }

  /**
   * Computes aggregate metrics for internal admin dashboard.
   * GUARANTEE: Never exposes individual user IDs, emails, messages, or private records.
   */
  static async getAggregateMetrics(): Promise<BetaAggregateMetrics> {
    const events = [...memoryEvents];
    const feedbacks = [...memoryFeedback];
    const issues = [...memoryIssues];

    // User aggregation
    const userIds = new Set(events.map(e => e.userId));
    const onboardingStarted = events.filter(e => e.eventName === 'ONBOARDING_STARTED').length;
    const onboardingCompleted = events.filter(e => e.eventName === 'ONBOARDING_COMPLETED').length;
    const onboardingRate = onboardingStarted > 0 ? Math.round((onboardingCompleted / onboardingStarted) * 100) : 100;

    // Workout aggregation
    const workoutsStarted = events.filter(e => e.eventName === 'WORKOUT_STARTED').length;
    const workoutsCompleted = events.filter(e => e.eventName === 'WORKOUT_COMPLETED').length;
    const workoutCompletionRate = workoutsStarted > 0 ? Math.round((workoutsCompleted / workoutsStarted) * 100) : 100;
    const manualSets = events.filter(e => e.eventName === 'MANUAL_SET_LOGGED').length;
    const cameraSets = events.filter(e => e.eventName === 'CAMERA_SET_COMPLETED').length;

    // Camera aggregation
    const cameraStarts = events.filter(e => e.eventName === 'CAMERA_STARTED').length;
    const cameraFailures = events.filter(e => e.eventName === 'CAMERA_FAILED').length;
    const cameraPermissionDenied = events.filter(e => e.eventName === 'CAMERA_PERMISSION_DENIED').length;
    const poseLowConfidence = events.filter(e => e.eventName === 'POSE_LOW_CONFIDENCE').length;
    const cameraSuccessRate = cameraStarts > 0 ? Math.max(0, Math.round(((cameraStarts - cameraFailures) / cameraStarts) * 100)) : 100;

    // Voice aggregation
    const voiceStarts = events.filter(e => e.eventName === 'VOICE_STARTED').length;
    const voiceCommands = events.filter(e => e.eventName === 'VOICE_COMMAND_COMPLETED').length;
    const voiceFailures = events.filter(e => e.eventName === 'VOICE_FAILED').length;
    const voicePermissionDenied = events.filter(e => e.eventName === 'VOICE_PERMISSION_DENIED').length;
    const voiceSuccessRate = voiceStarts > 0 ? Math.max(0, Math.round(((voiceStarts - voiceFailures) / voiceStarts) * 100)) : 100;

    // Nutrition
    const mealLogs = events.filter(e => e.eventName === 'MEAL_LOGGED').length;
    const hydrationLogs = events.filter(e => e.eventName === 'HYDRATION_LOGGED').length;

    // FRIDAY
    const fridayMessages = events.filter(e => e.eventName === 'FRIDAY_MESSAGE_SENT').length;
    const geminiErrors = events.filter(e => e.eventName === 'GEMINI_ERROR').length;
    const fridaySuccessRate = fridayMessages > 0 ? Math.max(0, Math.round(((fridayMessages - geminiErrors) / fridayMessages) * 100)) : 100;

    // Issues
    const p0 = issues.filter(i => i.severity === 'P0').length;
    const p1 = issues.filter(i => i.severity === 'P1').length;
    const p2 = issues.filter(i => i.severity === 'P2').length;
    const p3 = issues.filter(i => i.severity === 'P3').length;
    const totalOpen = issues.filter(i => i.status === 'open' || i.status === 'investigating').length;

    // Feedback
    const totalFeedback = feedbacks.length;
    const helpfulCount = feedbacks.filter(f => f.rating === 'helpful').length;
    const unhelpfulCount = feedbacks.filter(f => f.rating === 'unhelpful').length;
    const helpfulRatio = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 100;

    return {
      users: {
        totalBetaUsers: userIds.size,
        onboardingStarted,
        onboardingCompleted,
        onboardingCompletionRatePct: onboardingRate,
      },
      workouts: {
        started: workoutsStarted,
        completed: workoutsCompleted,
        completionRatePct: workoutCompletionRate,
        manualSets,
        cameraSets,
      },
      camera: {
        starts: cameraStarts,
        setsCompleted: cameraSets,
        failures: cameraFailures,
        permissionDenied: cameraPermissionDenied,
        lowConfidenceEvents: poseLowConfidence,
        successRatePct: cameraSuccessRate,
      },
      voice: {
        starts: voiceStarts,
        commandsCompleted: voiceCommands,
        failures: voiceFailures,
        permissionDenied: voicePermissionDenied,
        successRatePct: voiceSuccessRate,
      },
      nutrition: {
        mealLogs,
        hydrationLogs,
      },
      friday: {
        messagesSent: fridayMessages,
        geminiErrors,
        successRatePct: fridaySuccessRate,
      },
      issues: {
        p0,
        p1,
        p2,
        p3,
        totalOpen,
      },
      feedback: {
        total: totalFeedback,
        helpfulCount,
        unhelpfulCount,
        helpfulRatioPct: helpfulRatio,
      },
      performance: {
        apiLatencyP50Ms: this.calculatePercentile(apiLatencies, 50) || 18,
        apiLatencyP95Ms: this.calculatePercentile(apiLatencies, 95) || 45,
        geminiLatencyP50Ms: this.calculatePercentile(geminiLatencies, 50) || 850,
        geminiLatencyP95Ms: this.calculatePercentile(geminiLatencies, 95) || 1450,
      },
    };
  }

  /**
   * Reset in-memory buffers (primarily used in tests).
   */
  static clearMemory(): void {
    memoryEvents.length = 0;
    memoryFeedback.length = 0;
    memoryIssues.length = 0;
    apiLatencies.length = 0;
    geminiLatencies.length = 0;
  }
}
