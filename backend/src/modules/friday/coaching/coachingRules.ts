import { CoachingIntent, CoachingPriority } from './types.js';
import { UserProfileEntity } from '../../../repositories/profile.repo.js';
import { ADAPTIVE_PROGRESSION_LADDERS } from '../../workouts/adaptive/progressionEngine.js';

/**
 * Deterministically classifies natural language user input into structured fitness intents.
 */
export function classifyIntent(messageText: string): CoachingIntent {
  const text = (messageText || '').toLowerCase().trim();

  // 1. Profile & Preference Updates
  if (
    text.includes("i don't like") || 
    text.includes("i dislike") || 
    text.includes("i hate") ||
    text.includes("don't give me") ||
    text.includes("exclude")
  ) {
    return 'PREFERENCE_UPDATE';
  }

  if (
    text.includes("i bought") ||
    text.includes("i only have") ||
    text.includes("i have dumbbells") ||
    text.includes("my equipment is") ||
    text.includes("i want to train") ||
    text.includes("change my goal") ||
    text.includes("prefer vegetarian") ||
    text.includes("prefer vegan")
  ) {
    return 'PROFILE_UPDATE';
  }

  // 2. Active Workout & Sets
  if (
    text.includes("start workout") || 
    text.includes("start my workout") || 
    text.includes("begin workout") ||
    text.includes("let's train")
  ) {
    return 'START_WORKOUT';
  }

  if (
    text.includes("finish workout") || 
    text.includes("complete workout") || 
    text.includes("done with workout") ||
    text.includes("end workout")
  ) {
    return 'COMPLETE_WORKOUT';
  }

  if (
    text.includes("logged") || 
    text.includes("did a set") || 
    text.includes("completed set") ||
    text.includes("reps") ||
    /i did \d+/i.test(text) ||
    /set \d+/i.test(text)
  ) {
    return 'LOG_SET';
  }

  if (
    text.includes("workout today") || 
    text.includes("today's workout") || 
    text.includes("what is my workout") ||
    text.includes("what's on deck") ||
    text.includes("what exercises")
  ) {
    return 'WORKOUT_TODAY';
  }

  if (
    text.includes("am i ready to increase") ||
    text.includes("increase difficulty") ||
    text.includes("progression") ||
    text.includes("why am i doing") ||
    text.includes("push-up progression") ||
    text.includes("next variation")
  ) {
    return 'WORKOUT_PROGRESS';
  }

  if (
    text.includes("form") ||
    text.includes("technique") ||
    text.includes("how do i do") ||
    text.includes("elbow flare") ||
    text.includes("depth")
  ) {
    return 'EXERCISE_FORM';
  }

  // 3. Hydration
  if (
    text.includes("drank") || 
    text.includes("drink water") || 
    text.includes("logged water") ||
    /i drank \d+/i.test(text) ||
    /\d+\s*ml/i.test(text)
  ) {
    return 'LOG_HYDRATION';
  }

  if (
    text.includes("water") || 
    text.includes("hydration") || 
    text.includes("fluid")
  ) {
    return 'HYDRATION_STATUS';
  }

  // 4. Nutrition
  if (
    /\bate\b/i.test(text) || 
    text.includes("had for breakfast") || 
    text.includes("had for lunch") || 
    text.includes("had for dinner") ||
    text.includes("logged meal") ||
    text.includes("i had two eggs")
  ) {
    return 'LOG_MEAL';
  }

  if (
    text.includes("what should i eat") || 
    text.includes("meal recommendation") || 
    text.includes("recommend a meal") ||
    text.includes("recipe") ||
    text.includes("what's for dinner") ||
    text.includes("what's for lunch")
  ) {
    return 'MEAL_RECOMMENDATION';
  }

  if (
    text.includes("calories") || 
    text.includes("protein") || 
    text.includes("macros") || 
    text.includes("nutrition") ||
    text.includes("what did i eat")
  ) {
    return 'NUTRITION_STATUS';
  }

  // 5. Progress
  if (
    text.includes("weight changed") ||
    text.includes("weight trend") ||
    text.includes("scale")
  ) {
    return 'WEIGHT_PROGRESS';
  }

  if (
    text.includes("stronger") ||
    text.includes("strength")
  ) {
    return 'STRENGTH_PROGRESS';
  }

  if (
    text.includes("progress") || 
    text.includes("how am i doing") || 
    text.includes("results") ||
    text.includes("what changed this month")
  ) {
    return 'PROGRESS_STATUS';
  }

  // 6. Motivation & General Coaching
  if (
    text.includes("tired") ||
    text.includes("sore") ||
    text.includes("exhausted") ||
    text.includes("unmotivated") ||
    text.includes("can't do it")
  ) {
    return 'MOTIVATION';
  }

  if (
    text.includes("hey friday") ||
    text.includes("hello") ||
    text.includes("what should i do") ||
    text.includes("coaching")
  ) {
    return 'GENERAL_COACHING';
  }

  return 'UNKNOWN';
}

