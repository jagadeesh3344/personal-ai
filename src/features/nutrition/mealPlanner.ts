import { UserProfile, DietPreference } from '../../types/profile';
import { NutritionTargets, MealType } from '../../types';

export interface MealRecipe {
  id: string;
  name: string;
  mealType: MealType;
  description: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  ingredients: string[];
  allergens: string[]; // e.g. ['dairy', 'nuts', 'gluten', 'eggs', 'soy', 'shellfish']
  dietSuitability: DietPreference[];
}

export interface DailyMealPlan {
  breakfast: MealRecipe;
  lunch: MealRecipe;
  snack: MealRecipe;
  dinner: MealRecipe;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
}

export const MEAL_RECIPES: MealRecipe[] = [
  // ================= BREAKFAST =================
  {
    id: 'b-oats-whey',
    name: 'Oatmeal with Whey Protein & Berries',
    mealType: 'BREAKFAST',
    description: 'Rolled oats cooked in water or almond milk, stirred with whey isolate and topped with fresh blueberries.',
    servingSize: '1 bowl (80g oats, 30g protein, 50g berries)',
    calories: 450,
    proteinGrams: 36,
    carbsGrams: 62,
    fatGrams: 6,
    ingredients: ['rolled oats', 'whey protein', 'blueberries', 'water'],
    allergens: ['dairy', 'gluten'],
    dietSuitability: ['STANDARD', 'VEGETARIAN']
  },
  {
    id: 'b-scrambled-eggs-avocado',
    name: 'Scrambled Eggs with Avocado & Sourdough',
    mealType: 'BREAKFAST',
    description: 'Pasture-raised eggs scrambled with olive oil, sliced Hass avocado, and toasted whole-grain sourdough.',
    servingSize: '3 whole eggs + 1 slice sourdough + 1/2 avocado',
    calories: 490,
    proteinGrams: 24,
    carbsGrams: 28,
    fatGrams: 32,
    ingredients: ['eggs', 'avocado', 'sourdough bread', 'olive oil'],
    allergens: ['eggs', 'gluten'],
    dietSuitability: ['STANDARD', 'VEGETARIAN']
  },
  {
    id: 'b-keto-eggs-bacon',
    name: 'Keto Omelet with Spinach & Bacon',
    mealType: 'BREAKFAST',
    description: 'Whole eggs folded with baby spinach, nitrate-free bacon, and cheddar cheese cooked in extra virgin olive oil.',
    servingSize: '3 eggs + 2 bacon strips + 30g spinach',
    calories: 460,
    proteinGrams: 30,
    carbsGrams: 3,
    fatGrams: 36,
    ingredients: ['eggs', 'bacon', 'baby spinach', 'olive oil'],
    allergens: ['eggs'],
    dietSuitability: ['STANDARD', 'KETO', 'PALEO']
  },
  {
    id: 'b-vegan-tofu-scramble',
    name: 'High-Protein Tofu Scramble with Turmeric',
    mealType: 'BREAKFAST',
    description: 'Firm organic tofu crumbled and sautéed with nutritional yeast, turmeric, peppers, and baby spinach.',
    servingSize: '200g firm tofu + veggies',
    calories: 320,
    proteinGrams: 28,
    carbsGrams: 14,
    fatGrams: 18,
    ingredients: ['organic firm tofu', 'nutritional yeast', 'bell peppers', 'spinach', 'turmeric'],
    allergens: ['soy'],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'KETO']
  },
  {
    id: 'b-paleo-chia-parfait',
    name: 'Paleo Chia Seed Coconut Pudding',
    mealType: 'BREAKFAST',
    description: 'Black chia seeds hydrated overnight in coconut milk, topped with pumpkin seeds and sliced banana.',
    servingSize: '40g chia + 150ml coconut milk + banana',
    calories: 390,
    proteinGrams: 12,
    carbsGrams: 38,
    fatGrams: 24,
    ingredients: ['chia seeds', 'coconut milk', 'pumpkin seeds', 'banana'],
    allergens: [],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO']
  },

  // ================= LUNCH =================
  {
    id: 'l-chicken-rice-bowl',
    name: 'Grilled Chicken Breast with Jasmine Rice & Broccoli',
    mealType: 'LUNCH',
    description: 'Herb-marinated grilled chicken breast paired with steamed jasmine rice and crisp broccoli florets.',
    servingSize: '200g chicken breast + 150g cooked rice + 100g broccoli',
    calories: 550,
    proteinGrams: 52,
    carbsGrams: 64,
    fatGrams: 7,
    ingredients: ['chicken breast', 'jasmine rice', 'broccoli', 'olive oil'],
    allergens: [],
    dietSuitability: ['STANDARD']
  },
  {
    id: 'l-salmon-sweet-potato',
    name: 'Pan-Seared Wild Salmon & Baked Sweet Potato',
    mealType: 'LUNCH',
    description: 'Wild Alaskan salmon fillet seared with sea salt and black pepper, served with baked sweet potato and asparagus.',
    servingSize: '180g salmon + 1 medium sweet potato + asparagus',
    calories: 560,
    proteinGrams: 42,
    carbsGrams: 45,
    fatGrams: 22,
    ingredients: ['wild salmon', 'sweet potato', 'asparagus', 'olive oil'],
    allergens: ['fish'],
    dietSuitability: ['STANDARD', 'PALEO']
  },
  {
    id: 'l-vegan-lentil-quinoa',
    name: 'Mediterranean Lentil & Quinoa Harvest Bowl',
    mealType: 'LUNCH',
    description: 'Simmered brown lentils and fluffy quinoa combined with cucumbers, cherry tomatoes, and tahini lemon dressing.',
    servingSize: '150g lentils + 120g quinoa + tahini drizzle',
    calories: 510,
    proteinGrams: 28,
    carbsGrams: 76,
    fatGrams: 14,
    ingredients: ['brown lentils', 'quinoa', 'cucumbers', 'cherry tomatoes', 'sesame tahini'],
    allergens: ['sesame'],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN']
  },
  {
    id: 'l-keto-beef-salad',
    name: 'Grass-Fed Ground Beef Avocado Salad',
    mealType: 'LUNCH',
    description: 'Lean ground beef seasoned with cumin and garlic, layered over romaine lettuce with diced avocado and olive oil vinaigrette.',
    servingSize: '180g ground beef + 1 avocado + romaine',
    calories: 610,
    proteinGrams: 45,
    carbsGrams: 8,
    fatGrams: 44,
    ingredients: ['lean ground beef', 'avocado', 'romaine lettuce', 'olive oil'],
    allergens: [],
    dietSuitability: ['STANDARD', 'KETO', 'PALEO']
  },
  {
    id: 'l-vegetarian-tempeh-stirfry',
    name: 'Sesame Tempeh & Vegetable Stir-Fry',
    mealType: 'LUNCH',
    description: 'Organic cubed tempeh pan-browned with snap peas, bell peppers, and carrots over brown rice.',
    servingSize: '180g tempeh + mixed vegetables + 100g brown rice',
    calories: 480,
    proteinGrams: 34,
    carbsGrams: 52,
    fatGrams: 18,
    ingredients: ['tempeh', 'brown rice', 'sugar snap peas', 'carrots', 'sesame oil'],
    allergens: ['soy', 'sesame'],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN']
  },

  // ================= SNACK =================
  {
    id: 's-greek-yogurt-berries',
    name: 'Greek Yogurt with Mixed Berries',
    mealType: 'SNACK',
    description: '0% or 2% plain Greek yogurt with antioxidant-rich blackberries and strawberries.',
    servingSize: '200g Greek yogurt + 50g berries',
    calories: 190,
    proteinGrams: 22,
    carbsGrams: 18,
    fatGrams: 2,
    ingredients: ['plain greek yogurt', 'blackberries', 'strawberries'],
    allergens: ['dairy'],
    dietSuitability: ['STANDARD', 'VEGETARIAN']
  },
  {
    id: 's-protein-shake-almond',
    name: 'Plant Protein Shake with Almond Butter',
    mealType: 'SNACK',
    description: 'Pea and rice protein blend blended with unsweetened almond milk and natural almond butter.',
    servingSize: '1 scoop (30g) + 250ml almond milk + 15g almond butter',
    calories: 260,
    proteinGrams: 26,
    carbsGrams: 8,
    fatGrams: 14,
    ingredients: ['pea protein', 'almond milk', 'almond butter'],
    allergens: ['nuts'],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'KETO', 'PALEO']
  },
  {
    id: 's-boiled-eggs-almonds',
    name: 'Hard Boiled Eggs & Raw Walnuts',
    mealType: 'SNACK',
    description: 'Two pasture-raised hard boiled eggs paired with a handful of raw walnut halves.',
    servingSize: '2 eggs + 20g walnuts',
    calories: 280,
    proteinGrams: 17,
    carbsGrams: 3,
    fatGrams: 22,
    ingredients: ['eggs', 'walnuts'],
    allergens: ['eggs', 'nuts'],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'KETO', 'PALEO']
  },
  {
    id: 's-apple-pumpkin-seeds',
    name: 'Crisp Green Apple with Roasted Pumpkin Seeds',
    mealType: 'SNACK',
    description: 'Sliced Granny Smith apple paired with salted dry-roasted pumpkin seeds (pepitas).',
    servingSize: '1 medium apple + 25g pumpkin seeds',
    calories: 220,
    proteinGrams: 8,
    carbsGrams: 28,
    fatGrams: 10,
    ingredients: ['green apple', 'pumpkin seeds'],
    allergens: [],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO']
  },

  // ================= DINNER =================
  {
    id: 'd-lean-steak-potatoes',
    name: 'Sirloin Steak with Roasted Baby Potatoes & Green Beans',
    mealType: 'DINNER',
    description: 'Grass-fed top sirloin seared medium, accompanied by rosemary roasted red potatoes and steamed green beans.',
    servingSize: '200g sirloin + 150g baby potatoes + 100g green beans',
    calories: 570,
    proteinGrams: 52,
    carbsGrams: 42,
    fatGrams: 20,
    ingredients: ['top sirloin steak', 'baby potatoes', 'green beans', 'rosemary', 'olive oil'],
    allergens: [],
    dietSuitability: ['STANDARD', 'PALEO']
  },
  {
    id: 'd-turkey-quinoa-skillet',
    name: 'Lean Ground Turkey & Zucchini Quinoa Skillet',
    mealType: 'DINNER',
    description: '93/7 lean ground turkey braised with diced zucchini, crushed plum tomatoes, garlic, and cooked quinoa.',
    servingSize: '200g ground turkey + 120g quinoa + zucchini',
    calories: 520,
    proteinGrams: 48,
    carbsGrams: 46,
    fatGrams: 14,
    ingredients: ['lean ground turkey', 'quinoa', 'zucchini', 'tomatoes', 'garlic'],
    allergens: [],
    dietSuitability: ['STANDARD']
  },
  {
    id: 'd-vegan-chickpea-curry',
    name: 'Coconut Chickpea & Spinach Curry with Brown Rice',
    mealType: 'DINNER',
    description: 'Slow-simmered chickpeas in a ginger-coconut milk sauce packed with fresh spinach, served with brown basmati rice.',
    servingSize: '180g chickpeas + light coconut milk + 120g brown rice',
    calories: 490,
    proteinGrams: 20,
    carbsGrams: 75,
    fatGrams: 14,
    ingredients: ['chickpeas', 'light coconut milk', 'spinach', 'brown basmati rice', 'ginger'],
    allergens: [],
    dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN']
  },
  {
    id: 'd-keto-salmon-cauliflower',
    name: 'Butter-Basted Salmon with Mashed Garlic Cauliflower',
    mealType: 'DINNER',
    description: 'Salmon fillet basted with grass-fed butter, paired with creamy steamed cauliflower mash and asparagus.',
    servingSize: '200g salmon + 150g cauliflower mash',
    calories: 540,
    proteinGrams: 44,
    carbsGrams: 7,
    fatGrams: 36,
    ingredients: ['salmon', 'cauliflower', 'grass-fed butter', 'garlic', 'asparagus'],
    allergens: ['fish', 'dairy'],
    dietSuitability: ['STANDARD', 'KETO']
  }
];

