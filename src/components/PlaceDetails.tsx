import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Heart, MapPin, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";

interface Props {
  place: Place | null;
  favorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

const PlaceDetails = ({ place, favorite, onClose, onToggleFavorite }: Props) => {
  return (
    <Sheet open={!!place} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl border-0 p-0">
        {place && (
          <>
            <div className="relative">
              <img
                src={place.image}
                alt={place.name}
                className="h-72 w-full object-cover"
                loading="lazy"
                width={1024}
                height={768}
              />
              <button
                onClick={() => onToggleFavorite(place.id)}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/85 backdrop-blur-md shadow-card transition-smooth hover:scale-110"
                aria-label="Toggle favorite"
              >
                <Heart className={cn("h-5 w-5", favorite ? "fill-destructive text-destructive" : "")} />
              </button>
            </div>
            <div className="px-6 pb-10 pt-6">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-4">
                  <SheetTitle className="text-2xl font-bold">{place.name}</SheetTitle>
                  <span className="text-base font-semibold text-primary">{"$".repeat(place.priceLevel)}</span>
                </div>
              </SheetHeader>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold text-foreground">{place.rating.toFixed(1)}</span>
                  <span>({place.reviews} reviews)</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {place.city}, {place.country} · {place.distanceKm.toFixed(1)} km away
                </span>
              </div>

              {place.whyRecommended && (
                <div className="mt-5 flex gap-3 rounded-2xl bg-primary/5 p-4">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Why we recommend this</p>
                    <p className="mt-0.5 text-sm text-foreground/80">{place.whyRecommended}</p>
                  </div>
                </div>
              )}

              <p className="mt-5 leading-relaxed text-foreground/80">{place.description}</p>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {place.tags.map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="mt-8 h-14 w-full rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95"
              >
                View on map
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PlaceDetails;
