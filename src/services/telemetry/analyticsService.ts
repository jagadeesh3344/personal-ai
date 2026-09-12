export type AnalyticsEventName =
  | 'APP_OPENED'
  | 'SIGNUP_COMPLETED'
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED'
  | 'WORKOUT_VIEWED'
  | 'WORKOUT_STARTED'
  | 'WORKOUT_COMPLETED'
  | 'CAMERA_STARTED'
  | 'CAMERA_SET_COMPLETED'
  | 'CAMERA_FAILED'
  | 'MANUAL_SET_LOGGED'
  | 'VOICE_STARTED'
  | 'VOICE_COMMAND_COMPLETED'
  | 'VOICE_FAILED'
  | 'MEAL_LOGGED'
  | 'HYDRATION_LOGGED'
  | 'FRIDAY_MESSAGE_SENT'
  | 'PROGRESS_VIEWED'
  | 'CHECKIN_COMPLETED'
  | 'API_ERROR'
  | 'GEMINI_ERROR'
  | 'AUTH_ERROR'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_INITIALIZATION_FAILED'
  | 'POSE_LOW_CONFIDENCE'
  | 'VOICE_PERMISSION_DENIED'
  | 'VOICE_RECOGNITION_FAILED'
  | 'NETWORK_ERROR';

export interface FeedbackSubmission {
  rating: 'helpful' | 'unhelpful';
  category: 'workout' | 'camera' | 'voice' | 'nutrition' | 'hydration' | 'progress' | 'friday_answer' | 'ui' | 'bug' | 'other';
  comment?: string;
  interactionRef?: string;
}

export interface BugIssueSubmission {
  category: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
}

const FORBIDDEN_KEYS_REGEX = /token|password|secret|key|auth|cred|audio|frame|photo|base64|raw|transcript/i;

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return 'web';
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('friday_telemetry_sid');
    if (!sid) {
      sid = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('friday_telemetry_sid', sid);
    }
    return sid;
  } catch {
    return 'fallback-session';
  }
}

export class AnalyticsService {
  private static eventQueue: Array<{
    eventName: AnalyticsEventName;
    platform: string;
    appVersion: string;
    sessionId: string;
    metadata?: Record<string, any>;
  }> = [];

  private static flushTimeout: any = null;

  /**
   * Client-side privacy scrubber. Ensures zero tokens, passwords, raw audio/video frames,
   * or photos are ever sent in analytics payloads.
   */
  static sanitizeMetadata(raw: Record<string, any> = {}): Record<string, any> {
    if (!raw || typeof raw !== 'object') return {};

    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (FORBIDDEN_KEYS_REGEX.test(key)) {
        continue;
      }

      if (typeof val === 'string') {
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
   * Tracks a product funnel event.
   */
  static trackEvent(eventName: AnalyticsEventName, metadata: Record<string, any> = {}): void {
    const event = {
      eventName,
      platform: detectPlatform(),
      appVersion: '1.0.0',
      sessionId: getSessionId(),
      metadata: this.sanitizeMetadata(metadata),
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= 10) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flush();
      }, 5000);
    }
  }

  /**
   * Flushes queued events to the backend.
   */
  static async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const token = typeof localStorage !== 'undefined'
        ? (localStorage.getItem('supabase_token') || localStorage.getItem('sb_access_token'))
        : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/telemetry/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch {
      // Requeue uncompleted events up to limit of 50
      this.eventQueue = [...eventsToSend.slice(-25), ...this.eventQueue].slice(0, 50);
    }
  }

  /**
   * Submits structured user feedback (👍 / 👎).
   */
  static async submitFeedback(feedback: FeedbackSubmission): Promise<boolean> {
    try {
      const token = typeof localStorage !== 'undefined'
        ? (localStorage.getItem('supabase_token') || localStorage.getItem('sb_access_token'))
        : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/telemetry/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(feedback),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Reports a beta bug issue (P0–P3).
   */
  static async reportIssue(issue: BugIssueSubmission): Promise<boolean> {
    try {
      const token = typeof localStorage !== 'undefined'
        ? (localStorage.getItem('supabase_token') || localStorage.getItem('sb_access_token'))
        : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        category: issue.category,
        platform: detectPlatform(),
        appVersion: '1.0.0',
        sessionId: getSessionId(),
        severity: issue.severity,
        reproductionSteps: issue.reproductionSteps,
        expectedBehavior: issue.expectedBehavior,
        actualBehavior: issue.actualBehavior,
      };

      const res = await fetch('/api/telemetry/issues', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clears queue (used for testing).
   */
  static clearQueue(): void {
    this.eventQueue = [];
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  /**
   * Returns current pending queue for inspection in tests.
   */
  static getQueue() {
    return [...this.eventQueue];
  }
}
