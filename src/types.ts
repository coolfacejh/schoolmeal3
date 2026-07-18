export interface School {
  atptCode: string;
  atptName: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  type: string;
}

export interface Meal {
  mealCode: string; // "1": 조식, "2": 중식, "3": 석식
  mealName: string; // "조식", "중식", "석식"
  menu: string[];
  calories: string;
  nutrition: string[];
  origins: string[];
}

export interface MealReviewCache {
  [mealCode: string]: {
    review: string;
    loading: boolean;
    error: string | null;
  };
}
