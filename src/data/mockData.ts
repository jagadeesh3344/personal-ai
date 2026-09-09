import { UserProfile, DailyStats, Task, Workout, Meal, Nutrition, Habit, ProgressMeasurement, FridayMessage, HydrationData } from '../types';

export const initialUserProfile: UserProfile = {
  id: "user-default",
  name: "Jagadeesh",
  age: 26,
  sex: "Male",
  height: 178,
  weight: 74.2,
  currentWeight: 74.2,
  targetWeight: 68.0,
  goal: "Fat Loss",
  activityLevel: "Moderately Active",
  trainingExperience: "Intermediate",
  trainingEnvironment: "Gym",
  equipment: [
    'Barbell', 'Dumbbells', 'Bench', 'Squat Rack', 'Smith Machine',
    'Cable Machine', 'Lat Pulldown', 'Leg Press'
  ],
  dietPreference: "Standard",
  foodPreferences: ['Chicken', 'Eggs', 'Rice', 'Oats'],
  allergies: ['Peanuts'],
  exercisePreferences: {
    liked: ['Bench Press', 'Bodyweight Push-up'],
    disliked: ['Burpees']
  },
  availableWorkoutDays: ['Mon', 'Tue', 'Thu', 'Fri'],
  workoutDuration: 45,
  bodyPhoto: null,
  preferences: {
    coachingStyle: "Balanced",
    workoutDaysPerWeek: 4,
    preferredWorkoutTime: "18:30",
    targetWeight: 68.0
  },
  // Backward compatibility fields
  fitnessGoal: "Fat Loss",
  workoutDaysPerWeek: 4,
  preferredWorkoutTime: "18:30",
  coachingStyle: "Balanced"
};

export const initialDailyStats: DailyStats = {
  score: 82,
  scoreBreakdown: {
    workout: 15,
    nutrition: 18,
    hydration: 15,
    steps: 14,
    sleep: 20
  },
  weight: 74.2,
  targetWeight: 68.0,
  streakDays: 12,
  weightChange: "-1.8 kg this week"
};

export const initialTasks: Task[] = [
  { id: '1', title: 'Drink 2.5L water', completed: true, category: 'hydration', value: '1.8L / 2.5L' },
  { id: '2', title: 'Complete Push Day workout', completed: true, category: 'workout', value: '45 mins' },
  { id: '3', title: 'Reach protein target (140g)', completed: false, category: 'nutrition', value: '86g / 140g' },
  { id: '4', title: 'Reach 8,000 steps', completed: false, category: 'steps', value: '6,200 / 8,000 steps' },
  { id: '5', title: 'Sleep 7+ hours', completed: true, category: 'sleep', value: '7.5 hours' }
];

export const initialWorkouts: Workout[] = [
  {
    id: 'w1',
    name: "Push Day",
    durationMinutes: 45,
    completed: false,
    date: '2026-09-08',
    exercises: [
      {
        id: 'e1',
        name: "Bench Press",
        targetReps: "3 sets of 8-10 reps",
        notes: "Keep chest up, control the descent",
        sets: [
          { id: 's1-1', weight: 60, reps: 10, completed: true },
          { id: 's1-2', weight: 60, reps: 8, completed: true },
          { id: 's1-3', weight: 55, reps: 10, completed: false }
        ]
      },
      {
        id: 'e2',
        name: "Incline Dumbbell Press",
        targetReps: "3 sets of 10 reps",
        notes: "30 degree incline for upper chest",
        sets: [
          { id: 's2-1', weight: 22, reps: 10, completed: true },
          { id: 's2-2', weight: 22, reps: 10, completed: false },
          { id: 's2-3', weight: 20, reps: 12, completed: false }
        ]
      },
      {
        id: 'e3',
        name: "Shoulder Press (Dumbbell)",
        targetReps: "3 sets of 8-10 reps",
        notes: "Don't flare elbows out too much",
        sets: [
          { id: 's3-1', weight: 18, reps: 10, completed: false },
          { id: 's3-2', weight: 18, reps: 8, completed: false },
          { id: 's3-3', weight: 16, reps: 10, completed: false }
        ]
      },
      {
        id: 'e4',
        name: "Tricep Pushdown (Cable)",
        targetReps: "3 sets of 12 reps",
        notes: "Focus on peak contraction",
        sets: [
          { id: 's4-1', weight: 25, reps: 12, completed: false },
          { id: 's4-2', weight: 25, reps: 12, completed: false },
          { id: 's4-3', weight: 20, reps: 15, completed: false }
        ]
      }
    ]
  }
];

