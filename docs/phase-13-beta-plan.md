# Phase 13 Closed Beta Operating Plan — FRIDAY Personal AI Trainer

## 1. Executive Summary & Objectives
The purpose of Phase 13 is to validate the existing FRIDAY application with real human users and real physical devices in authentic fitness environments.

### Core Objectives:
1. **Real User Workflow Validation**: Ensure 5–10 beta testers can complete the full onboarding, workout generation, camera/manual set logging, nutrition/hydration tracking, and progress check-in workflow without developer intervention.
2. **Physical Device Performance**: Collect empirical telemetry from physical iPhone Safari (iOS 17+) and Android Chrome (Android 14) devices covering pose detection FPS, camera thermal behavior, Web Speech transcription accuracy, and Bluetooth audio headset routing in gym environments.
3. **Observability & Error Monitoring**: Track privacy-preserving product funnel events, API latencies, and 5xx errors while strictly filtering out sensitive user content, credentials, progress photos, and raw media streams.
4. **Actionable Feedback & Issue Triage**: Gather structured thumbs up/down feedback, user complaints, and categorized P0–P3 bug reports to prioritize fixes before public launch.

---

## 2. Current Deployment State & Phase 12 Blockers

### Actual Deployment Status:
> [!WARNING]
> **BLOCKED — STAGING DEPLOYMENT PENDING**
> 
> While the backend Docker container build, health/readiness endpoints, strict CORS policy, and 14-step automated E2E staging test suite have all been verified locally and in CI, the external public Google Cloud Run service, custom staging DNS (`api-staging.friday-fitness.internal`), and hosted Supabase staging instance have not yet been live-provisioned.
> 
> In accordance with Phase 13 rules, we do not pretend external staging is deployed until public endpoints are provisioned and accessible over the internet.

### Remaining Phase 12 Blockers to Close Before Full Public GA:
1. **Public Cloud Run & DNS Provisioning**: Deploy `friday-backend:staging-v1.0.0` container to Google Cloud Run and configure SSL certificates.
2. **Physical iPhone Safari WebRTC Camera Validation**: Real mobile viewport test on physical iPhone 13+ over HTTPS to verify permission prompts and 30 FPS pose tracking.
3. **Physical Android Chrome Voice Validation**: Real mobile test on Pixel/Galaxy with Bluetooth headphones in active gym acoustics to verify Web Speech transcription and TTS latency.
4. **Live Hosted Database Load Test**: Execute 1,000 simulated concurrent user load test against the live Supabase staging pooler.

---

## 3. Beta Cohort & Onboarding Guidelines

### Cohort Profile (Target: 5–10 Users)
- **Separate Accounts**: Every user registers an individual authenticated account via Supabase Auth. Shared test accounts are strictly forbidden.
- **Device Diversity**:
  - 3–5 iOS users (iPhone 12, 13, 14, 15 Pro, iOS 17+)
  - 3–5 Android users (Pixel 7/8, Samsung Galaxy S22/S23, Android 14)
  - Desktop / Tablet testers (macOS Safari/Chrome, iPadOS Safari)
- **Audio Gear Diversity**: Built-in phone mic, AirPods Pro, Galaxy Buds, wired gym headphones.

### User Onboarding Protocol (Zero Developer Handholding)
Beta users receive the following 12-step self-guided checklist:
1. Open FRIDAY via the staging link.
2. Create your account and verify email.
3. Complete the onboarding questionnaire (select your available equipment, fitness goal, and experience).
4. Review your personalized daily plan on the Dashboard.
5. Start today's workout session.
6. Position phone and attempt camera tracking for at least 1 set.
7. Attempt logging a set using voice or manual input.
8. Complete the workout session and review progression ladder updates.
9. Log at least one meal (breakfast, lunch, or dinner) and check macro targets.
10. Log water intake.
11. Ask FRIDAY a coaching question in the chat drawer.
12. Review your progress dashboard and return tomorrow.

---

## 4. Telemetry & Data Model Specifications

