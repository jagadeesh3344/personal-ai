import { WorkoutsRepository, WorkoutSessionEntity, WorkoutSetEntity } from '../repositories/workouts.repo.js';
import { ProfileRepository } from '../repositories/profile.repo.js';
import { evaluateExerciseProgression, deriveProgressionState, ADAPTIVE_PROGRESSION_LADDERS } from '../modules/workouts/adaptive/progressionEngine.js';
import { aggregateExerciseSessions } from '../modules/workouts/adaptive/performanceAnalyzer.js';
import { ExerciseHistoryItem, ExerciseProgressionState } from '../modules/workouts/adaptive/types.js';

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
  // Bodyweight Regressions & Core Movements
  { id: 'wall-push-up', name: 'Wall Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], difficulty: 'BEGINNER', instructions: 'Stand arms-length from wall. Bend elbows bringing chest close to wall, then press back.' },
  { id: 'incline-push-up', name: 'Incline Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], difficulty: 'BEGINNER', instructions: 'Hands on sturdy elevated surface. Lower chest and press.' },
  { id: 'knee-push-up', name: 'Knee Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], difficulty: 'BEGINNER', instructions: 'Hands and knees on floor. Lower chest with controlled elbows, then push up.' },
  { id: 'box-squat', name: 'Box Squat', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Sit hips back onto a chair or box, touch lightly, and drive through heels to stand.' },
  { id: 'knee-plank', name: 'Knee Plank', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CORE'], difficulty: 'BEGINNER', instructions: 'Support torso on forearms and knees. Brace core and maintain rigid alignment.' },

  // Standard Bodyweight
  { id: 'push-up', name: 'Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], difficulty: 'BEGINNER', instructions: 'Keep core tight, lower chest to floor, and push back up.' },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Sit hips back and down to parallel, keeping chest high.' },
  { id: 'walking-lunge', name: 'Walking Lunge', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['LEGS'], difficulty: 'BEGINNER', instructions: 'Step forward into a deep lunge, drive up through front heel.' },
  { id: 'plank', name: 'Plank', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['CORE'], difficulty: 'BEGINNER', instructions: 'Hold rigid forearm position. Squeeze glutes and abs tight.' },
  { id: 'doorframe-inverted-row', name: 'Doorframe Inverted Row', equipmentRequired: ['NONE'], environment: ['HOME', 'OUTDOOR'], muscleGroups: ['BACK', 'BICEPS'], difficulty: 'BEGINNER', instructions: 'Hold doorframe, lean back with arms extended, row chest in.' },
  { id: 'chair-dips', name: 'Bodyweight Chair Dips', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['TRICEPS', 'CHEST'], difficulty: 'BEGINNER', instructions: 'Hands on chair edge, lower hips bending elbows back, extend.' },
  
  // Advanced Bodyweight Variations
  { id: 'diamond-push-up', name: 'Diamond Push-up', equipmentRequired: ['NONE'], environment: ['HOME', 'GYM', 'OUTDOOR'], muscleGroups: ['TRICEPS', 'CHEST'], difficulty: 'ADVANCED', instructions: 'Hands together forming a diamond under chest. Lower chest and press.' },
  
  // Dumbbell
  { id: 'dumbbell-goblet-squat', name: 'Dumbbell Goblet Squat', equipmentRequired: ['DUMBBELLS'], environment: ['HOME', 'GYM'], muscleGroups: ['LEGS'], difficulty: 'INTERMEDIATE', instructions: 'Hold dumbbell vertically against chest. Squat deeply keeping elbows inside knees.' },
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
   * Deterministically filters exercises compatible with user's environment, equipment, and training experience.
   */
  static getCompatibleExercises(
    environment: string, 
    userEquipment: string[], 
    trainingExperience: string = 'BEGINNER'
  ): ExerciseDef[] {
    const equip = (userEquipment && userEquipment.length > 0) ? userEquipment : ['NONE'];
    const hasZeroEquip = equip.includes('NONE') && equip.length === 1;
    const exp = (trainingExperience || 'BEGINNER').toUpperCase();

    return BACKEND_EXERCISES.filter(ex => {
      // 1. Difficulty gating:
      // - BEGINNER: only BEGINNER exercises.
      // - INTERMEDIATE: BEGINNER + INTERMEDIATE exercises.
      // - ADVANCED: BEGINNER + INTERMEDIATE + ADVANCED exercises.
      if (exp === 'BEGINNER') {
        if (ex.difficulty !== 'BEGINNER') return false;
      } else if (exp === 'INTERMEDIATE') {
        if (ex.difficulty !== 'BEGINNER' && ex.difficulty !== 'INTERMEDIATE') return false;
      }

      // 2. Check environment
      if (!ex.environment.includes(environment)) return false;

      // 3. Pure bodyweight checks
      const isBodyweight = ex.equipmentRequired.length === 0 || 
        (ex.equipmentRequired.length === 1 && ex.equipmentRequired[0] === 'NONE');

      if (isBodyweight) return true;
      if (hasZeroEquip) return false;

      // 4. Must own all required pieces
      return ex.equipmentRequired.every(req => {
        if (req === 'NONE') return true;
        return equip.includes(req);
      });
    });
  }

  static async getExerciseHistory(userId: string, exerciseId?: string): Promise<ExerciseHistoryItem[]> {
    return WorkoutsRepository.getExerciseHistory(userId, exerciseId);
  }

  static async getProgressionStates(userId: string): Promise<ExerciseProgressionState[]> {
    const profile = await ProfileRepository.getProfile(userId);
    const exp = ((profile?.trainingExperience as any) || 'BEGINNER').toUpperCase();
    const context = {
      trainingExperience: exp,
      equipment: profile?.equipment || ['NONE'],
      trainingEnvironment: profile?.trainingEnvironment || 'HOME'
    };

    const history = await WorkoutsRepository.getExerciseHistory(userId);
    const sessions = aggregateExerciseSessions(history);

    const families = Object.keys(ADAPTIVE_PROGRESSION_LADDERS);
    return families.map(familyId => deriveProgressionState(familyId, context, sessions));
  }

  static async getExerciseHistoryWithProgression(userId: string, exerciseId?: string) {
    const history = await WorkoutsRepository.getExerciseHistory(userId, exerciseId);
    const sessions = aggregateExerciseSessions(history);
    const profile = await ProfileRepository.getProfile(userId);
    const exp = ((profile?.trainingExperience as any) || 'BEGINNER').toUpperCase();
    const context = {
      trainingExperience: exp,
      equipment: profile?.equipment || ['NONE'],
      trainingEnvironment: profile?.trainingEnvironment || 'HOME'
    };

    let progressionRecommendation = null;
    if (exerciseId) {
      const exerciseSessions = sessions.filter(s => s.exerciseId === exerciseId);
      const exDef = BACKEND_EXERCISES.find(e => e.id === exerciseId);
      const exName = exDef?.name || exerciseId;
      progressionRecommendation = evaluateExerciseProgression(
        exerciseId,
        exName,
        context,
        exerciseSessions
      );
    }

    const progressionStates = await this.getProgressionStates(userId);

    return {
      userId,
      exerciseId: exerciseId || null,
      historyCount: history.length,
      recentSessions: sessions.slice(-5),
      history,
      progressionRecommendation,
      progressionStates
    };
  }

  static async getTodayWorkout(userId: string) {
    const profile = await ProfileRepository.getProfile(userId);
    const env = profile?.trainingEnvironment || 'HOME';
    const equip = profile?.equipment || ['NONE'];
    const exp = ((profile?.trainingExperience as any) || 'BEGINNER').toUpperCase();
    const compatible = this.getCompatibleExercises(env, equip, exp);

    const historyItems = await WorkoutsRepository.getExerciseHistory(userId);
    const sessionPerformances = aggregateExerciseSessions(historyItems);

    const userContext = {
      trainingExperience: exp,
      equipment: equip,
      trainingEnvironment: env
    };

    const baseExercises = compatible.slice(0, 5);
    const adaptedExercises = baseExercises.map((ex, idx) => {
      const exHistory = sessionPerformances.filter(sp => sp.exerciseId === ex.id);
      const recommendation = evaluateExerciseProgression(
        ex.id,
        ex.name,
        userContext,
        exHistory,
        { targetSets: 3, targetReps: '10-12 reps' }
      );

      // Find full definition if exercise was progressed or regressed to a different exercise
      let finalEx = BACKEND_EXERCISES.find(e => e.id === recommendation.recommendedExerciseId) || ex;
      if (exp === 'BEGINNER' && finalEx.difficulty !== 'BEGINNER') {
        finalEx = ex;
      } else if (exp === 'INTERMEDIATE' && finalEx.difficulty === 'ADVANCED') {
        finalEx = ex;
      }

      return {
        order: idx + 1,
        exerciseId: finalEx.id,
        name: finalEx.name,
        targetSets: recommendation.targetSets,
        targetReps: recommendation.targetReps,
        restSeconds: 60,
        equipmentRequired: finalEx.equipmentRequired,
        muscleGroups: finalEx.muscleGroups,
        instructions: finalEx.instructions,
        progression: {
          action: recommendation.action,
          status: recommendation.status,
          currentLevel: recommendation.currentLevel,
          consecutiveSuccessfulSessions: recommendation.consecutiveSuccessfulSessions,
          consecutiveFailedSessions: recommendation.consecutiveFailedSessions,
          reason: recommendation.reason
        }
      };
    });

    return {
      userId,
      environment: env,
      equipment: equip,
      experience: exp,
      date: new Date().toISOString().split('T')[0],
      dayName: 'Today Adaptive Workout Protocol',
      exercises: adaptedExercises
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
      durationSeconds?: number;
      resistanceLevel?: string;
      completed?: boolean; 
      rpe?: number;
      completionMethod?: 'CAMERA' | 'VOICE' | 'MANUAL';
      verification?: 'VERIFIED' | 'SELF_REPORTED';
    }
  ): Promise<WorkoutSetEntity> {
    // Validate exercise equipment against profile
    const profile = await ProfileRepository.getProfile(userId);
    const equip = profile?.equipment || ['NONE'];

    const exercise = BACKEND_EXERCISES.find(e => e.id === setData.exerciseId);
    if (exercise) {
      const hasZeroEquip = equip.includes('NONE') && equip.length === 1;
      const isBodyweight = exercise.equipmentRequired.length === 0 || 
        (exercise.equipmentRequired.length === 1 && exercise.equipmentRequired[0] === 'NONE');

      const equipAllowed = isBodyweight ? true : (!hasZeroEquip && exercise.equipmentRequired.every(req => req === 'NONE' || equip.includes(req)));
      if (!equipAllowed) {
        throw new Error(`Exercise "${exercise.name}" requires equipment [${exercise.equipmentRequired.join(', ')}] which is incompatible with user equipment [${equip.join(', ')}]`);
      }
    }

    // Server-side verification invariant: NEVER trust client verification
    const completionMethod = setData.completionMethod || 'MANUAL';
    const verification: 'VERIFIED' | 'SELF_REPORTED' = completionMethod === 'CAMERA' ? 'VERIFIED' : 'SELF_REPORTED';

    const safeSetData = {
      ...setData,
      completionMethod,
      verification
    };

    return WorkoutsRepository.addSet(userId, sessionId, safeSetData);
  }

  static async completeSession(userId: string, sessionId: string, durationSeconds: number, notes?: string): Promise<WorkoutSessionEntity> {
    return WorkoutsRepository.completeSession(userId, sessionId, durationSeconds, notes);
  }
}