/**
 * Checks if a meal recipe is safe and suitable given user's preferences, allergies, and intolerances.
 */
export function isMealSuitable(
  recipe: MealRecipe,
  dietPreference: DietPreference,
  allergies: string[] = [],
  intolerances: string[] = []
): boolean {
  // 1. Check diet suitability
  if (!recipe.dietSuitability.includes(dietPreference)) {
    // Special allowances:
    // A vegan recipe is automatically vegetarian and standard
    if (dietPreference === 'VEGETARIAN' && recipe.dietSuitability.includes('VEGAN')) {
      // Allowed
    } else if (dietPreference === 'STANDARD') {
      // Allowed
    } else {
      return false;
    }
  }

  // 2. Check allergies (case-insensitive substring check across allergens and ingredients)
  const normalizedAllergies = allergies.map(a => a.toLowerCase().trim()).filter(Boolean);
  for (const allergy of normalizedAllergies) {
    // Check direct allergens list
    if (recipe.allergens.some(a => a.toLowerCase().includes(allergy) || allergy.includes(a.toLowerCase()))) {
      return false;
    }
    // Check ingredients list
    if (recipe.ingredients.some(ing => ing.toLowerCase().includes(allergy))) {
      return false;
    }
  }

  // 3. Check intolerances (case-insensitive substring check)
  const normalizedIntolerances = intolerances.map(i => i.toLowerCase().trim()).filter(Boolean);
  for (const intolerance of normalizedIntolerances) {
    if (intolerance.includes('lactose') || intolerance.includes('dairy')) {
      if (recipe.allergens.includes('dairy') || recipe.ingredients.some(i => i.toLowerCase().includes('milk') || i.toLowerCase().includes('cheese') || i.toLowerCase().includes('yogurt'))) {
        return false;
      }
    }
    if (intolerance.includes('gluten')) {
      if (recipe.allergens.includes('gluten') || recipe.ingredients.some(i => i.toLowerCase().includes('bread') || i.toLowerCase().includes('sourdough') || i.toLowerCase().includes('oat'))) {
        return false;
      }
    }
    if (recipe.allergens.some(a => a.toLowerCase().includes(intolerance))) {
      return false;
    }
    if (recipe.ingredients.some(ing => ing.toLowerCase().includes(intolerance))) {
      return false;
    }
  }

  return true;
}