/**
 * Deterministically prioritizes the athlete's primary focus area for the current moment.
 */
export function evaluateCoachingPriority(
  profile: UserProfileEntity | null | undefined,
  activeSessionExists: boolean,
  workoutScheduledAndIncomplete: boolean,
  nutritionAdherence: { remainingCalories: number; targetCalories: number; daysTracked?: number } | null | undefined,
  hydrationSummary: { consumedMl: number; targetMl: number } | null | undefined
): { priority: CoachingPriority; rationale: string } {
  // 1. Profile Setup / Onboarding Check
  if (!profile || !profile.goal || !profile.trainingExperience || !profile.equipment) {
    return {
      priority: 'PROFILE_SETUP',
      rationale: 'Profile biometrics, fitness goal, or equipment inventory need initialization.'
    };
  }

  // 2. Active Live Workout
  if (activeSessionExists) {
    return {
      priority: 'WORKOUT',
      rationale: 'Active live workout session is in progress. Focus on set execution, rest timing, and form.'
    };
  }

  // 3. Scheduled Workout Incomplete
  if (workoutScheduledAndIncomplete) {
    return {
      priority: 'WORKOUT',
      rationale: "Today's scheduled workout has not been completed. Consistent training is the top priority."
    };
  }

  // 4. Significant Calorie / Nutrition Deficit
  if (nutritionAdherence && nutritionAdherence.targetCalories > 0) {
    const remainingRatio = nutritionAdherence.remainingCalories / nutritionAdherence.targetCalories;
    if (remainingRatio > 0.45) {
      return {
        priority: 'NUTRITION',
        rationale: `Substantial caloric and macronutrient budget remains (${nutritionAdherence.remainingCalories} kcal). Prioritize balanced fueling.`
      };
    }
  }

  // 5. Hydration Attention Needed
  if (hydrationSummary && hydrationSummary.targetMl > 0) {
    const hydRatio = hydrationSummary.consumedMl / hydrationSummary.targetMl;
    if (hydRatio < 0.6) {
      return {
        priority: 'HYDRATION',
        rationale: `Hydration is below 60% of daily target (${hydrationSummary.consumedMl} / ${hydrationSummary.targetMl} ml). Focus on fluid intake.`
      };
    }
  }

  // 6. Default: Progress & Consistency Tracking
  return {
    priority: 'PROGRESS_TRACKING',
    rationale: 'Core training and daily targets are on track. Review trends and milestones.'
  };
}

/**
 * Strict Equipment Safety Constraint:
 * If user profile has 'NONE', FRIDAY must never prescribe equipment exercises.
 */
export function isExerciseEquipmentAllowed(
  userEquipment: string[] | undefined | null,
  requiredEquipment: string[]
): boolean {
  const equip = userEquipment && userEquipment.length > 0 ? userEquipment : ['NONE'];
  const hasZeroEquip = equip.includes('NONE') && equip.length === 1;

  if (requiredEquipment.length === 0 || (requiredEquipment.length === 1 && requiredEquipment[0] === 'NONE')) {
    return true; // Bodyweight is always safe
  }

  if (hasZeroEquip) {
    return false;
  }

  return requiredEquipment.every(req => req === 'NONE' || equip.includes(req));
}

/**
 * Strict Beginner Gating:
 * Beginner athletes must NEVER be given INTERMEDIATE or ADVANCED exercises.
 */
export function isExerciseLevelAllowed(
  trainingExperience: string | undefined | null,
  exerciseLevel: string
): boolean {
  const exp = (trainingExperience || 'BEGINNER').toUpperCase();
  const lvl = (exerciseLevel || 'BEGINNER').toUpperCase();

  if (exp === 'BEGINNER') {
    return lvl === 'BEGINNER';
  }

  if (exp === 'INTERMEDIATE') {
    return lvl === 'BEGINNER' || lvl === 'INTERMEDIATE';
  }

  return true; // ADVANCED can do all
}