### Non-Sensitive Funnel Events
The application emits structured events validated against a strict allowlist:
- **App Lifecycle**: `APP_OPENED`, `SIGNUP_COMPLETED`, `ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`
- **Workout Funnel**: `WORKOUT_VIEWED`, `WORKOUT_STARTED`, `WORKOUT_COMPLETED`, `MANUAL_SET_LOGGED`
- **Camera Pose Funnel**: `CAMERA_STARTED`, `CAMERA_SET_COMPLETED`, `CAMERA_FAILED`, `POSE_LOW_CONFIDENCE`, `CAMERA_PERMISSION_DENIED`, `CAMERA_INITIALIZATION_FAILED`
- **Voice Funnel**: `VOICE_STARTED`, `VOICE_COMMAND_COMPLETED`, `VOICE_FAILED`, `VOICE_PERMISSION_DENIED`, `VOICE_RECOGNITION_FAILED`
- **Nutrition & Hydration**: `MEAL_LOGGED`, `HYDRATION_LOGGED`
- **FRIDAY AI Agent**: `FRIDAY_MESSAGE_SENT`
- **Progress & Check-In**: `PROGRESS_VIEWED`, `CHECKIN_COMPLETED`
- **Operational Failures**: `API_ERROR`, `GEMINI_ERROR`, `AUTH_ERROR`, `NETWORK_ERROR`

### Data Schema (`analytics_events`)
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'
);
```

### Strict Privacy Constraints:
- **NEVER LOG**: Passwords, authorization headers, JWT tokens, Gemini API keys, raw camera video frames, progress photo binaries, raw audio audio clips, or full sensitive conversational transcripts.
- **Server-Side Identity**: `user_id` is always extracted from the verified JWT bearer token (`req.user.id`). Users cannot forge events for other users.
- **Payload Scrubbing**: Client and server sanitizers recursively strip keys matching `token`, `password`, `secret`, `key`, `audio`, `frame`, `photo`, or `base64`.

---

## 5. User Feedback & Bug Reporting

### User Feedback (`user_feedback`)
Allows users to submit lightweight reactions on major interaction screens:
- Rating: `helpful` (👍) or `unhelpful` (👎)
- Category: `workout`, `camera`, `voice`, `nutrition`, `hydration`, `progress`, `friday_answer`, `ui`, `bug`, `other`
- Optional comment (max 500 characters)

### Beta Bug Issue Model (`beta_issues`)
Structured classification for beta discoveries:
- **P0**: System crash, data corruption, privacy violation, or completely blocked workflow.
- **P1**: Major feature broken without simple workaround (e.g. set logging fails to save).
- **P2**: Significant inconvenience with workaround available (e.g. camera angle warning false alarm).
- **P3**: Minor cosmetic defect, alignment issue, or copy polish.

Fields: `category`, `platform`, `app_version`, `session_id`, `severity`, `reproduction_steps`, `expected_behavior`, `actual_behavior`, `status`.

---

## 6. Feature Flags
To isolate risk during beta testing, the backend provides runtime feature flags via `GET /api/telemetry/feature-flags`:
- `camera_tracking`: Allows instant fallback to manual set logging if camera crashes on specific hardware.
- `voice_input`: Allows disabling microphone interface if browser speech recognition encounters crashes.
- `gemini_coaching`: Allows falling back to deterministic local rule engines if Gemini API exceeds quotas or suffers latency spikes.

---

## 7. Success Criteria & Rollback Thresholds

### Beta Success Thresholds:
- **Critical Issues**: 0 P0 bugs, 0 privacy/data leak issues, 0 exposed secrets.
- **Onboarding Completion**: ≥ 80% of registered beta users complete profile setup.
- **Workout Start Rate**: ≥ 95% of planned workouts launch without error.
- **Workout Completion Rate**: ≥ 90% of started workouts conclude successfully.
- **API 5xx Rate**: < 1.0% across all endpoints.
- **Camera Set Completion Rate**: ≥ 80% of camera-initiated sets complete without crash/bailout.
- **Voice Recognition Success Rate**: ≥ 85% on standard workout commands.
- **Gemini Response Latency**: P50 < 1.0s, P95 < 2.0s; 100% graceful fallback to deterministic engine on error.

### Rollback / Pause Triggers:
- Any P0 data breach, cross-user data leakage, or credential exposure triggers immediate rollback and beta pause.
- Unhandled 5xx rate > 5% triggers container rollback to previous stable tag.
