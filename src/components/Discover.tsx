import { useMemo, useState } from "react";
import { Heart, MapPin, Search, SlidersHorizontal, Sparkles, Utensils, Hotel as HotelIcon, Dumbbell, Mountain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLACES } from "@/data/places";
import PlaceCard from "./PlaceCard";
import PlaceDetails from "./PlaceDetails";
import type { Category, OnboardingState, Place } from "@/types";

interface Props {
  onboarding: OnboardingState;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onRestart: () => void;
}

const CAT_TABS: { id: Category | "all"; label: string; Icon?: typeof Utensils }[] = [
  { id: "all", label: "All", Icon: Sparkles },
  { id: "restaurant", label: "Restaurants", Icon: Utensils },
  { id: "hotel", label: "Hotels", Icon: HotelIcon },
  { id: "spa", label: "Spa", Icon: Sparkles },
  { id: "gym", label: "Gyms", Icon: Dumbbell },
  { id: "attraction", label: "Attractions", Icon: Mountain },
];

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Top rated" },
  { id: "distance", label: "Nearest" },
  { id: "price", label: "Price" },
] as const;

type SortKey = (typeof SORTS)[number]["id"];

const Discover = ({ onboarding, favorites, onToggleFavorite, onRestart }: Props) => {
  const [tab, setTab] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [active, setActive] = useState<Place | null>(null);

  const enriched = useMemo(() => {
    // Apply "why we recommend" personalization based on onboarding
    return PLACES.map((p) => {
      if (p.whyRecommended) return p;
      const matchedFood = p.foodTags?.filter((f) => onboarding.foodPrefs.includes(f)) ?? [];
      if (matchedFood.length) {
        return { ...p, whyRecommended: `Matches your taste for ${matchedFood.slice(0, 2).join(" & ")}` };
      }
      if (onboarding.categories.includes(p.category)) {
        return { ...p, whyRecommended: `One of the best ${p.category}s in the area` };
      }
      return p;
    });
  }, [onboarding]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = enriched.filter((p) => {
      if (tab !== "all" && p.category !== tab) return false;
      if (showFavoritesOnly && !favorites.includes(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "price") return a.priceLevel - b.priceLevel;
      // recommended: matched food prefs first, then rating
      const aScore = (a.foodTags?.filter((f) => onboarding.foodPrefs.includes(f)).length ?? 0) * 2 + a.rating;
      const bScore = (b.foodTags?.filter((f) => onboarding.foodPrefs.includes(f)).length ?? 0) * 2 + b.rating;
      return bScore - aScore;
    });
    return list;
  }, [enriched, tab, query, showFavoritesOnly, favorites, sort, onboarding.foodPrefs]);

  return (
    <main className="relative min-h-screen pb-16">
      {/* Header */}
      <header className="px-5 pt-7 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your trip</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <MapPin className="h-6 w-6 text-primary" />
              {onboarding.destination || "Your destination"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              From {onboarding.origin || "home"} · curated for you
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onRestart}
            className="rounded-full text-xs"
            aria-label="Restart onboarding"
          >
            Edit trip
          </Button>
        </div>

        {/* Search */}
        <div className="mx-auto mt-6 max-w-6xl">
          <div className="glass-strong flex items-center gap-3 rounded-full p-2 pl-5">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Search places, tags, dishes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              variant={showFavoritesOnly ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={cn(
                "rounded-full",
                showFavoritesOnly && "bg-gradient-primary text-primary-foreground shadow-glow",
              )}
              aria-label="Show favorites only"
            >
              <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mx-auto mt-5 max-w-6xl -mx-5 sm:mx-auto">
          <div className="flex gap-2 overflow-x-auto px-5 pb-2 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CAT_TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth",
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "glass-subtle text-foreground hover:shadow-card",
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort row */}
        <div className="mx-auto mt-3 flex max-w-6xl items-center gap-2 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Sort by</span>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-smooth",
                  sort === s.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <section className="mx-auto mt-6 max-w-6xl px-5 sm:px-8">
        {filtered.length === 0 ? (
          <div className="glass mt-10 rounded-3xl p-12 text-center">
            <p className="text-lg font-semibold">No places match yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different category or clear your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((place, i) => (
              <div key={place.id} style={{ animationDelay: `${i * 40}ms` }}>
                <PlaceCard
                  place={place}
                  favorite={favorites.includes(place.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={setActive}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <PlaceDetails
        place={active}
        favorite={active ? favorites.includes(active.id) : false}
        onClose={() => setActive(null)}
        onToggleFavorite={onToggleFavorite}
      />
    </main>
  );
};

export default Discover;
