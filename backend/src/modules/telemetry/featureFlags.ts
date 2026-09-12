export interface FeatureFlags {
  camera_tracking: boolean;
  voice_input: boolean;
  gemini_coaching: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags = {
    camera_tracking: process.env.FEATURE_FLAG_CAMERA_TRACKING !== 'false',
    voice_input: process.env.FEATURE_FLAG_VOICE_INPUT !== 'false',
    gemini_coaching: process.env.FEATURE_FLAG_GEMINI_COACHING !== 'false',
  };

  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.flags[flag];
  }

  public setFlag(flag: keyof FeatureFlags, enabled: boolean): void {
    this.flags[flag] = enabled;
  }

  public resetToDefaults(): void {
    this.flags = {
      camera_tracking: process.env.FEATURE_FLAG_CAMERA_TRACKING !== 'false',
      voice_input: process.env.FEATURE_FLAG_VOICE_INPUT !== 'false',
      gemini_coaching: process.env.FEATURE_FLAG_GEMINI_COACHING !== 'false',
    };
  }
}

export const featureFlags = new FeatureFlagManager();
