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
  rating: number;
  reviews: number;
  premium?: boolean;
  whyRecommended?: string;
}

export interface OnboardingState {
  origin: string;
  destination: string;
  foodPrefs: FoodPref[];
  categories: Category[];
}
