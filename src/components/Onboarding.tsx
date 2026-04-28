import { useState } from "react";
import { ArrowRight, Check, MapPin, Plane, Utensils, Hotel, Sparkles, Dumbbell, Mountain, Salad, Beef, Fish, Cookie, Leaf, Soup, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category, FoodPref, OnboardingState } from "@/types";

interface Props {
  onComplete: (state: OnboardingState) => void;
}

const FOOD_OPTIONS: { id: FoodPref; label: string; Icon: typeof Salad }[] = [
  { id: "cheese", label: "Cheese", Icon: Cookie },
  { id: "salads", label: "Salads", Icon: Salad },
  { id: "meat", label: "Meat", Icon: Beef },
  { id: "seafood", label: "Seafood", Icon: Fish },
  { id: "vegan", label: "Vegan", Icon: Leaf },
  { id: "buffet", label: "Buffet", Icon: Soup },
  { id: "street-food", label: "Street food", Icon: ChefHat },
  { id: "fine-dining", label: "Fine dining", Icon: Sparkles },
];

const CATEGORY_OPTIONS: { id: Category; label: string; Icon: typeof Utensils }[] = [
  { id: "restaurant", label: "Restaurants", Icon: Utensils },
  { id: "hotel", label: "Hotels", Icon: Hotel },
  { id: "spa", label: "Spa", Icon: Sparkles },
  { id: "gym", label: "Gyms", Icon: Dumbbell },
  { id: "attraction", label: "Attractions", Icon: Mountain },
];

const STEPS = ["Origin", "Destination", "Tastes", "Categories"] as const;

const Onboarding = ({ onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [foodPrefs, setFoodPrefs] = useState<FoodPref[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const toggleFood = (id: FoodPref) =>
    setFoodPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleCat = (id: Category) =>
    setCategories((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const canContinue =
    (step === 0 && origin.trim().length > 1) ||
    (step === 1 && destination.trim().length > 1) ||
    (step === 2 && foodPrefs.length > 0) ||
    (step === 3 && categories.length > 0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete({ origin, destination, foodPrefs, categories });
  };

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-8 sm:px-8">
      {/* Progress dots */}
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 pb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 rounded-full transition-smooth",
                i === step ? "w-8 bg-primary shadow-glow" : i < step ? "w-2 bg-primary" : "w-2 bg-muted",
              )}
            />
          </div>
        ))}
      </div>

      <section className="mx-auto max-w-2xl">
        <header className="animate-fade-up text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {step === 0 && "Where are you traveling from?"}
            {step === 1 && "Where to next?"}
            {step === 2 && "What do you love to eat?"}
            {step === 3 && "What are you in the mood for?"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
            {step === 0 && "We tailor distance, currency and tips to your trip."}
            {step === 1 && "Tell us your destination — country or city."}
            {step === 2 && "Pick everything that sounds good. You can change this later."}
            {step === 3 && "We'll surface the best places for what you love."}
          </p>
        </header>

        <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          {step === 0 && (
            <div className="glass-strong mx-auto flex max-w-md items-center gap-3 rounded-3xl p-2 pl-5">
              <Plane className="h-5 w-5 shrink-0 text-primary" />
              <Input
                autoFocus
                placeholder="e.g. London, United Kingdom"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-14 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
            </div>
          )}

          {step === 1 && (
            <div className="glass-strong mx-auto flex max-w-md items-center gap-3 rounded-3xl p-2 pl-5">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <Input
                autoFocus
                placeholder="e.g. Limassol, Cyprus"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-14 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FOOD_OPTIONS.map(({ id, label, Icon }) => {
                const active = foodPrefs.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleFood(id)}
                    className={cn(
                      "group relative aspect-square rounded-3xl p-4 text-left transition-smooth",
                      active ? "glass-strong shadow-glow ring-2 ring-primary" : "glass hover:shadow-card",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2 flex h-10 w-10 items-center justify-center rounded-2xl transition-smooth",
                        active ? "bg-gradient-primary text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold">{label}</div>
                    {active && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORY_OPTIONS.map(({ id, label, Icon }) => {
                const active = categories.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleCat(id)}
                    className={cn(
                      "group relative rounded-3xl p-5 text-left transition-smooth",
                      active ? "glass-strong shadow-glow ring-2 ring-primary" : "glass hover:shadow-card",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl transition-smooth",
                        active ? "bg-gradient-primary text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold">{label}</div>
                    {active && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-full"
          >
            Back
          </Button>
          <Button
            onClick={next}
            disabled={!canContinue}
            size="lg"
            className="h-14 rounded-full bg-gradient-primary px-8 text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95 hover:shadow-elevated disabled:opacity-40"
          >
            {step === STEPS.length - 1 ? "Discover places" : "Continue"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Onboarding;
