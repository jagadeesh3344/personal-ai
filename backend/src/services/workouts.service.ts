import { WorkoutsRepository, WorkoutSessionEntity, WorkoutSetEntity } from '../repositories/workouts.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';

export interface ExerciseDef {
  id: string;
  name: string;
  equipmentRequired: string[];
  environment: string[];
  muscleGroups: string[];
  difficulty: string;
  instructions: string;
}

export const BACKEND_EXERCISES: ExerciseDef[] = [
  { id: 'push-up', name: 'Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], difficulty: 'BEGINNER', instructions: 'Keep core tight, lower chest to floor, and push back up.' },
  { id: 'diamond-push-up', name: 'Diamond Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['TRICEPS', 'CHEST'], difficulty: 'INTERMEDIATE', instructions: 'Hands together forming a diamond. Lower chest and press.' },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Sit hips back and down to parallel, keeping chest high.' },
  { id: 'walking-lunge', name: 'Walking Lunge', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Step forward into a deep lunge, drive up through front heel.' },
  { id: 'plank', name: 'Plank', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CORE'], difficulty: 'BEGINNER', instructions: 'Hold rigid forearm position. Squeeze glutes and abs tight.' },
  { id: 'doorframe-inverted-row', name: 'Doorframe Inverted Row', equipmentRequired: ['NONE'], environment: ['HOME', 'OUTDOOR'], muscleGroups: ['BACK', 'BICEPS'], difficulty: 'BEGINNER', instructions: 'Hold doorframe, lean back with arms extended, row chest in.' },
  { id: 'chair-dips', name: 'Bodyweight Chair Dips', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['TRICEPS', 'CHEST'], difficulty: 'BEGINNER', instructions: 'Hands on chair edge, lower hips bending elbows back, extend.' },
  
  // Dumbbell
  { id: 'dumbbell-row', name: 'Dumbbell Row', equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'], muscleGroups: ['BACK', 'BICEPS'], difficulty: 'BEGINNER', instructions: 'Hinge forward. Pull dumbbell back toward hip.' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'], muscleGroups: ['BICEPS'], difficulty: 'BEGINNER', instructions: 'Curl dumbbells up, squeezing biceps at top.' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'], muscleGroups: ['SHOULDERS', 'TRICEPS'], difficulty: 'BEGINNER', instructions: 'Press dumbbells overhead without arching lower back.' },
  
  // Barbell + Bench
  { id: 'bench-press', name: 'Bench Press', equipmentRequired: ['BARBELL', 'BENCH'], environment: ['GYM'], muscleGroups: ['CHEST', 'TRICEPS'], difficulty: 'INTERMEDIATE', instructions: 'Lower barbell to sternum and press forcefully.' },
  { id: 'barbell-squat', name: 'Barbell Squat', equipmentRequired: ['BARBELL'], environment: ['GYM'], muscleGroups: ['LEGS'], difficulty: 'INTERMEDIATE', instructions: 'Squat to parallel and drive up.' },
  
  // Cables & Machines
  { id: 'cable-row', name: 'Cable Row', equipmentRequired: ['CABLE_MACHINE'], environment: ['GYM'], muscleGroups: ['BACK', 'BICEPS'], difficulty: 'BEGINNER', instructions: 'Row handle into abdomen squeezing shoulder blades.' },
  { id: 'leg-press', name: 'Leg Press', equipmentRequired: ['GYM_MACHINE'], environment: ['GYM'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Lower sled to 90 degrees and press smoothly.' }
];

export class WorkoutsService {
  /**
   * Deterministically filters exercises compatible with user's environment and equipment.
   */
  static getCompatibleExercises(environment: string, userEquipment: string[]): ExerciseDef[] {
    const equip = (userEquipment && userEquipment.length > 0) ? userEquipment : ['NONE'];
    const hasZeroEquip = equip.includes('NONE') && equip.length === 1;

    return BACKEND_EXERCISES.filter(ex => {
      // Check environment
      if (!ex.environment.includes(environment)) return false;

      // Pure bodyweight
      const isBodyweight = ex.equipmentRequired.length === 0 || 
        (ex.equipmentRequired.length === 1 && ex.equipmentRequired[0] === 'NONE');

      if (isBodyweight) return true;
      if (hasZeroEquip) return false;

      // Must own all required pieces
      return ex.equipmentRequired.every(req => {
        if (req === 'NONE') return true;
        return equip.includes(req);
      });
    });
  }

  static async getTodayWorkout(userId: string) {
    const profile = await ProfileRepository.getProfile(userId);
    const env = profile?.trainingEnvironment || 'HOME';
    const equip = profile?.equipment || ['NONE'];
    const compatible = this.getCompatibleExercises(env, equip);

    return {
      userId,
      environment: env,
      equipment: equip,
      date: new Date().toISOString().split('T')[0],
      dayName: 'Today Workout Protocol',
      exercises: compatible.slice(0, 5).map((ex, idx) => ({
        order: idx + 1,
        exerciseId: ex.id,
        name: ex.name,
        targetSets: 3,
        targetReps: '10-12 reps',
        restSeconds: 60,
        equipmentRequired: ex.equipmentRequired,
        muscleGroups: ex.muscleGroups,
        instructions: ex.instructions
      }))
    };
  }

  static async getSessions(userId: string): Promise<WorkoutSessionEntity[]> {
    return WorkoutsRepository.getSessions(userId);
  }

  static async createSession(userId: string, data: { dayId?: string | null; date?: string; notes?: string }): Promise<WorkoutSessionEntity> {
    return WorkoutsRepository.createSession(userId, data);
  }

  static async addSet(
    userId: string, 
    sessionId: string, 
    setData: { 
      exerciseId: string; 
      setNumber: number; 
      weightKg: number; 
      reps: number; 
      completed?: boolean; 
      rpe?: number;
      completionMethod?: 'CAMERA' | 'VOICE' | 'MANUAL';
      verification?: 'VERIFIED' | 'SELF_REPORTED';
    }
  ): Promise<WorkoutSetEntity> {
    // Validate exercise equipment against profile
    const profile = await ProfileRepository.getProfile(userId);
    const equip = profile?.equipment || ['NONE'];
    const env = profile?.trainingEnvironment || 'HOME';

    const exercise = BACKEND_EXERCISES.find(e => e.id === setData.exerciseId);
    if (exercise) {
      const compatible = this.getCompatibleExercises(env, equip);
      const isAllowed = compatible.some(c => c.id === exercise.id);
      if (!isAllowed) {
        throw new Error(`Exercise "${exercise.name}" requires equipment [${exercise.equipmentRequired.join(', ')}] which is incompatible with user equipment [${equip.join(', ')}]`);
      }
    }

    return WorkoutsRepository.addSet(userId, sessionId, setData);
  }

  static async completeSession(userId: string, sessionId: string, durationSeconds: number, notes?: string): Promise<WorkoutSessionEntity> {
    return WorkoutsRepository.completeSession(userId, sessionId, durationSeconds, notes);
  }
}
