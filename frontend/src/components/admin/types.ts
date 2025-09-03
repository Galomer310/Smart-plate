export interface User {
  id: string;
  email: string;
  name?: string;

  // basics
  age: number;
  diet_time?: string; // "12 weeks", etc.

  // legacy profile (optional)
  height_profile?: string;
  weight_profile?: string;
  subscription_plan?: string;
  subscription_price?: string;
  training_category?: string;

  // questionnaire (optional)
  height?: string;
  weight?: string;
  q_age?: number;
  allergies?: string;
  program_goal?: string;
  body_improvement?: string;
  medical_issues?: string;
  takes_medications?: string;
  pregnant_or_postpartum?: string;
  menopause_symptoms?: string;
  breakfast_regular?: string;
  digestion_issues?: string;
  snacking_between_meals?: string;
  organized_eating?: string;
  avoid_food_groups?: string;
  water_intake?: string;
  diet_type?: string;
  regular_activity?: string;
  training_place?: string;
  training_frequency?: string;
  activity_type?: string;
  body_feeling?: string;
  sleep_hours?: string;
  submitted_at?: string;

  // extras
  unread_count?: number;
  last_feedback?: string;
}

export type DashboardResponse = { users: User[] };
