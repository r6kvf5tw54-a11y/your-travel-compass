export type Category = "restaurant" | "hotel" | "spa" | "gym" | "attraction";

export type FoodPref =
  | "cheese"
  | "salads"
  | "meat"
  | "seafood"
  | "vegan"
  | "buffet"
  | "street-food"
  | "fine-dining";

export interface Place {
  id: string;
  name: string;
  category: Category;
  city: string;
  country: string;
  image: string;
  description: string;
  tags: string[];
  foodTags?: FoodPref[];
  priceLevel: 1 | 2 | 3 | 4; // $ to $$$$
  distanceKm: number;
  /** Only present for curated (demo) places — live OSM data has no ratings. */
  rating?: number;
  reviews?: number;
  premium?: boolean;
  whyRecommended?: string;
  /** 0–100 personal fit, computed from onboarding answers. */
  match?: number;
  /** How rich the source data is (wikipedia, website, hours…). */
  quality?: number;
  lat?: number;
  lon?: number;
  website?: string;
}

export interface OnboardingState {
  origin: string;
  destination: string;
  foodPrefs: FoodPref[];
  categories: Category[];
}