export const initialNutrition: Nutrition = {
  calories: { current: 1420, target: 2200 },
  protein: { current: 86, target: 140 },
  carbs: { current: 150, target: 240 },
  fat: { current: 42, target: 70 },
  waterIntakeLiters: 1.8,
  waterTargetLiters: 2.5
};

export const initialHydration: HydrationData = {
  targetMl: 2500,
  consumedMl: 1800,
  entries: [
    { id: 'hyt-1', amountMl: 500, timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'hyt-2', amountMl: 500, timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'hyt-3', amountMl: 500, timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 'hyt-4', amountMl: 300, timestamp: new Date(Date.now() - 3600000 * 1).toISOString() },
  ]
};

export const initialMeals: Meal[] = [
  {
    id: 'm1',
    name: "Breakfast",
    time: "08:15 AM",
    items: [
      { name: "3 Whole Eggs", calories: 215, protein: 18, carbs: 1.8, fat: 15 },
      { name: "2 Chapatis", calories: 240, protein: 6, carbs: 48, fat: 2 },
      { name: "Large Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 }
    ],
    totalCalories: 560,
    totalProtein: 25.3,
    totalCarbs: 76.8,
    totalFat: 17.3
  },
  {
    id: 'm2',
    name: "Lunch",
    time: "01:30 PM",
    items: [
      { name: "Chicken Breast (150g)", calories: 247, protein: 46, carbs: 0, fat: 6 },
      { name: "White Rice (1.5 cups)", calories: 300, protein: 6, carbs: 65, fat: 0.5 },
      { name: "Mixed Vegetables & Olive Oil", calories: 120, protein: 2, carbs: 8, fat: 9 }
    ],
    totalCalories: 667,
    totalProtein: 54,
    totalCarbs: 73,
    totalFat: 15.5
  },
  {
    id: 'm3',
    name: "Dinner",
    time: "08:00 PM",
    items: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  },
  {
    id: 'm4',
    name: "Snacks",
    time: "04:30 PM",
    items: [
      { name: "Almonds (20g)", calories: 116, protein: 4.2, carbs: 4, fat: 10 },
      { name: "Black Coffee", calories: 2, protein: 0.2, carbs: 0.3, fat: 0 }
    ],
    totalCalories: 118,
    totalProtein: 4.4,
    totalCarbs: 4.3,
    totalFat: 10
  }
];

export const initialHabits: Habit[] = [
  {
    id: 'h1',
    name: "Workout Routine",
    icon: "Dumbbell",
    streak: 5,
    weeklyHistory: { Mon: true, Tue: true, Wed: false, Thu: true, Fri: true, Sat: false, Sun: false },
    currentCompleted: true
  },
  {
    id: 'h2',
    name: "Protein Target",
    icon: "Beef",
    streak: 3,
    weeklyHistory: { Mon: true, Tue: false, Wed: true, Thu: true, Fri: false, Sat: false, Sun: false },
    currentCompleted: false
  },
  {
    id: 'h3',
    name: "Water Intake (2.5L+)",
    icon: "GlassWater",
    streak: 12,
    weeklyHistory: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
    currentCompleted: true
  },
  {
    id: 'h4',
    name: "8,000 Steps",
    icon: "Footprints",
    streak: 0,
    weeklyHistory: { Mon: false, Tue: true, Wed: true, Thu: false, Fri: false, Sat: false, Sun: false },
    currentCompleted: false
  },
  {
    id: 'h5',
    name: "7+ Hours Sleep",
    icon: "Moon",
    streak: 4,
    weeklyHistory: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: false, Sat: false, Sun: false },
    currentCompleted: true
  }
];

