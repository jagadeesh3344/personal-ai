import { ExerciseAnalyzer } from './ExerciseAnalyzer';
import { PushUpAnalyzer } from './PushUpAnalyzer';
import { SquatAnalyzer } from './SquatAnalyzer';
import { BicepCurlAnalyzer } from './BicepCurlAnalyzer';
import { UserProfile, Equipment } from '../../../types/profile';

export interface AnalyzerResolutionResult {
  analyzer: ExerciseAnalyzer | null;
  allowed: boolean;
  reason?: string;
}

/**
 * Resolves appropriate ExerciseAnalyzer while strictly enforcing equipment safety constraints.
 */
export function resolveExerciseAnalyzer(
  exerciseId: string,
  exerciseName: string,
  userProfile?: Pick<UserProfile, 'trainingEnvironment' | 'equipment'> | null
): AnalyzerResolutionResult {
  const normId = exerciseId.toLowerCase();
  const normName = exerciseName.toLowerCase();
  const userEquipment: Equipment[] = userProfile?.equipment && userProfile.equipment.length > 0 
    ? userProfile.equipment 
    : ['NONE'];

  // 1. PUSH-UP FAMILY (Bodyweight, Zero Equipment required)
  if (normId.includes('push-up') || normName.includes('push-up') || normId.includes('pushup')) {
    return {
      analyzer: new PushUpAnalyzer(exerciseId, exerciseName),
      allowed: true
    };
  }

  // 2. SQUAT FAMILY (Bodyweight / Goblet)
  if (normId.includes('squat') || normName.includes('squat')) {
    // If exercise specifies dumbbells (e.g. dumbbell goblet squat), verify user has dumbbells
    if (normName.includes('dumbbell') || normId.includes('dumbbell')) {
      if (!userEquipment.includes('DUMBBELLS')) {
        return {
          analyzer: null,
          allowed: false,
          reason: 'This exercise requires Dumbbells. Your current profile does not have Dumbbells equipped.'
        };
      }
    }
    return {
      analyzer: new SquatAnalyzer(exerciseId, exerciseName),
      allowed: true
    };
  }

  // 3. BICEP CURL FAMILY (Requires DUMBBELLS or BARBELL)
  if (normId.includes('curl') || normName.includes('curl')) {
    const hasDumbbells = userEquipment.includes('DUMBBELLS');
    const hasBarbell = userEquipment.includes('BARBELL');

    if (!hasDumbbells && !hasBarbell) {
      return {
        analyzer: null,
        allowed: false,
        reason: 'Bicep curls require Dumbbells or a Barbell. Your current profile has zero equipment.'
      };
    }

    return {
      analyzer: new BicepCurlAnalyzer(exerciseId, exerciseName),
      allowed: true
    };
  }

  // Fallback: Currently supported Phase 5 exercises are Push-up, Squat, and Curl
  return {
    analyzer: null,
    allowed: false,
    reason: `Optical tracking for "${exerciseName}" is scheduled for an upcoming phase. Supported exercises: Push-ups, Squats, Bicep Curls.`
  };
}
