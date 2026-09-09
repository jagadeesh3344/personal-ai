-- ====================================================================
-- FRIDAY AI FITNESS TRAINER — PRODUCTION SUPABASE SCHEMA MIGRATION
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 10 AND age <= 120),
    sex TEXT NOT NULL CHECK (sex IN ('MALE', 'FEMALE', 'OTHER')),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 0),
    current_weight_kg NUMERIC(5,2) NOT NULL CHECK (current_weight_kg > 0),
    target_weight_kg NUMERIC(5,2) NOT NULL CHECK (target_weight_kg > 0),
    goal TEXT NOT NULL CHECK (goal IN ('FAT_LOSS', 'GAIN_MUSCLE', 'BODY_RECOMPOSITION', 'STRENGTH', 'GENERAL_FITNESS', 'ENDURANCE')),
    activity_level TEXT NOT NULL CHECK (activity_level IN ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE')),
    training_experience TEXT NOT NULL CHECK (training_experience IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    training_environment TEXT NOT NULL CHECK (training_environment IN ('HOME', 'GYM', 'OUTDOOR')),
    diet_preference TEXT NOT NULL CHECK (diet_preference IN ('STANDARD', 'VEGETARIAN', 'VEGAN', 'KETO', 'PALEO')),
    food_preferences TEXT[] NOT NULL DEFAULT '{}',
    allergies TEXT[] NOT NULL DEFAULT '{}',
    intolerances TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'dark',
    unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    voice_enabled BOOLEAN NOT NULL DEFAULT true,
    camera_tracking BOOLEAN NOT NULL DEFAULT true,
    sound_effects BOOLEAN NOT NULL DEFAULT true,
    notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Equipment
CREATE TABLE IF NOT EXISTS public.user_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    equipment TEXT NOT NULL CHECK (equipment IN ('NONE', 'DUMBBELLS', 'BARBELL', 'BENCH', 'RESISTANCE_BANDS', 'KETTLEBELL', 'PULLUP_BAR', 'CABLE_MACHINE', 'GYM_MACHINE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, equipment)
);

-- 5. Workout Plans
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT NOT NULL,
    environment TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    available_days TEXT[] NOT NULL DEFAULT '{}',
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Workout Days
CREATE TABLE IF NOT EXISTS public.workout_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL,
    day_order INTEGER NOT NULL DEFAULT 0,
    focus TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Workout Exercises
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_sets INTEGER NOT NULL DEFAULT 3,
    target_reps TEXT NOT NULL DEFAULT '10-12 reps',
    rest_seconds INTEGER NOT NULL DEFAULT 60,
    notes TEXT,
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Workout Sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_id UUID REFERENCES public.workout_days(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT false,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Workout Sets
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    rpe NUMERIC(3,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Nutrition Targets
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    target_calories INTEGER NOT NULL,
    maintenance_calories INTEGER NOT NULL,
    protein_grams INTEGER NOT NULL,
    carbs_grams INTEGER NOT NULL,
    fat_grams INTEGER NOT NULL,
    bmr INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Meals
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    total_calories INTEGER NOT NULL DEFAULT 0,
    total_protein INTEGER NOT NULL DEFAULT 0,
    total_carbs INTEGER NOT NULL DEFAULT 0,
    total_fat INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Meal Items
CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    protein INTEGER NOT NULL DEFAULT 0,
    carbs INTEGER NOT NULL DEFAULT 0,
    fat INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Hydration Entries
CREATE TABLE IF NOT EXISTS public.hydration_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Body Measurements
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
    chest_cm NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    hips_cm NUMERIC(5,2),
    arms_cm NUMERIC(5,2),
    thighs_cm NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Monthly Checkins
CREATE TABLE IF NOT EXISTS public.monthly_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2) NOT NULL,
    adherence_score NUMERIC(3,1),
    summary TEXT,
    next_month_focus TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Progress Photos
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_id UUID REFERENCES public.monthly_checkins(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    pose TEXT NOT NULL CHECK (pose IN ('FRONT', 'SIDE', 'BACK')),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. FRIDAY Conversations
CREATE TABLE IF NOT EXISTS public.friday_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. FRIDAY Messages
CREATE TABLE IF NOT EXISTS public.friday_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.friday_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'friday', 'system')),
    text TEXT NOT NULL,
    category TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. FRIDAY Memory
CREATE TABLE IF NOT EXISTS public.friday_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON public.user_equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON public.workout_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workout_days_plan ON public.workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day ON public.workout_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_hydration_user_date ON public.hydration_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.body_measurements(user_id, date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON public.monthly_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_friday_conversations_user ON public.friday_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_friday_messages_conversation ON public.friday_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_friday_memory_user_key ON public.friday_memory(user_id, key);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_user_all" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. User Preferences RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_preferences_user_all" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. User Equipment RLS
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_equipment_user_all" ON public.user_equipment
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Workout Plans RLS
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_plans_user_all" ON public.workout_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Workout Days RLS
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_days_user_all" ON public.workout_days
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Workout Exercises RLS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_user_all" ON public.workout_exercises
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Workout Sessions RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sessions_user_all" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Workout Sets RLS
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sets_user_all" ON public.workout_sets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Nutrition Targets RLS
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_targets_user_all" ON public.nutrition_targets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Meals RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals_user_all" ON public.meals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Meal Items RLS
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_items_user_all" ON public.meal_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. Hydration Entries RLS
ALTER TABLE public.hydration_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hydration_entries_user_all" ON public.hydration_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. Body Measurements RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "body_measurements_user_all" ON public.body_measurements
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. Monthly Checkins RLS
ALTER TABLE public.monthly_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_checkins_user_all" ON public.monthly_checkins
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. Progress Photos RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_photos_user_all" ON public.progress_photos
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. FRIDAY Conversations RLS
ALTER TABLE public.friday_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friday_conversations_user_all" ON public.friday_conversations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 17. FRIDAY Messages RLS
ALTER TABLE public.friday_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friday_messages_user_all" ON public.friday_messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 18. FRIDAY Memory RLS
ALTER TABLE public.friday_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friday_memory_user_all" ON public.friday_memory
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- SUPABASE STORAGE CONFIGURATION (PROGRESS PHOTOS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Users can only upload and read files inside their own userId directory: /progress-photos/{userId}/*
CREATE POLICY "progress_photos_storage_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "progress_photos_storage_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "progress_photos_storage_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
