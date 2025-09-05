// Shared category keys + labels + placeholder options.
// Replace arrays with your real ingredients later.

export type CategoryKey = "fiber" | "protein" | "fat" | "carbs";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  fiber: "Dietary Fiber (50%)",
  protein: "Protein (20%)",
  fat: "Fat (15%)",
  carbs: "Complex Carbohydrates (15%)",
};

// Placeholder items — swap with your real shopping items later.
export const SHOPPING_OPTIONS: Record<CategoryKey, string[]> = {
  fiber: ["Spinach", "Broccoli", "Carrots", "Cucumber", "Lettuce"],
  protein: ["Chicken Breast", "Eggs", "Greek Yogurt", "Tofu", "Lentils"],
  fat: ["Olive Oil", "Avocado", "Almonds", "Tahini", "Walnuts"],
  carbs: ["Brown Rice", "Quinoa", "Oats", "Whole Wheat Pasta", "Sweet Potato"],
};
