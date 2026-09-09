import React, { useState, useEffect } from 'react';
import { 
  Bot, Flame, TrendingDown, Activity, Dumbbell, Sparkles, Shield, Compass, 
  ArrowRight, ArrowLeft, Upload, Trash2, Home, CheckCircle, ChevronRight, 
  Terminal, ShieldCheck, Scale, Ruler, Sparkle, Calendar, User, Eye, UserCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { UserProfile, Workout, Exercise, WorkoutSet } from '../types';
import { generateFilteredWorkouts } from '../data/exerciseDb';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>, photo: string | null, customWorkouts: Workout[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  
  // Onboarding state
  const [name, setName] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [weight, setWeight] = useState<string>('74.2');
  const [height, setHeight] = useState<string>('178');
  const [age, setAge] = useState<string>('26');
  const [targetWeight, setTargetWeight] = useState<string>('68.0');
  const [trainingExperience, setTrainingExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [activityLevel, setActivityLevel] = useState<string>('Moderately Active');
  const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
  const [trainingEnvironment, setTrainingEnvironment] = useState<'Gym' | 'Home'>('Gym');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Simulated processing state
  const [processingIndex, setProcessingIndex] = useState<number>(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);

  // Equipment lists
  const gymEquipmentOptions = [
    'Barbell', 'Dumbbells', 'Adjustable Dumbbells', 'Bench', 'Squat Rack', 
    'Smith Machine', 'Cable Machine', 'Lat Pulldown', 'Leg Press', 
    'Leg Extension', 'Leg Curl', 'Pull-up Bar', 'Dip Station', 'Pec Deck', 
    'Chest Press', 'Shoulder Press Machine', 'Cardio Machines', 'Resistance Bands'
  ];

  const homeEquipmentOptions = [
    'No Equipment', 'Dumbbells', 'Resistance Bands', 'Pull-up Bar', 'Bench', 
    'Adjustable Dumbbells', 'Kettlebell', 'Other'
  ];

  // Set default equipment depending on training environment
  useEffect(() => {
    if (trainingEnvironment === 'Gym') {
      setSelectedEquipment([]);
    } else {
      setSelectedEquipment(['No Equipment']);
    }
  }, [trainingEnvironment]);

  // Handle Drag & Drop for Image
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readImageFile(file);
    }
  };

  const readImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setBodyPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setBodyPhoto(null);
  };

  // Select all gym equipment
  const handleSelectFullGym = () => {
    setSelectedEquipment(gymEquipmentOptions);
  };

  const toggleEquipment = (item: string) => {
    if (trainingEnvironment === 'Home') {
      if (item === 'No Equipment') {
        setSelectedEquipment(['No Equipment']);
        return;
      }
      setSelectedEquipment(prev => {
        const filtered = prev.filter(x => x !== 'No Equipment');
        if (filtered.includes(item)) {
          const next = filtered.filter(x => x !== item);
          return next.length === 0 ? ['No Equipment'] : next;
        } else {
          return [...filtered, item];
        }
      });
    } else {
      // Gym Mode
      setSelectedEquipment(prev => {
        if (prev.includes(item)) {
          return prev.filter(x => x !== item);
        } else {
          return [...prev, item];
        }
      });
    }
  };

  // Run dynamic simulated processing timers for Screen 7
  useEffect(() => {
    if (step === 7) {
      setProcessingIndex(0);
      setIsProcessingComplete(false);
      
      const timer1 = setTimeout(() => setProcessingIndex(1), 700);
      const timer2 = setTimeout(() => setProcessingIndex(2), 1400);
      const timer3 = setTimeout(() => setProcessingIndex(3), 2100);
      const timer4 = setTimeout(() => setProcessingIndex(4), 2800);
      const timer5 = setTimeout(() => {
        setProcessingIndex(5);
        setIsProcessingComplete(true);
      }, 3400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [step]);

  // Validation routines
  const isGoalStepDisabled = !selectedGoal;
  
  const isInfoStepDisabled = 
    !name.trim() || 
    isNaN(parseFloat(weight)) || parseFloat(weight) <= 30 || parseFloat(weight) > 300 ||
    isNaN(parseFloat(height)) || parseFloat(height) <= 100 || parseFloat(height) > 250 ||
    isNaN(parseInt(age)) || parseInt(age) <= 10 || parseInt(age) > 100 ||
    isNaN(parseFloat(targetWeight)) || parseFloat(targetWeight) <= 30 || parseFloat(targetWeight) > 300;

  // Render Goal Icons & Metadata
  const goalsMetadata = [
    {
      id: 'Bulk',
      name: 'BULK',
      subtitle: 'Gain size & body mass',
      desc: 'Increase total body mass and muscle volume through structured hyper-caloric feeding loops and progressive overload protocols.',
      icon: Flame,
      color: 'text-amber-400 border-amber-500/10 hover:border-amber-500/30'
    },
    {
      id: 'Lose Fat',
      name: 'FAT LOSS',
      subtitle: 'Reduce body fat percentage',
      desc: 'Optimize visceral and subcutaneous adipose tissue reduction while securing maximum nitrogen retention and energy conservation.',
      icon: TrendingDown,
      color: 'text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30'
    },
    {
      id: 'Cut',
      name: 'CUT',
      subtitle: 'Get lean & maintain muscle',
      desc: 'Achieve razor-sharp definition and optimal vascularity by maintaining lean skeletal muscle tissue during a caloric deficit.',
      icon: Activity,
      color: 'text-cyan-400 border-cyan-500/10 hover:border-cyan-500/30'
    },
    {
      id: 'Gain Muscle',
      name: 'GAIN MUSCLE',
      subtitle: 'Build muscle & strength',
      desc: 'Optimize strength coefficients and clean myofibrillar hypertrophy with a slight caloric surplus and high protein density.',
      icon: Dumbbell,
      color: 'text-indigo-400 border-indigo-500/10 hover:border-indigo-500/30'
    },
    {
      id: 'Body Recomposition',
      name: 'BODY RECOMPOSITION',
      subtitle: 'Simultaneous fat loss & muscle gain',
      desc: 'A precise, fine-tuned protocol to exchange adipose tissue for active lean muscle using body composition shifting.',
      icon: Sparkles,
      color: 'text-violet-400 border-violet-500/10 hover:border-violet-500/30'
    },
    {
      id: 'Strength',
      name: 'STRENGTH',
      subtitle: 'Maximize physical power output',
      desc: 'Prioritize motor unit recruitment, central nervous system conditioning, and peak absolute lift parameters.',
      icon: Shield,
      color: 'text-rose-400 border-rose-500/10 hover:border-rose-500/30'
    },
    {
      id: 'General Fitness',
      name: 'GENERAL FITNESS',
      subtitle: 'Improve overall health & stamina',
      desc: 'Enhance VO2 max, metabolic conditioning, heart rate variability, and functional range of motion coefficients.',
      icon: Compass,
      color: 'text-teal-400 border-teal-500/10 hover:border-teal-500/30'
    }
  ];

  // Logic to build custom generated workouts to inject upon completion
  const generateCustomWorkouts = (): Workout[] => {
    return generateFilteredWorkouts(trainingEnvironment, selectedEquipment, selectedGoal);
  };

  const handleFinishOnboarding = () => {
    const customWorkouts = generateCustomWorkouts();
    
    const profile: Partial<UserProfile> = {
      id: `user-${Date.now()}`,
      name: name || "Operator",
      goal: selectedGoal,
      weight: parseFloat(weight) || 74.2,
      height: parseFloat(height) || 178,
      age: parseInt(age) || 26,
      trainingExperience: trainingExperience,
      activityLevel: activityLevel,
      trainingEnvironment: trainingEnvironment,
      equipment: selectedEquipment,
      bodyPhoto: bodyPhoto,
      preferences: {
        coachingStyle: "Balanced",
        workoutDaysPerWeek: 4,
        preferredWorkoutTime: "18:30",
        targetWeight: parseFloat(targetWeight) || 68.0
      },
      // Backward compatibility fields
      fitnessGoal: selectedGoal,
      targetWeight: parseFloat(targetWeight) || 68.0,
      workoutDaysPerWeek: 4,
      preferredWorkoutTime: "18:30",
      coachingStyle: "Balanced"
    };

    onComplete(profile, bodyPhoto, customWorkouts);
  };

  // Return generated mock exercise list for preview rendering
  const getMockPreviewExercises = () => {
    const list = generateFilteredWorkouts(trainingEnvironment, selectedEquipment, selectedGoal);
    if (list.length > 0 && list[0].exercises.length > 0) {
      return list[0].exercises.map(ex => `${ex.name} (${ex.targetReps})`);
    }
    return ['Bodyweight Push-ups (3x15)', 'Pike Push-ups (3x12)'];
  };

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 flex flex-col justify-between font-sans antialiased relative overflow-hidden">
      
      {/* Visual background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/10 via-[#070708] to-[#070708] pointer-events-none z-0" />
      <div className="absolute inset-y-0 right-0 w-96 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.03)_0%,_transparent_60%)] pointer-events-none z-0" />
      
      {/* Top Header Logotype */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-900/60 z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-black text-white uppercase tracking-wider block">FRIDAY</span>
            <span className="text-[8px] font-bold text-zinc-500 tracking-widest uppercase block -mt-1">AI Tactical Intelligence</span>
          </div>
        </div>

        {step > 1 && step < 7 && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">SYSTEM SEPARATION INDEX</span>
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 w-3 rounded-full transition-all duration-300 ${
                    idx + 1 < step 
                      ? 'bg-cyan-500/80' 
                      : idx + 1 === step 
                      ? 'bg-cyan-400 w-6 shadow-[0_0_8px_rgba(6,182,212,0.5)]' 
                      : 'bg-zinc-800'
                  }`} 
                />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 md:py-12 flex flex-col justify-center items-center z-10 relative">
        
        {/* ================== SCREEN 1: Welcome ================== */}
        {step === 1 && (
          <div className="text-center max-w-xl w-full space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-850 px-3.5 py-1.5 rounded-full text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 shadow-inner">
              <Sparkle className="w-3.5 h-3.5 text-cyan-400 animate-spin [animation-duration:12s]" />
              <span>FRIDAY OS SYSTEM READY</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight uppercase">
                FRIDAY
              </h1>
              <p className="text-cyan-400 text-sm font-mono tracking-widest uppercase">
                "Your personal fitness intelligence."
              </p>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
                Let's understand your goals, your body and your training environment before we build your plan. Establish a beautiful biometric correlation.
              </p>
            </div>

            {/* Premium name placeholder before starting setup */}
            <div className="max-w-xs mx-auto bg-zinc-950/40 p-4 border border-zinc-900/80 rounded-xl space-y-3">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-left block">
                ENTER USER PROFILE SYMBOL / NAME
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jagadeesh"
                className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none text-center font-bold tracking-wide"
              />
            </div>

            <div className="pt-4">
              <Button 
                variant="primary" 
                size="lg"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="px-8 shadow-md"
              >
                <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-black">
                  Begin Setup <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </span>
              </Button>
              {!name.trim() && (
                <span className="text-[10px] text-zinc-600 block mt-2 uppercase font-bold tracking-wider">
                  * Name identifier is required to proceed
                </span>
              )}
            </div>
          </div>
        )}

        {/* ================== SCREEN 2: Fitness Goal ================== */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                What do you want to achieve?
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Select your primary fitness objective. FRIDAY will calibrate nutrition targets and workouts to this metabolic setting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
              {goalsMetadata.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = selectedGoal === goal.id;
                
                return (
                  <div 
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between text-left group select-none relative ${
                      isSelected 
                        ? 'bg-zinc-900/60 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.06)]' 
                        : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-widest uppercase">
                        Selected
                      </div>
                    )}
                    <div>
                      <div className={`p-2.5 rounded-lg border w-fit mb-4 bg-zinc-900 transition-all duration-300 ${goal.color}`}>
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{goal.name}</h3>
                      <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">{goal.subtitle}</span>
                      <p className="text-[10px] text-zinc-500 mt-2.5 leading-relaxed group-hover:text-zinc-400 transition-colors duration-200">
                        {goal.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 max-w-xs mx-auto pt-4 justify-between w-full">
              <Button variant="ghost" onClick={() => setStep(1)} className="uppercase tracking-wider text-xs">
                <span className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</span>
              </Button>
              <Button 
                variant="primary" 
                disabled={isGoalStepDisabled}
                onClick={() => setStep(3)}
                className="uppercase tracking-wider text-xs font-black shadow-md"
              >
                <span className="flex items-center gap-1">Continue <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        )}

        {/* ================== SCREEN 3: Body Information ================== */}
        {step === 3 && (
          <div className="max-w-md w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Understand starting point.
              </h2>
              <p className="text-xs text-zinc-500">
                Before I build your plan, I need to understand your starting biometric profiles. Provide accurate parameters.
              </p>
            </div>

            <Card className="p-5 bg-zinc-950/40 border-zinc-900 space-y-5" hoverEffect={false}>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    WEIGHT (KG)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 74.2"
                      className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 font-mono font-bold">kg</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    HEIGHT (CM)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 178"
                      className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 font-mono font-bold">cm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    AGE (YEARS)
                  </label>
                  <input 
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    TARGET WEIGHT (KG)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="e.g. 68.0"
                      className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 font-mono font-bold">kg</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                  TRAINING EXPERIENCE LEVEL
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTrainingExperience(lvl)}
                      className={`h-9 border text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all duration-200 ${
                        trainingExperience === lvl 
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' 
                          : 'border-zinc-900 bg-zinc-900/60 text-zinc-450 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                  CURRENT DAILY ACTIVITY COEFFICIENT
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-lg h-10 px-3 text-xs text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="Sedentary">Sedentary (Desk Job, minimal physical movement)</option>
                  <option value="Lightly Active">Lightly Active (1-3 light walks/activity days per week)</option>
                  <option value="Moderately Active">Moderately Active (Daily walks, active sports 3-5 days/wk)</option>
                  <option value="Very Active">Very Active (Heavy training, physical job description)</option>
                </select>
              </div>

            </Card>

            <div className="flex gap-4 justify-between w-full pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="uppercase tracking-wider text-xs">
                <span className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</span>
              </Button>
              <Button 
                variant="primary" 
                disabled={isInfoStepDisabled}
                onClick={() => setStep(4)}
                className="uppercase tracking-wider text-xs font-black shadow-md"
              >
                <span className="flex items-center gap-1">Continue <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        )}

        {/* ================== SCREEN 4: Body Photo ================== */}
        {step === 4 && (
          <div className="max-w-md w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Show me your starting point.
              </h2>
              <p className="text-xs text-zinc-500">
                Your first photo creates a visual baseline for your future progress tracking.
              </p>
            </div>

            <Card className="p-5 bg-zinc-950/40 border-zinc-900 space-y-4" hoverEffect={false}>
              
              {/* Photo Guidelines */}
              <div className="bg-zinc-900/60 p-3 border border-zinc-850 rounded-lg text-[10px] text-zinc-400 space-y-1.5 leading-normal">
                <span className="font-bold text-cyan-400 block uppercase tracking-wider">PHOTOGRAPH PROTOCOLS:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Full body frame viewable</li>
                  <li>Front-facing position, arms down slightly at sides</li>
                  <li>Sufficient natural lighting (avoid backlighting)</li>
                  <li>Neutral standing position against plain background</li>
                </ul>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative h-64 border border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-cyan-500 bg-cyan-500/5' 
                    : bodyPhoto 
                    ? 'border-zinc-800 bg-zinc-900/10' 
                    : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700'
                }`}
              >
                {bodyPhoto ? (
                  <div className="absolute inset-0 p-2 flex flex-col items-center justify-center">
                    <img 
                      src={bodyPhoto} 
                      alt="Starting Baseline Preview" 
                      className="h-full max-h-52 object-contain rounded border border-zinc-800 shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 flex gap-2">
                      <button 
                        type="button" 
                        onClick={removeImage}
                        className="bg-red-500/15 hover:bg-red-500/30 border border-red-500/20 px-3 py-1.5 rounded-lg text-[9px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5 transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3 cursor-pointer">
                    <div className="p-3 bg-zinc-900/80 border border-zinc-850 rounded-lg w-fit mx-auto text-zinc-400">
                      <Upload className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                        Drag and drop file here
                      </span>
                      <span className="text-[10px] text-zinc-550 block mt-1 uppercase">
                        or click to browse local catalog
                      </span>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="text-[9px] text-zinc-600 text-center leading-normal">
                Offline baseline security active. Photos remain locally inside browser memory and are never transmitted to cloud databases.
              </div>

            </Card>

            <div className="flex gap-4 justify-between w-full pt-2">
              <Button variant="ghost" onClick={() => setStep(3)} className="uppercase tracking-wider text-xs">
                <span className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setStep(5)}
                className="uppercase tracking-wider text-xs font-black shadow-md"
              >
                <span className="flex items-center gap-1">
                  {bodyPhoto ? 'Continue' : 'Skip & Continue'} <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* ================== SCREEN 5: Training Environment ================== */}
        {step === 5 && (
          <div className="max-w-2xl w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Where are you going to train?
              </h2>
              <p className="text-xs text-zinc-500">
                FRIDAY will calibrate your workout protocols dynamically to make full use of your immediate setting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* GYM Option */}
              <div 
                onClick={() => setTrainingEnvironment('Gym')}
                className={`p-6 rounded-xl border cursor-pointer select-none text-left transition-all duration-300 relative group flex flex-col justify-between ${
                  trainingEnvironment === 'Gym' 
                    ? 'bg-zinc-900/60 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.06)]' 
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-850'
                }`}
              >
                {trainingEnvironment === 'Gym' && (
                  <div className="absolute top-4 right-4 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[8px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
                    Active Environment
                  </div>
                )}
                <div>
                  <div className={`p-3 rounded-lg border w-fit mb-4 bg-zinc-900 transition-all duration-300 ${
                    trainingEnvironment === 'Gym' ? 'text-cyan-400 border-cyan-500/20' : 'text-zinc-600 border-zinc-900'
                  }`}>
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">TACTICAL GYM</h3>
                  <span className="text-[10px] font-bold text-zinc-450 block mt-0.5 uppercase tracking-wide">
                    Train with gym equipment
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">
                    Unlocks heavy compound loading logs (barbells, plates, racks, stack systems, leg press machines) and precise isolation tracking.
                  </p>
                </div>
              </div>

              {/* HOME Option */}
              <div 
                onClick={() => setTrainingEnvironment('Home')}
                className={`p-6 rounded-xl border cursor-pointer select-none text-left transition-all duration-300 relative group flex flex-col justify-between ${
                  trainingEnvironment === 'Home' 
                    ? 'bg-zinc-900/60 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.06)]' 
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-850'
                }`}
              >
                {trainingEnvironment === 'Home' && (
                  <div className="absolute top-4 right-4 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[8px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
                    Active Environment
                  </div>
                )}
                <div>
                  <div className={`p-3 rounded-lg border w-fit mb-4 bg-zinc-900 transition-all duration-300 ${
                    trainingEnvironment === 'Home' ? 'text-cyan-400 border-cyan-500/20' : 'text-zinc-600 border-zinc-900'
                  }`}>
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">HOME ENVIRONMENT</h3>
                  <span className="text-[10px] font-bold text-zinc-450 block mt-0.5 uppercase tracking-wide">
                    Train using equipment available at home
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">
                    Unlocks bodyweight, adjustable dumbbell, kettlebell, and resistance band adaptations to provide maximum muscle output in minimal square-footage.
                  </p>
                </div>
              </div>

            </div>

            <div className="flex gap-4 justify-between max-w-xs mx-auto pt-4 w-full">
              <Button variant="ghost" onClick={() => setStep(4)} className="uppercase tracking-wider text-xs">
                <span className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setStep(6)}
                className="uppercase tracking-wider text-xs font-black shadow-md"
              >
                <span className="flex items-center gap-1">Continue <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        )}

        {/* ================== SCREEN 6A/6B: Equipment Setup ================== */}
        {step === 6 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                {trainingEnvironment === 'Gym' 
                  ? 'Tell FRIDAY what equipment you have access to.' 
                  : 'What do you have available at home?'}
              </h2>
              <p className="text-xs text-zinc-500">
                Select your available resources. If missing key items, select "No Equipment" or click "Full Gym" to auto-select catalog.
              </p>
            </div>

            {/* Selection HUD actions for GYM */}
            {trainingEnvironment === 'Gym' && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectFullGym}
                  className="text-[10px] font-mono tracking-widest uppercase border-zinc-800 hover:border-cyan-500/20"
                >
                  <span className="flex items-center gap-1">SELECT ENTIRE CLUB CATALOG ("Full Gym")</span>
                </Button>
              </div>
            )}

            {/* Equipment selections cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {(trainingEnvironment === 'Gym' ? gymEquipmentOptions : homeEquipmentOptions).map((item) => {
                const isSelected = selectedEquipment.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`p-3 rounded-lg border text-center cursor-pointer select-none transition-all duration-200 flex flex-col justify-between items-center h-20 ${
                      isSelected
                        ? 'bg-cyan-500/5 border-cyan-500/40 text-cyan-400'
                        : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-450'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider h-full flex items-center justify-center">
                      {item}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-transparent'}`} />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-between max-w-xs mx-auto pt-4 w-full">
              <Button variant="ghost" onClick={() => setStep(5)} className="uppercase tracking-wider text-xs">
                <span className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setStep(7)}
                className="uppercase tracking-wider text-xs font-black shadow-md"
              >
                <span className="flex items-center gap-1">Generate Plan <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        )}

        {/* ================== SCREEN 7: Plan Synthesis & Preview ================== */}
        {step === 7 && (
          <div className="max-w-xl w-full space-y-6 animate-fade-in relative">
            
            {/* Terminal simulation wrapper */}
            {!isProcessingComplete ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-mono text-cyan-400 tracking-wider uppercase flex items-center justify-center gap-2">
                    <Terminal className="w-5 h-5 animate-spin" /> SYNAPSE CONSTRUCTING...
                  </h2>
                  <p className="text-xs text-zinc-500">
                    FRIDAY is compiling biometric telemetry logs to establish personalized metrics.
                  </p>
                </div>

                <Card className="p-5 bg-zinc-950 border-zinc-900 font-mono text-xs space-y-3 shadow-inner" hoverEffect={false}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 pb-2 border-b border-zinc-900">
                    <span>SYSTEM ID: FRIDAY-COGNITION-SYNAPSE</span>
                    <span>BAUD: 9600</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{"["}0.7s{"]"} UNDERSTANDING METABOLIC GOAL...</span>
                      {processingIndex >= 1 ? (
                        <span className="text-emerald-400 font-bold">✓ GOAL DETECTED: {selectedGoal}</span>
                      ) : (
                        <span className="text-zinc-700 animate-pulse">LOGGING...</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{"["}1.4s{"]"} RESOLVING BIOMETRIC STANDARDS...</span>
                      {processingIndex >= 2 ? (
                        <span className="text-emerald-400 font-bold">✓ PROFILE BUILT ({weight} KG / {height} CM)</span>
                      ) : processingIndex >= 1 ? (
                        <span className="text-zinc-700 animate-pulse">LOGGING...</span>
                      ) : (
                        <span className="text-zinc-800">-</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{"["}2.1s{"]"} IDENTIFYING GYM/HOME SPATIAL LIMITS...</span>
                      {processingIndex >= 3 ? (
                        <span className="text-emerald-400 font-bold">✓ {trainingEnvironment.toUpperCase()} ENVD REGISTERED</span>
                      ) : processingIndex >= 2 ? (
                        <span className="text-zinc-700 animate-pulse">LOGGING...</span>
                      ) : (
                        <span className="text-zinc-800">-</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{"["}2.8s{"]"} WEIGHING AVAILABLE HARDWARE STACKS...</span>
                      {processingIndex >= 4 ? (
                        <span className="text-emerald-400 font-bold">✓ {selectedEquipment.length} COMPONENTS DETECTED</span>
                      ) : processingIndex >= 3 ? (
                        <span className="text-zinc-700 animate-pulse">LOGGING...</span>
                      ) : (
                        <span className="text-zinc-800">-</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{"["}3.4s{"]"} OPTIMIZING MICRO-HYPERTROPHY LOOPS...</span>
                      {processingIndex >= 5 ? (
                        <span className="text-emerald-400 font-bold">✓ COMPLETE</span>
                      ) : processingIndex >= 4 ? (
                        <span className="text-zinc-700 animate-pulse">LOGGING...</span>
                      ) : (
                        <span className="text-zinc-800">-</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-zinc-650 flex gap-2">
                    <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse shrink-0" />
                    <span>SYSTEM IS CORRELATING METRIC PROTOCOLS SECURELY. COGNITION CYCLE ACTIVE.</span>
                  </div>
                </Card>
              </div>
            ) : (
              // Onboarding Ready Summary Page
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full w-fit mx-auto mb-2 animate-bounce">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                    Your FRIDAY plan is ready.
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Your biometric coefficient is resolved. Review your initial weekly operational calendar.
                  </p>
                </div>

                {/* Selection Details Badge grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-lg text-left">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">GOAL</span>
                    <span className="text-[11px] font-extrabold text-white uppercase mt-0.5 block">{selectedGoal}</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-lg text-left">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">TRAINING</span>
                    <span className="text-[11px] font-extrabold text-white uppercase mt-0.5 block">{trainingEnvironment}</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-lg text-left">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">WEIGHT BASELINE</span>
                    <span className="text-[11px] font-extrabold text-white mt-0.5 block">{weight} kg</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-lg text-left">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">HEIGHT BASE</span>
                    <span className="text-[11px] font-extrabold text-white mt-0.5 block">{height} cm</span>
                  </div>
                </div>

                {/* Calendar summary layout card */}
                <Card className="p-5 bg-zinc-950/40 border-zinc-900 text-left space-y-4" hoverEffect={false}>
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>Weekly Tactical Protocol</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-550 font-bold uppercase">4 operational days</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60">
                      <span className="font-bold text-zinc-200">Monday — Push Day</span>
                      <span className="text-[10px] text-zinc-500">{getMockPreviewExercises().join(', ')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60">
                      <span className="font-bold text-zinc-200">Tuesday — Pull Day</span>
                      <span className="text-[10px] text-zinc-500">Dumbbell Rows, Lat Pulldowns, Bicep Curls</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60">
                      <span className="font-bold text-zinc-500">Wednesday — Rest Day</span>
                      <span className="text-[10px] text-zinc-600">Active Recovery, 10k Steps, Hydration Securing</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60">
                      <span className="font-bold text-zinc-200">Thursday — Legs Day</span>
                      <span className="text-[10px] text-zinc-500">Goblet Squats, Lunges, Calf Raises</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60">
                      <span className="font-bold text-zinc-200">Friday — Upper Body</span>
                      <span className="text-[10px] text-zinc-500">Lateral Raises, Hammer Curls, Bench Press</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1.5">
                      <span className="font-bold text-zinc-550">Weekend — Recovery & Cardio</span>
                      <span className="text-[10px] text-zinc-600">Optional 30m Metabolic Zone 2 Cardio</span>
                    </div>
                  </div>
                </Card>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button 
                    onClick={() => setStep(6)}
                    className="text-xs font-bold text-zinc-550 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> RECONFIGURE HARDWARE
                  </button>

                  <Button 
                    variant="primary"
                    onClick={handleFinishOnboarding}
                    className="w-full sm:w-auto uppercase tracking-widest text-xs font-black shadow-lg"
                  >
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 stroke-[2]" /> LAUNCH COMMAND CENTER
                    </span>
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer System Status details */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-5 text-[9px] text-zinc-650 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-900/60 z-10 relative">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-zinc-600" />
          <span>OPERATOR DEPLOYMENT STATUS: LOCAL ENCRYPTED BASELINE SECURED</span>
        </div>
        <div>
          <span>FRIDAY OS COGNITIVE LAYER V1.2.0 • PORT 3000</span>
        </div>
      </footer>
    </div>
  );
};
