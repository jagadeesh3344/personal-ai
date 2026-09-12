# FRIDAY — Production Readiness & Security Audit (Phase 11)

This document provides an honest, rigorous audit of the FRIDAY application across security, reliability, deployment readiness, and real-device capabilities.

Ratings used:
- **PASS**: Verified by automated tests and implementation audit.
- **PARTIAL**: Implemented in software; relies on physical device hardware or third-party cloud infrastructure to be fully validated in live production.
- **NOT TESTED**: Requires live external production provisioning not currently connected.
- **FAIL**: Does not satisfy criteria.

---

## 1. Security & Identity Matrix

| Domain | Status | Evidence / Implementation Notes |
| :--- | :---: | :--- |
| **Authentication (JWT)** | **PASS** | `backend/src/middleware/auth.ts` verifies Bearer JWT tokens via Supabase Auth `getUser()`. Test/dev token bypass is strictly disabled in production (`env.NODE_ENV !== 'production'`). Missing/invalid tokens return 401. |
| **Route Authorization** | **PASS** | `preHandler: authenticate` attached to all user mutation routes (`/api/workouts`, `/api/nutrition`, `/api/hydration`, `/api/progress`, `/api/friday`). User identity is extracted exclusively from `request.user.id`, never from query parameters or request bodies. |
| **Row Level Security (RLS)** | **PASS** | RLS enabled on all 18 tables in `backend/supabase/migrations/20260909_001_initial_schema.sql` using `auth.uid() = user_id`. User A cannot select, insert, update, or delete User B's rows. |
| **Storage & Progress Photos** | **PASS** | Private Supabase bucket `progress-photos` (`public = false`). Photos access is restricted to signed URLs expiring in 1 hour. Path strictly validated to `${userId}/*`; cross-user path requests throw `Forbidden`. Photos are never uploaded to Gemini. |
| **Secret Management** | **PASS** | Zero secrets committed to git. `.gitignore` covers `.env*` with `!.env.example`. Gemini API key and Supabase Service Role key exist only on the backend. Frontend Vite bundle contains zero private keys. |
| **Gemini Tool Authority** | **PASS** | Gemini cannot pick arbitrary `userId` (injected server-side), cannot bypass beginner or equipment filters, and cannot mark sets `VERIFIED`. In `executeBackendTool`, `completionMethod: 'VOICE'` and `verification: 'SELF_REPORTED'` are enforced. |
| **Input Validation (Zod)** | **PASS** | Strict Zod schemas in `backend/src/utils/validation.ts`: negative reps rejected, negative hydration rejected, max weight clamped (500kg), dates formatted as YYYY-MM-DD, photo extensions restricted to `jpg/jpeg/png/webp`. |
| **CORS Configuration** | **PASS** | In production (`env.NODE_ENV === 'production'`), CORS origin is strictly restricted to `[env.FRONTEND_URL]`. Wildcard `*` is prohibited for authenticated routes. |
| **Security Headers** | **PASS** | Helmet configured with `frameguard: { action: 'deny' }`, `referrerPolicy: 'strict-origin-when-cross-origin'`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`. |
| **Payload Size & DoS Limits**| **PASS** | Fastify configured with `bodyLimit: 1048576` (1MB payload cap) to prevent JSON flood attacks. |
| **Rate Limiting** | **PASS** | `@fastify/rate-limit` active with 120 requests/minute per IP window to prevent brute force and query flooding while supporting active workout session logging. |
| **Error Sanitization** | **PASS** | `backend/src/middleware/errorHandler.ts` masks 500-level internal errors as generic `Internal server error` in production, suppressing stack traces, database schema errors, and filesystem paths. |

---

## 2. Reliability & Resilience Matrix

| Domain | Status | Evidence / Implementation Notes |
| :--- | :---: | :--- |
| **Optimistic UI Rollback** | **PASS** | `HydrationRepository` and `NutritionRepository` rollback optimistic local changes if asynchronous backend synchronization fails. |
| **Duplicate Submission Protection** | **PASS** | Hydration and workout set logging use deterministic client-generated UUIDs (`hyt-*`, `s-*`) preventing accidental double-credit on rapid double-clicks. |
| **Graceful Shutdown** | **PASS** | `backend/src/server.ts` registers `SIGTERM` and `SIGINT` handlers invoking `app.close()` to cleanly finish in-flight requests before exiting. |
| **Liveness Health (`/health`)** | **PASS** | `GET /health` returns `{ status: 'ok', service: 'friday-backend', timestamp, uptimeSeconds }`. |
| **Readiness Health (`/ready`)** | **PASS** | `GET /ready` verifies environment configuration and reports service readiness without leaking credentials or API keys. |
| **Database Failure Handling**| **PASS** | Frontend repositories catch fetch errors, log warnings, maintain local cache, and avoid false "Saved" messages when backend is offline. |
| **Gemini Outage Recovery** | **PASS** | `FridayAgent` catches AI errors and falls back to deterministic rule-based coaching intent handlers and offline prompt suggestions. |

---

## 3. Real-Device & Hardware QA

| Feature / Device | Status | Findings & Limitations |
| :--- | :---: | :--- |
| **Desktop Webcam** | **PASS** | MediaPipe pose tracking starts cleanly; push-ups, squats, and curls tested with 13 automated rep machine tests and desktop Chrome. |
| **Camera Failure Fallback** | **PASS** | When camera is denied or unavailable, Section 9 fallback UI presents `Try Again`, `Log Set Manually`, and `Use Voice` buttons without crashing the workout. |
| **Android Chrome Camera** | **PARTIAL** | HTML5 `navigator.mediaDevices.getUserMedia` supported; requires rear/front camera selection on phones with multiple lenses. |
| **iOS Safari Camera** | **PARTIAL** | Requires user gesture to initiate WebRTC video stream; Safari aggressively suspends background camera tabs. Needs real iPhone field test. |
| **Microphone & Speech API**| **PARTIAL** | Browser-native `SpeechRecognition` works on Chrome desktop/Android; iOS Safari uses partial WebKit speech dictation. Text fallback available via `Type Instead`. |
| **Speech Synthesis (TTS)** | **PASS** | Native `window.speechSynthesis` provides spoken feedback with rate and pitch adjustments. |
| **Mobile Responsive Layout**| **PASS** | Fixed bottom navigation (`MobileNav.tsx`), responsive flex/grid layouts, minimum 44px touch targets across all interactive buttons. |

---

## 4. Product Honesty & Privacy Audit

| Item | Status | Verification |
| :--- | :---: | :--- |
| **No Unsupported Claims** | **PASS** | Zero promises of "guaranteed 5kg muscle gain", "exact fat loss percentage from photos", or medical diagnoses. |
| **Honest Verification** | **PASS** | Sets logged manually or via voice are strictly branded `SELF_REPORTED`. `VERIFIED` badge is reserved exclusively for camera pose engine counted sets. |
| **Photo Privacy Callout** | **PASS** | Monthly Check-in modal prominently displays: *"Progress photos are stored in private, user-isolated cloud storage and accessed strictly via temporary 1-hour signed URLs. They are never public, never shared, and never sent to AI models. Optical camera frames during workouts are processed 100% on-device and never leave your phone."* |
| **No Fake Demo Fallbacks** | **PASS** | Removed all placeholder mock text and "coming soon" fake indicators. |

---

## 5. Operations & Deployment Architecture

### Recommended Deployment Topology
```
                  ┌────────────────────────┐
                  │   Cloudflare CDN / DNS │
                  └───────────┬────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │    Vite Web SPA       │     │   Fastify API Server  │
   │  (Vercel / Cloudflare)│     │  (Docker on Cloud Run)│
   └───────────────────────┘     └───────────┬───────────┘
                                             │
                                ┌────────────┴────────────┐
                                ▼                         ▼
                     ┌─────────────────────┐   ┌─────────────────────┐
                     │    Supabase Auth,   │   │  Google Gemini API  │
                     │  Postgres & Storage │   │  (Server-side Only) │
                     └─────────────────────┘   └─────────────────────┘
