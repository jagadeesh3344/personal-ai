export interface FeatureFlags {
  camera_tracking: boolean;
  voice_input: boolean;
  gemini_coaching: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  camera_tracking: true,
  voice_input: true,
  gemini_coaching: true,
};

let cachedFlags: FeatureFlags = { ...DEFAULT_FLAGS };
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export class FeatureFlagsService {
  static getFlags(): FeatureFlags {
    return { ...cachedFlags };
  }

  static isEnabled(flag: keyof FeatureFlags): boolean {
    return cachedFlags[flag] ?? true;
  }

  static async fetchFlags(): Promise<FeatureFlags> {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_TTL_MS) {
      return this.getFlags();
    }

    try {
      const res = await fetch('/api/telemetry/feature-flags');
      if (res.ok) {
        const data = await res.json();
        if (data.flags) {
          cachedFlags = { ...DEFAULT_FLAGS, ...data.flags };
          lastFetchTime = now;
        }
      }
    } catch {
      // Graceful fallback to default/cached flags on network error
    }

    return this.getFlags();
  }

  static setLocalOverride(flag: keyof FeatureFlags, enabled: boolean): void {
    cachedFlags[flag] = enabled;
  }

  static reset(): void {
    cachedFlags = { ...DEFAULT_FLAGS };
    lastFetchTime = 0;
  }
}
