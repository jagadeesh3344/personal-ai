import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { 
  UserProfile, 
  Goal, 
  Sex, 
  ActivityLevel, 
  TrainingExperience, 
  TrainingEnvironment, 
  DietPreference 
} from '../types';
import { User, Dumbbell, Bot, ArrowLeft, ShieldCheck, Check, Trash2 } from 'lucide-react';

interface SettingsProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setTab: (tab: string) => void;
  onResetOnboarding: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  userProfile,
  setUserProfile,
  setTab,
  onResetOnboarding
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSaveNotification = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">System Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your single source of truth biometrics, training parameters, and profile.
          </p>
        </div>

        <Button 
          variant={isSaved ? "outline" : "primary"} 
          onClick={handleSaveNotification} 
          className={`w-full sm:w-auto transition-all ${isSaved ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : ''}`}
        >
          {isSaved ? (
            <span className="flex items-center justify-center gap-2 uppercase tracking-wider text-xs">
              <Check className="w-4 h-4" /> Profile Saved
            </span>
          ) : (
            <span className="flex items-center gap-2 uppercase tracking-wider text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Save Changes
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Demographics & Biometrics */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <User className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">User Identity & Biometrics</h3>
          </div>

          <div className="space-y-4">
            <Input 
              id="name"
              label="OPERATOR CODE / NAME"
              value={userProfile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Jagadeesh"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                id="age"
                label="AGE"
                type="number"
                value={userProfile.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value, 10) || 0)}
              />
              <Select
                id="sex"
                label="SEX"
                value={userProfile.sex}
                onChange={(e) => handleChange('sex', e.target.value as Sex)}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other / Neutral' }
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input 
                id="height"
                label="HEIGHT (CM)"
                type="number"
                value={userProfile.heightCm}
                onChange={(e) => handleChange('heightCm', parseFloat(e.target.value) || 0)}
              />
              <Input 
                id="weight"
                label="CURRENT (KG)"
                type="number"
                step="0.1"
                value={userProfile.currentWeightKg}
                onChange={(e) => handleChange('currentWeightKg', parseFloat(e.target.value) || 0)}
              />
              <Input 
                id="targetWeight"
                label="TARGET (KG)"
                type="number"
                step="0.1"
                value={userProfile.targetWeightKg}
                onChange={(e) => handleChange('targetWeightKg', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Training Environment & Experience */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Training Configuration</h3>
          </div>

          <div className="space-y-4">
            <Select 
              id="goal"
              label="PRIMARY FITNESS OBJECTIVE"
              value={userProfile.goal}
              onChange={(e) => handleChange('goal', e.target.value as Goal)}
              options={[
                { value: 'FAT_LOSS', label: 'Fat Loss (Caloric Deficit)' },
                { value: 'GAIN_MUSCLE', label: 'Muscle Gain (Hypertrophy Surplus)' },
                { value: 'BODY_RECOMPOSITION', label: 'Body Recomposition' },
                { value: 'STRENGTH', label: 'Strength Focus' },
                { value: 'GENERAL_FITNESS', label: 'General Health & Fitness' },
                { value: 'ENDURANCE', label: 'Cardiovascular & Endurance' }
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select 
                id="environment"
                label="TRAINING ENVIRONMENT"
                value={userProfile.trainingEnvironment}
                onChange={(e) => handleChange('trainingEnvironment', e.target.value as TrainingEnvironment)}
                options={[
                  { value: 'HOME', label: 'Home Environment' },
                  { value: 'GYM', label: 'Commercial Gym' },
                  { value: 'OUTDOOR', label: 'Outdoor' }
                ]}
              />

              <Select 
                id="experience"
                label="TRAINING EXPERIENCE"
                value={userProfile.trainingExperience}
                onChange={(e) => handleChange('trainingExperience', e.target.value as TrainingExperience)}
                options={[
                  { value: 'BEGINNER', label: 'Beginner (0-1 yrs)' },
                  { value: 'INTERMEDIATE', label: 'Intermediate (1-3 yrs)' },
                  { value: 'ADVANCED', label: 'Advanced (3+ yrs)' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select 
                id="diet"
                label="DIET PREFERENCE"
                value={userProfile.dietPreference}
                onChange={(e) => handleChange('dietPreference', e.target.value as DietPreference)}
                options={[
                  { value: 'STANDARD', label: 'Standard' },
                  { value: 'VEGETARIAN', label: 'Vegetarian' },
                  { value: 'VEGAN', label: 'Vegan' },
                  { value: 'KETO', label: 'Keto' },
                  { value: 'PALEO', label: 'Paleo' }
                ]}
              />

              <Input 
                id="duration"
                label="SESSION DURATION (MIN)"
                type="number"
                value={userProfile.preferredWorkoutDuration}
                onChange={(e) => handleChange('preferredWorkoutDuration', parseInt(e.target.value, 10) || 45)}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Reset & Factory Clear */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 md:col-span-2 border-red-950/20" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-4">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Reset Application Profile</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Resetting restarts the 10-step onboarding sequence, clears locally stored workout logs, and regenerates your training baseline.
            </p>
            <Button 
              variant="outline" 
              onClick={onResetOnboarding}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 uppercase text-xs shrink-0 font-bold"
            >
              Reset Onboarding Flow
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