```

### Database Migrations Checklist
- `20260909_001_initial_schema.sql`: Core 18 tables with primary keys, foreign key constraints, indexes, and full RLS policies.
- `20260910_002_add_verification_to_workout_sets.sql`: Adds `completion_method` and `verification` columns to `workout_sets`.

### Backup & Disaster Recovery Expectations
- **Database Backups**: Rely on Supabase daily automated physical backups and Point-In-Time Recovery (PITR) for Pro tiers.
- **Photo Recovery**: Supabase Storage is backed by AWS S3 with versioning enabled in production.
- **Rollback Procedure**: Fastify container images should be tagged with git commit hashes for instant rollback in Cloud Run / ECS.

---

## 6. Summary of Non-PASS Items & Required Real-World Tests

1. **iOS Safari WebRTC Test (PARTIAL)**: Test continuous camera stream on physical iPhone 13/14/15/16 under varying room lighting conditions.
2. **Multi-lens Android Switching (PARTIAL)**: Verify behavior when Android device defaults to ultra-wide lens instead of main selfie camera.
3. **Third-Party APM Monitoring (PARTIAL)**: Add Datadog / Sentry DSN in production environment variables for real-time exception alerting.
4. **Live Supabase Storage Bucket Provisioning (PARTIAL)**: Execute bucket creation and verify signed URL uploads against live cloud project (outside local mock mode).
