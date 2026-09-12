-- ====================================================================
-- FRIDAY AI FITNESS TRAINER — PHASE 13: ANALYTICS, FEEDBACK & BETA ISSUES
-- ====================================================================

-- 1. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_time 
  ON public.analytics_events (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_time 
  ON public.analytics_events (event_name, timestamp DESC);


-- 2. USER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'unhelpful')),
  category TEXT NOT NULL CHECK (category IN (
    'workout', 'camera', 'voice', 'nutrition', 'hydration', 
    'progress', 'friday_answer', 'ui', 'bug', 'other'
  )),
  comment TEXT,
  interaction_ref TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_user_time 
  ON public.user_feedback (user_id, timestamp DESC);


-- 3. BETA ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.beta_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL,
  session_id TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  reproduction_steps TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  actual_behavior TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bug issues"
  ON public.beta_issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own bug issues"
  ON public.beta_issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_beta_issues_severity 
  ON public.beta_issues (severity, timestamp DESC);
