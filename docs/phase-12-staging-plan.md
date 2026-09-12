# FRIDAY — Phase 12 Staging Deployment & Live Cloud Plan

This document establishes the staging deployment blueprint, cloud infrastructure mapping, environment variables separation, migration sequence, and testing matrix to transition FRIDAY to a live cloud staging environment.

---

## 1. Current Architecture

```
                                  [ Browser / Mobile Client ]
                                   (React 19 / Vite / Tailwind)
                                                │
                               HTTPS Requests   │  WebRTC Media Stream (Local Canvas / WASM)
                                                ▼
                                    [ Fastify API Server ]
                                      (Node.js 22 Container)
                                       │                  │
                         SQL & RLS     │                  │ REST + Function Tools
                                       ▼                  ▼
                    [ Supabase Staging ]           [ Google Gemini 2.5 ]
                   - Auth (JWT Verification)        - Conversational Trainer
                   - PostgreSQL 15 (18 Tables)      - Deterministic Tool Calls
                   - Storage (Private Bucket)
```

1. **Frontend**: Single-page application built with React, TypeScript, and Vite. Interacts with the backend via a typed REST API client (`src/services/api/client.ts`). MediaPipe camera pose estimation runs 100% in-browser on WebGL/WASM canvases without streaming video across the network.
2. **Backend**: Fastify server handling authentication (`@fastify/jwt` / Supabase auth verification), security headers (`@fastify/helmet`), rate limiting (`@fastify/rate-limit`), CORS, and deterministic orchestration.
3. **Database & Storage**: Managed Supabase PostgreSQL with 18 user-scoped tables protected by Row Level Security (`auth.uid() = user_id`) and private S3-compatible storage (`progress-photos`).
4. **AI Intelligence**: Google Gemini server-side integration with strict tool definitions. Gemini never accesses raw database connections and executes tools strictly under authenticated JWT context.

---

## 2. Required Cloud Services

| Cloud Service | Provider | Purpose | Configuration Details |
| :--- | :--- | :--- | :--- |
| **Container Hosting** | Google Cloud Run / AWS ECS | Fastify Backend hosting | Docker container (Node 22-alpine), minimum 1 CPU, 512MB RAM, auto-scaling 0 to 5 instances, health checks at `/health` and `/ready`. |
| **Web SPA Hosting** | Vercel / Cloudflare Pages | Frontend static distribution | Global CDN, edge caching for static assets, SPA route fallback (`/index.html`). |
| **Database & Auth** | Supabase (Staging Project) | Relational DB & Identity | Dedicated staging project `friday-staging.supabase.co`. |
| **Object Storage** | Supabase Storage (S3 API) | Private progress photos | Private bucket `progress-photos`, authenticated access via signed URLs only. |
| **AI LLM API** | Google AI Studio (Gemini) | Natural language coach | Gemini 2.5 Flash API key scoped to backend container. |

---

## 3. Required Environment Variables

### Frontend Environment (Vite / Vercel)
| Variable | Environment | Description | Sensitive? |
| :--- | :--- | :--- | :---: |
| `VITE_API_URL` | Staging / Production | Base backend API URL (e.g. `https://api-staging.friday-trainer.app/api`) | No |

### Backend Environment (Cloud Run / Container)
| Variable | Environment | Description | Sensitive? |
| :--- | :--- | :--- | :---: |
| `NODE_ENV` | Staging | Set to `'staging'` (or `'production'`) | No |
| `PORT` | Staging | Port listened to by container (e.g. `8080` for Cloud Run, default `4000`) | No |
| `HOST` | Staging | Binds to `0.0.0.0` | No |
| `FRONTEND_URL` | Staging | Frontend staging origin for CORS (e.g. `https://staging.friday-trainer.app`) | No |
| `SUPABASE_URL` | Staging | Staging Supabase project URL (e.g. `https://xyz-staging.supabase.co`) | No |
| `SUPABASE_ANON_KEY` | Staging | Public client key for user-scoped client instantiations | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging | Elevated server-side admin key (backend only) | **YES** |
| `SUPABASE_JWT_SECRET` | Staging | JWT signature secret for validating Supabase access tokens | **YES** |
| `GEMINI_API_KEY` | Staging | Google AI Studio API key | **YES** |

---

## 4. Deployment Order

