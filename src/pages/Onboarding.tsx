import React, { useState } from 'react';
import { 
  Bot, Flame, TrendingDown, Activity, Dumbbell, Sparkles, Shield, Compass, 
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  UserProfile, 
  Goal, 
  Sex, 
  ActivityLevel, 
  TrainingExperience, 
  TrainingEnvironment, 
  DietPreference 
} from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Goal
  const [goal, setGoal] = useState<Goal>('GENERAL_FITNESS');

  // Step 2: Demographics & Biometrics
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('MALE');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  // Step 3: Activity Level
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATELY_ACTIVE');

  // Step 4: Environment
  const [environment, setEnvironment] = useState<TrainingEnvironment>('HOME');

  // Step 5: Equipment
  const [hasNoEquipment, setHasNoEquipment] = useState<boolean>(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);

  // Step 6: Experience
  const [experience, setExperience] = useState<TrainingExperience>('BEGINNER');

  // Step 7: Available Days
  const [availableDays, setAvailableDays] = useState<string[]>(['MON', 'WED', 'FRI']);

  // Step 8: Workout Duration
  const [duration, setDuration] = useState<number>(45);

  // Step 9: Diet Preference
  const [diet, setDiet] = useState<DietPreference>('STANDARD');

  // Step 10: Preferences & Restrictions
  const [foodPreferences, setFoodPreferences] = useState('');
  const [allergies, setAllergies] = useState('');
  const [intolerances, setIntolerances] = useState('');

  const goalOptions: { id: Goal; title: string; desc: string; icon: any }[] = [
    { id: 'FAT_LOSS', title: 'Lose Fat', desc: 'Reduce body fat while preserving lean muscle mass', icon: TrendingDown },
    { id: 'GAIN_MUSCLE', title: 'Gain Muscle', desc: 'Hypertrophy-focused training with controlled surplus', icon: Dumbbell },
    { id: 'BODY_RECOMPOSITION', title: 'Body Recomposition', desc: 'Simultaneous fat loss and muscle building', icon: Sparkles },
    { id: 'STRENGTH', title: 'Build Strength', desc: 'Heavy compound motor recruitment and CNS adaptation', icon: Shield },
    { id: 'GENERAL_FITNESS', title: 'Improve Fitness', desc: 'Balanced cardiovascular and functional conditioning', icon: Compass },
    { id: 'ENDURANCE', title: 'Improve Endurance', desc: 'High stamina, aerobic threshold, and pacing', icon: Activity },
  ];

  const gymEquipmentCatalog: { id: Equipment; label: string }[] = [
    { id: 'DUMBBELLS', label: 'Dumbbells' },
    { id: 'BARBELL', label: 'Barbell' },
    { id: 'BENCH', label: 'Weight Bench' },
    { id: 'CABLE_MACHINE', label: 'Cable Machine' },
    { id: 'PULLUP_BAR', label: 'Pull-up Bar' },
    { id: 'RESISTANCE_BANDS', label: 'Resistance Bands' },
    { id: 'KETTLEBELL', label: 'Kettlebell' },
    { id: 'GYM_MACHINE', label: 'Gym Machine' }
  ];

  const handleNext = () => {
    if (step < 10) {
      setStep(s => s + 1);
    } else {
      finalizeProfile();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const toggleDay = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) 
        ? (prev.length > 1 ? prev.filter(d => d !== day) : prev) 
        : [...prev, day]
    );
  };

  const toggleEquipmentItem = (item: Equipment) => {
    setHasNoEquipment(false);
    setSelectedEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const finalizeProfile = () => {
    const finalEquipment: Equipment[] = hasNoEquipment ? ['NONE'] : (selectedEquipment.length > 0 ? selectedEquipment : ['NONE']);

    const profile: UserProfile = {
      name: name.trim() || 'Operator',
      age: parseInt(age, 10) || 25,
      sex,
      heightCm: parseFloat(height) || 175,
      currentWeightKg: parseFloat(currentWeight) || 70,
      targetWeightKg: parseFloat(targetWeight) || parseFloat(currentWeight) || 70,
      goal,
      activityLevel,
      trainingExperience: experience,
      trainingEnvironment: environment,
      equipment: finalEquipment,
      availableWorkoutDays: availableDays,
      preferredWorkoutDuration: duration,
      dietPreference: diet,
      foodPreferences: foodPreferences ? foodPreferences.split(',').map(s => s.trim()) : [],
      allergies: allergies ? allergies.split(',').map(s => s.trim()) : [],
      intolerances: intolerances ? intolerances.split(',').map(s => s.trim()) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans antialiased p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
            F
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">FRIDAY Onboarding</h1>
            <p className="text-[10px] text-zinc-500 font-mono">STEP {step} OF 10</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-32 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Step Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto my-8 flex flex-col justify-center">
        {/* STEP 1: GOAL */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">What is your primary goal?</h2>
              <p className="text-xs text-zinc-400 mt-1">This shapes your workout intensity, volume, and calorie calculations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = goal === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setGoal(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                      <span className="font-bold text-sm text-zinc-100">{opt.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: BIOMETRICS */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Biometric Telemetry</h2>
              <p className="text-xs text-zinc-400 mt-1">Accurate parameters ensure safe and realistic calorie/macro models.</p>
            </div>
            <div className="space-y-4">
              <Input 
                id="name" 
                label="Full Name / Operator Code" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter your name" 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  id="age" 
                  label="Age (Years)" 
                  type="number" 
                  value={age} 
                  onChange={e => setAge(e.target.value)} 
                  placeholder="e.g. 26" 
                />
                <Select 
                  id="sex" 
                  label="Biological Sex" 
                  value={sex} 
                  onChange={e => setSex(e.target.value as Sex)} 
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other / Neutral' },
                  ]} 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input 
                  id="height" 
                  label="Height (cm)" 
                  type="number" 
                  value={height} 
                  onChange={e => setHeight(e.target.value)} 
                  placeholder="175" 
                />
                <Input 
                  id="weight" 
                  label="Current Weight (kg)" 
                  type="number" 
                  value={currentWeight} 
                  onChange={e => setCurrentWeight(e.target.value)} 
                  placeholder="70.0" 
                />
                <Input 
                  id="targetWeight" 
                  label="Target Weight (kg)" 
                  type="number" 
                  value={targetWeight} 
                  onChange={e => setTargetWeight(e.target.value)} 
                  placeholder="68.0" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ACTIVITY LEVEL */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Daily Activity Level</h2>
              <p className="text-xs text-zinc-400 mt-1">Excluding your workouts, how active is your average day?</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'SEDENTARY', title: 'Sedentary', desc: 'Desk job, minimal daily walking or movement' },
                { id: 'LIGHTLY_ACTIVE', title: 'Lightly Active', desc: 'Light daily walking, standing chores (4,000–7,000 steps)' },
                { id: 'MODERATELY_ACTIVE', title: 'Moderately Active', desc: 'On your feet regularly, active daily schedule (7,000–10,000 steps)' },
                { id: 'VERY_ACTIVE', title: 'Very Active', desc: 'Heavy physical job, high movement index (12,000+ steps)' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivityLevel(item.id as ActivityLevel)}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    activityLevel === item.id 
                      ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-100">{item.title}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: TRAINING ENVIRONMENT */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Where will you train?</h2>
              <p className="text-xs text-zinc-400 mt-1">Exercises will be strictly filtered by what is physically available.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'HOME', title: 'Home', desc: 'Living room, garage, or dedicated home setup' },
                { id: 'GYM', title: 'Gym', desc: 'Commercial gym with free weights and machines' },
                { id: 'OUTDOOR', title: 'Outdoor', desc: 'Parks, calisthenics parks, track' },
              ].map(env => (
                <button
                  key={env.id}
                  onClick={() => {
                    setEnvironment(env.id as TrainingEnvironment);
                    if (env.id === 'HOME' || env.id === 'OUTDOOR') {
                      setHasNoEquipment(true);
                      setSelectedEquipment([]);
                    }
                  }}
                  className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                    environment === env.id 
                      ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-base text-zinc-100">{env.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">{env.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: EQUIPMENT */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Available Equipment</h2>
              <p className="text-xs text-zinc-400 mt-1">
                If you select "No equipment", the workout generator will strictly enforce zero-equipment bodyweight movements.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setHasNoEquipment(true);
                  setSelectedEquipment([]);
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  hasNoEquipment 
                    ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                    : 'bg-zinc-900/40 border-zinc-850 text-zinc-400'
                }`}
              >
                <div className="font-bold text-sm text-zinc-100">No equipment (Pure Bodyweight)</div>
                <div className="text-xs text-zinc-400 mt-0.5">Push-ups, squats, lunges, planks, and calisthenics only</div>
              </button>

              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-2">Or select equipment you own:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {gymEquipmentCatalog.map(item => {
                  const isChecked = !hasNoEquipment && selectedEquipment.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleEquipmentItem(item.id)}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: EXPERIENCE */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Training Experience</h2>
              <p className="text-xs text-zinc-400 mt-1">Determines volume, complexity, and set/rep progression.</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'BEGINNER', title: 'Beginner (0–1 year)', desc: 'Learning compound movements, building neurological coordination' },
                { id: 'INTERMEDIATE', title: 'Intermediate (1–3 years)', desc: 'Consistent training history, familiar with progressive overload' },
                { id: 'ADVANCED', title: 'Advanced (3+ years)', desc: 'High strength baseline, optimized periodization' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setExperience(item.id as TrainingExperience)}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    experience === item.id 
                      ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-100">{item.title}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: AVAILABLE DAYS */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Available Workout Days</h2>
              <p className="text-xs text-zinc-400 mt-1">Select the days each week you commit to training.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => {
                const active = availableDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`p-4 rounded-xl border font-mono font-bold text-sm transition-all cursor-pointer ${
                      active 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: DURATION */}
        {step === 8 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Session Duration</h2>
              <p className="text-xs text-zinc-400 mt-1">Preferred training time per session.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { min: 30, label: '30 Minutes', desc: 'High efficiency, fast supersets' },
                { min: 45, label: '45 Minutes', desc: 'Balanced hypertrophy & rest' },
                { min: 60, label: '60 Minutes', desc: 'Full compound volume & warmup' },
              ].map(d => (
                <button
                  key={d.min}
                  onClick={() => setDuration(d.min)}
                  className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                    duration === d.min 
                      ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-base text-zinc-100">{d.label}</div>
                  <div className="text-xs text-zinc-400 mt-1">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: DIET PREFERENCE */}
        {step === 9 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Dietary Framework</h2>
              <p className="text-xs text-zinc-400 mt-1">Select your standard nutritional approach.</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'STANDARD', label: 'Standard Omnivore', desc: 'Balanced animal and plant proteins, grains, and fats' },
                { id: 'VEGETARIAN', label: 'Vegetarian', desc: 'Dairy, eggs, legumes, tofu, plant-focused' },
                { id: 'VEGAN', label: 'Vegan', desc: 'Strictly plant-based whole foods and protein sources' },
                { id: 'KETO', label: 'Ketogenic', desc: 'High fat, moderate protein, very low carbohydrate' },
                { id: 'PALEO', label: 'Paleo', desc: 'Lean meats, fish, fruits, vegetables, nuts and seeds' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setDiet(item.id as DietPreference)}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    diet === item.id 
                      ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-100">{item.label}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: FOOD RESTRICTIONS */}
        {step === 10 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Food Preferences & Restrictions</h2>
              <p className="text-xs text-zinc-400 mt-1">Help FRIDAY optimize future dietary meal recommendations.</p>
            </div>
            <div className="space-y-4">
              <Input 
                id="foodPrefs" 
                label="Favorite Foods (comma separated)" 
                value={foodPreferences} 
                onChange={e => setFoodPreferences(e.target.value)} 
                placeholder="e.g. Chicken breast, Eggs, Rice, Oats" 
              />
              <Input 
                id="allergies" 
                label="Allergies (comma separated)" 
                value={allergies} 
                onChange={e => setAllergies(e.target.value)} 
                placeholder="e.g. Peanuts, Shellfish" 
              />
              <Input 
                id="intolerances" 
                label="Intolerances / Dislikes (comma separated)" 
                value={intolerances} 
                onChange={e => setIntolerances(e.target.value)} 
                placeholder="e.g. Dairy, Gluten" 
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-2xl mx-auto flex items-center justify-between border-t border-zinc-900 pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          className="text-xs uppercase tracking-wider"
        >
          {step === 10 ? (
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" /> Save Profile & Build Plan
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-bold">
              Continue <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </footer>
    </div>
  );
};