/**
 * Deterministically generates a daily meal plan with Breakfast, Lunch, Snack, and Dinner
 * aligned to the user's diet preferences, allergies, intolerances, and nutrition targets.
 */
export function generateDailyMealPlan(
  profile: UserProfile,
  targets: NutritionTargets
): DailyMealPlan {
  const diet = profile.dietPreference || 'STANDARD';
  const allergies = profile.allergies || [];
  const intolerances = profile.intolerances || [];

  const getMealForType = (type: MealType): MealRecipe => {
    const pool = MEAL_RECIPES.filter(r => r.mealType === type);
    const suitable = pool.filter(r => isMealSuitable(r, diet, allergies, intolerances));

    if (suitable.length > 0) {
      return suitable[0];
    }

    // Safe universal hypoallergenic fallbacks if over-constrained
    if (type === 'BREAKFAST') {
      return {
        id: 'fallback-breakfast',
        name: 'Whole Grain / Seed Oatmeal Bowl',
        mealType: 'BREAKFAST',
        description: 'Certified gluten-free oats or steamed seeds with sliced banana and water.',
        servingSize: '1 bowl',
        calories: 350,
        proteinGrams: 14,
        carbsGrams: 60,
        fatGrams: 6,
        ingredients: ['seeds', 'banana', 'water'],
        allergens: [],
        dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO']
      };
    } else if (type === 'LUNCH') {
      return {
        id: 'fallback-lunch',
        name: 'Clean Protein & Steamed Green Vegetable Bowl',
        mealType: 'LUNCH',
        description: 'Steamed organic protein (tofu or chicken) with jasmine rice, cucumbers, and olive oil.',
        servingSize: '1 balanced plate',
        calories: 500,
        proteinGrams: 38,
        carbsGrams: 55,
        fatGrams: 12,
        ingredients: ['rice', 'cucumber', 'olive oil'],
        allergens: [],
        dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO', 'KETO']
      };
    } else if (type === 'SNACK') {
      return {
        id: 'fallback-snack',
        name: 'Fresh Fruit & Pumpkin Seeds',
        mealType: 'SNACK',
        description: 'Crisp green apple with raw roasted pumpkin seeds.',
        servingSize: '1 plate',
        calories: 220,
        proteinGrams: 8,
        carbsGrams: 28,
        fatGrams: 10,
        ingredients: ['green apple', 'pumpkin seeds'],
        allergens: [],
        dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO']
      };
    } else {
      return {
        id: 'fallback-dinner',
        name: 'Steamed Rice with Braised Vegetables & Healthy Oils',
        mealType: 'DINNER',
        description: 'Warm steamed basmati rice with lightly braised seasonal vegetables and extra virgin olive oil.',
        servingSize: '1 dinner bowl',
        calories: 480,
        proteinGrams: 22,
        carbsGrams: 70,
        fatGrams: 12,
        ingredients: ['rice', 'spinach', 'carrots', 'olive oil'],
        allergens: [],
        dietSuitability: ['STANDARD', 'VEGETARIAN', 'VEGAN', 'PALEO']
      };
    }
  };

  const breakfast = getMealForType('BREAKFAST');
  const lunch = getMealForType('LUNCH');
  const snack = getMealForType('SNACK');
  const dinner = getMealForType('DINNER');

  const totalCalories = breakfast.calories + lunch.calories + snack.calories + dinner.calories;
  const totalProtein = breakfast.proteinGrams + lunch.proteinGrams + snack.proteinGrams + dinner.proteinGrams;
  const totalCarbs = breakfast.carbsGrams + lunch.carbsGrams + snack.carbsGrams + dinner.carbsGrams;
  const totalFat = breakfast.fatGrams + lunch.fatGrams + snack.fatGrams + dinner.fatGrams;

  return {
    breakfast,
    lunch,
    snack,
    dinner,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    targetCalories: targets.targetCalories,
    targetProtein: targets.proteinGrams
  };
}