```
Step 1: Provision Supabase Staging Project
   ↓
Step 2: Execute Migration 001 (Schema, RLS, Storage Bucket)
   ↓
Step 3: Execute Migration 002 (Verification & Duration Columns)
   ↓
Step 4: Build & Deploy Backend Container (Cloud Run)
   ↓
Step 5: Verify Backend Health: GET /health and GET /ready
   ↓
Step 6: Build & Deploy Frontend SPA (Vercel / Cloudflare Pages) with VITE_API_URL
   ↓
Step 7: Verify Frontend ↔ Backend CORS connectivity
   ↓
Step 8: Execute End-to-End Test Journey
```

---

## 5. Staging URLs & Placeholders

- **Frontend Staging Target**: `https://staging.friday-trainer.app` (or Vercel preview deployment URL)
- **Backend Staging Target**: `https://api-staging.friday-trainer.app` (or Cloud Run service URL: `https://friday-backend-staging-xyz-uc.a.run.app`)
- **Supabase Project Staging URL**: `https://[PROJECT-REF].supabase.co`
- **Health Check URL**: `https://api-staging.friday-trainer.app/health`
- **Readiness Check URL**: `https://api-staging.friday-trainer.app/ready`

---

## 6. Database Migration Sequence

Execute against Supabase Staging PostgreSQL instance via Supabase CLI or SQL Editor:

1. **Migration 001: Initial Schema & RLS**
   - File: `backend/supabase/migrations/20260909_001_initial_schema.sql`
   - Actions: Enables `uuid-ossp`, creates 18 tables, indexes high-frequency queries, enables RLS on all 18 tables with `auth.uid() = user_id`, creates `progress-photos` private storage bucket, and applies storage RLS.
2. **Migration 002: Add Verification to Workout Sets**
   - File: `backend/supabase/migrations/20260910_002_add_verification_to_workout_sets.sql`
   - Actions: Adds `completion_method` (`CAMERA`, `VOICE`, `MANUAL`), `verification` (`VERIFIED`, `SELF_REPORTED`), `duration_seconds`, and `resistance_level` to `public.workout_sets`.

---

## 7. Manual QA Test Matrix

| Category | Test Case | Target Device / Browser | Expected Authoritative Result |
| :--- | :--- | :--- | :--- |
| **Authentication** | Sign up new staging user | Desktop Chrome | User created in `auth.users`, profile record created in `public.profiles`. |
| **Auth Expiry** | Expire JWT token | Mobile Safari | API returns 401, frontend shows session expired notice without looping. |
| **Cross-User RLS** | User A queries User B data | Postman / cURL | Returns 0 rows or 403 Forbidden. |
| **Photo Upload** | Upload front progress photo | Desktop / iOS Safari | Signed upload URL generated; file saved in `progress-photos/{userId}/*`. |
| **Cross-User Photo** | User B attempts signed URL for User A | API request | Backend throws Forbidden (400/403). |
| **Camera Pose** | Perform 5 push-ups | Physical Laptop / Webcam | Optical engine counts reps; set recorded with `verification: 'VERIFIED'`. |
| **Camera Fallback** | Deny camera permission | iPhone Safari | Section 9 fallback UI renders: `Try Again`, `Log Set Manually`, `Use Voice`. |
| **Voice Logging** | "I drank 500 ml" | Android Chrome | Tool executes `logHydration(500)`; database reflects 500ml addition. |
| **Rest Timer** | Log set, trigger rest | Any Browser | 60s countdown starts with pause/+15s/skip controls. |
| **Offline Resilience** | Disconnect network mid-workout | Mobile Chrome | UI notifies connection lost; local cache preserves set; syncs upon reconnect. |

---

## 8. Rollback Plan

1. **Frontend Rollback**:
   - Vercel / Cloudflare Pages: Instantly roll back to previous deployment alias in 1 click (< 10 seconds).
2. **Backend Rollback**:
   - Cloud Run: Revert traffic routing to prior revision tag (< 30 seconds).
3. **Database Migration Rollback**:
   - Migrations are strictly additive (`ADD COLUMN IF NOT EXISTS`).
   - If emergency rollback is required, downgrade script drops added columns without corrupting core tables:
     ```sql
     ALTER TABLE public.workout_sets DROP COLUMN IF EXISTS completion_method;
     ALTER TABLE public.workout_sets DROP COLUMN IF EXISTS verification;
     ```
