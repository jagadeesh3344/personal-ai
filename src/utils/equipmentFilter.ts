import { ExerciseDefinition, UserProfile, EquipmentType, TrainingEnvironment } from '../types';

/**
 * Normalizes user equipment strings into standard EquipmentType uppercase tokens.
 */
export function normalizeUserEquipment(equipmentList: string[]): EquipmentType[] {
  if (!equipmentList || equipmentList.length === 0) return [];
  
  const normalized: EquipmentType[] = [];
  const set = new Set<string>();

  for (const item of equipmentList) {
    const clean = item.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (clean === 'NO_EQUIPMENT' || clean === 'NONE' || clean === 'BODYWEIGHT') {
      continue;
    }
    if (clean === 'DUMBBELL' || clean === 'DUMBBELLS' || clean === 'ADJUSTABLE_DUMBBELLS') {
      set.add('DUMBBELL');
    } else if (clean === 'BARBELL' || clean === 'BARBELLS') {
      set.add('BARBELL');
    } else if (clean === 'BENCH' || clean === 'WEIGHT_BENCH') {
      set.add('BENCH');
    } else if (clean === 'CABLE' || clean === 'CABLE_MACHINE' || clean === 'CABLES') {
      set.add('CABLE_MACHINE');
    } else if (clean === 'PULL_UP_BAR' || clean === 'PULLUP_BAR' || clean === 'CHIN_UP_BAR') {
      set.add('PULL_UP_BAR');
    } else if (clean === 'RESISTANCE_BANDS' || clean === 'BANDS' || clean === 'RESISTANCE_BAND') {
      set.add('RESISTANCE_BANDS');
    } else if (clean === 'KETTLEBELL' || clean === 'KETTLEBELLS') {
      set.add('KETTLEBELL');
    } else if (clean === 'GYM_MACHINE' || clean === 'MACHINES' || clean === 'LEG_PRESS' || clean === 'LEG_EXTENSION') {
      set.add('GYM_MACHINE');
    } else if (clean === 'SQUAT_RACK' || clean === 'POWER_RACK' || clean === 'SQUAT_STAND') {
      set.add('SQUAT_RACK');
    }
  }

  return Array.from(set) as EquipmentType[];
}

/**
 * Deterministically filters exercises strictly by user environment and equipment ownership.
 *
 * Rules:
 * 1. The exercise must support the user's training environment (HOME, GYM, OUTDOOR).
 * 2. If an exercise requires equipment (equipmentRequired.length > 0):
 *    - Every single item in equipmentRequired MUST be held in user's available equipment.
 *    - If user equipment is empty ([]), NO equipment-requiring exercise can ever pass.
 * 3. Bodyweight exercises (equipmentRequired is empty) are ALWAYS allowed in compatible environments.
 */
export function getAvailableExercises(
  profile: Pick<UserProfile, 'trainingEnvironment' | 'equipment'>,
  exercises: ExerciseDefinition[]
): ExerciseDefinition[] {
  const env: TrainingEnvironment = profile.trainingEnvironment || 'HOME';
  const availableEquipment = normalizeUserEquipment(profile.equipment || []);

  return exercises.filter(exercise => {
    // 1. Environment compatibility
    if (!exercise.environments.includes(env)) {
      return false;
    }

    // 2. Equipment check
    if (exercise.equipmentRequired.length > 0) {
      // User has no equipment at all
      if (availableEquipment.length === 0) {
        return false;
      }

      // Every required piece of equipment must be available to the user
      const hasAllRequired = exercise.equipmentRequired.every(req => availableEquipment.includes(req));
      if (!hasAllRequired) {
        return false;
      }
    }

    return true;
  });
}