export const initialProgress: ProgressMeasurement = {
  weightHistory: [
    { date: "Aug 10", value: 76.5 },
    { date: "Aug 17", value: 75.9 },
    { date: "Aug 24", value: 75.1 },
    { date: "Aug 31", value: 74.8 },
    { date: "Sep 07", value: 74.2 }
  ],
  chest: [
    { date: "Aug 10", value: 102.5 },
    { date: "Sep 07", value: 104.0 }
  ],
  waist: [
    { date: "Aug 10", value: 86.0 },
    { date: "Sep 07", value: 84.2 }
  ],
  arms: [
    { date: "Aug 10", value: 36.5 },
    { date: "Sep 07", value: 37.2 }
  ],
  thighs: [
    { date: "Aug 10", value: 58.0 },
    { date: "Sep 07", value: 57.5 }
  ],
  strengthProgression: [
    {
      exerciseName: "Bench Press 1RM",
      history: [
        { date: "Aug 10", oneRepMax: 75 },
        { date: "Aug 24", oneRepMax: 78 },
        { date: "Sep 07", oneRepMax: 82 }
      ]
    },
    {
      exerciseName: "Squat 1RM",
      history: [
        { date: "Aug 10", oneRepMax: 90 },
        { date: "Aug 24", oneRepMax: 95 },
        { date: "Sep 07", oneRepMax: 100 }
      ]
    }
  ]
};

export const initialFridayMessages: FridayMessage[] = [
  {
    id: 'f1',
    sender: 'friday',
    text: "Good morning, Jagadeesh. Systems are fully loaded. Your primary objective today is complete protein synthesis. Push day is scheduled.",
    timestamp: "07:05 AM",
    category: 'info'
  },
  {
    id: 'f2',
    sender: 'user',
    text: "What should I focus on?",
    timestamp: "06:15 PM"
  },
  {
    id: 'f3',
    sender: 'friday',
    text: "Your workout is complete, but you are currently 54g short of your protein target. I highly prioritize a high-protein dinner tonight to ensure optimal muscular recovery.",
    timestamp: "06:16 PM",
    category: 'nutrition'
  }
];

export const mockAiAnswers: { [key: string]: string } = {
  "how am i doing?": "Your systems are running optimally, Jagadeesh. You've achieved 100% hydration and completed your core Push Day workout in 45 minutes. Your overall progress score is 82/100, hampered only by the remaining 54g of protein and 1,800 steps. Let's finish today's mission.",
  "what should i eat?": "Based on your remaining macronutrient requirement (54g Protein, 90g Carbs, 28g Fat), I recommend a meal consisting of 200g Grilled Chicken Breast or 250g Paneer, paired with 1 cup cooked brown rice and steamed broccoli. This will supply approximately 480 kcal and 50g of clean protein.",
  "what is today's workout?": "Today is **Push Day**. Your target duration is 45 minutes, focusing on chest, shoulders, and triceps. We have completed 3 of 4 exercises: Bench Press (complete), Incline Dumbbell Press (complete), and Shoulder Press (complete). You have 1 remaining exercise: Tricep Cable Pushdown (3 sets of 12 reps). Let's finalize it.",
  "analyze my week": "Looking at your 7-day diagnostics: Workout consistency is at 100% of scheduled sessions. Water intake has been flawlessly maintained. However, your protein target was only met on 3 out of 5 tracked days. Your body weight has dropped from 74.8 kg to 74.2 kg, a healthy 0.6 kg decline.",
  "motivate me": "Jagadeesh, discipline is the ultimate operating system for the body. Motivation gets you to the launchpad; consistency carries you into orbit. Your body is responsive and adapting — the data proves you are stronger today than you were 30 days ago. Let's finish the remaining protein target and win the night."
};
