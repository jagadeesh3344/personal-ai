import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { UserProfile } from '../types';
import { User, Dumbbell, Bot, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

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

  const handleChange = (field: keyof UserProfile | string, value: any) => {
    setUserProfile(prev => {
      const updated = {
        ...prev,
        [field]: value
      } as UserProfile;

      // Ensure dynamic alignment across both legacy and modular properties
      if (field === 'fitnessGoal') {
        updated.goal = value;
      } else if (field === 'goal') {
        updated.fitnessGoal = value;
      }

      if (field === 'targetWeight') {
        updated.preferences = {
          ...prev.preferences,
          targetWeight: parseFloat(value) || 0
        };
      }

      if (field === 'workoutDaysPerWeek') {
        updated.preferences = {
          ...prev.preferences,
          workoutDaysPerWeek: parseInt(value) || 0
        };
      }

      if (field === 'preferredWorkoutTime') {
        updated.preferences = {
          ...prev.preferences,
          preferredWorkoutTime: value
        };
      }

      if (field === 'coachingStyle') {
        updated.preferences = {
          ...prev.preferences,
          coachingStyle: value
        };
      }

      return updated;
    });
  };

  const handleSaveNotification = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={() => setTab('dashboard')} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Update your profile details, fitness goals, and training preferences.
          </p>
        </div>

        <Button 
          variant={isSaved ? "outline" : "primary"} 
          onClick={handleSaveNotification} 
          className={`w-full sm:w-auto transition-all duration-300 ${isSaved ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : ''}`}
        >
          {isSaved ? (
            <span className="flex items-center justify-center gap-2 uppercase tracking-wider text-xs">
              <Check className="w-4 h-4" /> Changes Saved
            </span>
          ) : (
            <span className="flex items-center gap-2 uppercase tracking-wider text-xs">
              <ShieldCheck className="w-4 h-4" /> Save Changes
            </span>
          )}
        </Button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Physical parameters profile */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <User className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Operator Identity</h3>
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
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                placeholder="e.g. 26"
              />
              <Input 
                id="height"
                label="HEIGHT (CM)"
                type="number"
                value={userProfile.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                placeholder="e.g. 178"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                id="weight"
                label="CURRENT WEIGHT (KG)"
                type="number"
                step="0.1"
                value={userProfile.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 74.2"
              />
              <Input 
                id="target-weight"
                label="TARGET WEIGHT (KG)"
                type="number"
                step="0.1"
                value={userProfile.targetWeight}
                onChange={(e) => handleChange('targetWeight', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 68"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Fitness Goal & Training context */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <Dumbbell className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Tactical Goal & Training</h3>
          </div>

          <div className="space-y-4">
            <Select 
              id="fitness-goal"
              label="PRIMARY BIOMETRIC OBJECTIVE"
              value={userProfile.fitnessGoal}
              onChange={(e) => handleChange('fitnessGoal', e.target.value)}
              options={[
                { value: 'Build Muscle', label: 'Build Muscle' },
                { value: 'Lose Fat', label: 'Lose Fat' },
                { value: 'Body Recomposition', label: 'Body Recomposition' },
                { value: 'Improve Fitness', label: 'Improve Fitness' }
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select 
                id="training-env"
                label="TRAINING ENVIRONMENT"
                value={userProfile.trainingEnvironment}
                onChange={(e) => handleChange('trainingEnvironment', e.target.value)}
                options={[
                  { value: 'Gym', label: 'Tactical Gym' },
                  { value: 'Home', label: 'Home Environment' }
                ]}
              />
              <Select 
                id="training-exp"
                label="EXPERIENCE SPECTRUM"
                value={userProfile.trainingExperience}
                onChange={(e) => handleChange('trainingExperience', e.target.value)}
                options={[
                  { value: 'Beginner', label: 'Beginner Level' },
                  { value: 'Intermediate', label: 'Intermediate Level' },
                  { value: 'Advanced', label: 'Advanced Level' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                id="workout-days"
                label="PROTOCOL DAYS PER WEEK"
                type="number"
                value={userProfile.workoutDaysPerWeek}
                onChange={(e) => handleChange('workoutDaysPerWeek', parseInt(e.target.value) || 0)}
                placeholder="e.g. 4"
              />
              <Input 
                id="workout-time"
                label="PREFERRED TIME (HH:MM)"
                value={userProfile.preferredWorkoutTime}
                onChange={(e) => handleChange('preferredWorkoutTime', e.target.value)}
                placeholder="e.g. 18:30"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: FRIDAY Cognitive Intelligence profile settings */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 md:col-span-2" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <Bot className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">FRIDAY Cognitive Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <Select 
                id="coaching-style"
                label="COGNITIVE COACHING STYLE"
                value={userProfile.coachingStyle}
                onChange={(e) => handleChange('coachingStyle', e.target.value)}
                options={[
                  { value: 'Supportive', label: 'Supportive & Encouraging' },
                  { value: 'Balanced', label: 'Balanced Tactical Logic (Default)' },
                  { value: 'Direct', label: 'Direct & Scientific' },
                  { value: 'Strict', label: 'Strict Military Command OS' }
                ]}
              />
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                Reconfiguring coaching filters alters conversation syntax, tone metrics, and tactical feedback urgency.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850">
              <span className="text-[10px] font-bold text-cyan-400 block mb-1 uppercase tracking-widest">ACTIVE PROTOCOL: BALANCED</span>
              <p className="text-[11px] text-zinc-450 leading-relaxed">
                FRIDAY will balance warm motivational feedback loops with rigorous biometric statistics, warning you when daily targets are at-risk, and prioritizing clean recovery.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 4: Admin and reset controls */}
        <Card className="p-5 bg-zinc-950/40 border-zinc-850 md:col-span-2 border-red-950/10" hoverEffect={false}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-5">
            <Bot className="w-4.5 h-4.5 text-red-500" />
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Tactical System Reset</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[11px] text-zinc-400 max-w-lg leading-relaxed">
              Resetting onboarding deletes cached offline parameters, including goal settings, physical telemetry logs, baseline photograph references, and custom workout structures. This triggers a fresh biometric acquisition loop.
            </p>
            <Button 
              variant="outline" 
              onClick={onResetOnboarding}
              className="text-red-400 hover:text-red-350 hover:bg-red-500/10 border-red-500/20 uppercase tracking-wider text-[10px] shrink-0 font-bold"
            >
              Reset Onboarding Flow
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
