import { Equipment, UserProfile } from '../../../types/profile';
import { Exercise } from '../data/exercises';

/**
 * Deterministically filters exercises based on user's training environment and equipment.
 * 
 * Rules:
 * 1. The exercise must support the user's training environment (HOME, GYM, OUTDOOR).
 * 2. If user's equipment is ["NONE"] or empty:
 *    - ONLY exercises with equipmentRequired: ["NONE"] (or empty) are allowed.
 *    - Exercises requiring DUMBBELLS, BARBELL, BENCH, CABLE_MACHINE, GYM_MACHINE, etc. MUST NOT be returned.
 * 3. If user has equipment:
 *    - All items in exercise.equipmentRequired (except "NONE") must be present in user's equipment.
 */
export function getAvailableExercises(
  profile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'>,
  exercises: Exercise[]
): Exercise[] {
  const env = profile.trainingEnvironment || 'HOME';
  const userEquip = (profile.equipment && profile.equipment.length > 0)
    ? profile.equipment
    : ['NONE'];

  const hasNoEquipment = userEquip.includes('NONE') && userEquip.length === 1;

  return exercises.filter(exercise => {
    // 1. Environment check
    if (!exercise.environment.includes(env)) {
      return false;
    }

    // 2. Pure bodyweight exercise
    const isBodyweight = 
      exercise.equipmentRequired.length === 0 || 
      (exercise.equipmentRequired.length === 1 && exercise.equipmentRequired[0] === 'NONE');

    if (isBodyweight) {
      return true;
    }

    // If user has zero equipment, no equipment-requiring exercise can ever pass
    if (hasNoEquipment) {
      return false;
    }

    // 3. User has equipment: verify every required piece is available
    const satisfiesRequirements = exercise.equipmentRequired.every(req => {
      if (req === 'NONE') return true;
      return userEquip.includes(req);
    });

    return satisfiesRequirements;
  });
}
