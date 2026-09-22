import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  Hotel as HotelIcon,
  Dumbbell,
  Mountain,
  Loader2,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLACES } from "@/data/places";
import { fetchPlaces, matchScore, whyRecommended } from "@/lib/places-api";
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

  // Live places for the destination (OpenStreetMap). Falls back to the curated demo set.
  const live = useQuery({
    queryKey: ["places", onboarding.destination, [...onboarding.categories].sort().join("+")],
    queryFn: () => fetchPlaces(onboarding.destination, onboarding.categories),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const usingFallback = live.isError || (live.isSuccess && live.data.places.length === 0);
  const livePlaces = live.data?.places;
  const basePlaces = useMemo<Place[]>(
    () => (usingFallback ? PLACES : (livePlaces ?? [])),
    [usingFallback, livePlaces],
  );
  const destinationLabel = live.data?.destination.label ?? onboarding.destination ?? "Your destination";

  const enriched = useMemo(() => {
    // Apply "why we recommend" + personal match based on onboarding
    return basePlaces.map((p) => ({
      ...p,
      match: p.match ?? matchScore(p, onboarding.foodPrefs, onboarding.categories),
      whyRecommended: p.whyRecommended ?? whyRecommended(p, onboarding.foodPrefs, onboarding.categories),
    }));
  }, [basePlaces, onboarding]);

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
      if (sort === "rating") return (b.rating ?? (b.quality ?? 0) / 2) - (a.rating ?? (a.quality ?? 0) / 2);
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "price") return a.priceLevel - b.priceLevel;
      return (b.match ?? 0) - (a.match ?? 0) || a.distanceKm - b.distanceKm;
    });
    return list;
  }, [enriched, tab, query, showFavoritesOnly, favorites, sort]);

  return (
    <main className="relative min-h-screen pb-16">
      {/* Header */}
      <header className="px-5 pt-7 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your trip</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <MapPin className="h-6 w-6 text-primary" />
              {destinationLabel}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              From {onboarding.origin || "home"} ·{" "}
              {live.isPending
                ? "finding places…"
                : usingFallback
                  ? "showing demo places"
                  : `${basePlaces.length} live places · curated for you`}
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
        {usingFallback && (
          <div className="glass mb-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {live.isError
                ? `Couldn't load live places for “${onboarding.destination}” — ${live.error instanceof Error ? live.error.message : "network error"}.`
                : `No places found near “${onboarding.destination}” yet.`}{" "}
              Showing our curated demo set instead.
            </span>
            <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => live.refetch()}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}
        {live.isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-strong animate-pulse overflow-hidden rounded-3xl">
                <div className="aspect-[4/3] bg-secondary" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/3 rounded bg-secondary" />
                  <div className="h-3 w-1/3 rounded bg-secondary" />
                  <div className="h-3 w-full rounded bg-secondary" />
                </div>
              </div>
            ))}
            <p className="col-span-full flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Asking OpenStreetMap about {onboarding.destination}…
            </p>
          </div>
        ) : filtered.length === 0 ? (
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
