import { getAvailableExercises } from '../features/workouts/utils/equipmentFilter';
import { Equipment } from '../types/profile';

export { getAvailableExercises };

export function normalizeUserEquipment(equipmentList: string[]): Equipment[] {
  if (!equipmentList || equipmentList.length === 0) return ['NONE'];
  const valid = new Set<string>();
  for (const item of equipmentList) {
    const clean = item.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (clean === 'DUMBBELL' || clean === 'DUMBBELLS') valid.add('DUMBBELLS');
    else if (clean === 'BARBELL' || clean === 'BARBELLS') valid.add('BARBELL');
    else if (clean === 'BENCH') valid.add('BENCH');
    else if (clean === 'RESISTANCE_BANDS' || clean === 'BANDS') valid.add('RESISTANCE_BANDS');
    else if (clean === 'KETTLEBELL') valid.add('KETTLEBELL');
    else if (clean === 'PULLUP_BAR' || clean === 'PULL_UP_BAR') valid.add('PULLUP_BAR');
    else if (clean === 'CABLE_MACHINE' || clean === 'CABLES') valid.add('CABLE_MACHINE');
    else if (clean === 'GYM_MACHINE' || clean === 'MACHINES') valid.add('GYM_MACHINE');
  }
  return valid.size > 0 ? (Array.from(valid) as Equipment[]) : ['NONE'];
}
