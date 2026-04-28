import { Heart, MapPin, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";

interface Props {
  place: Place;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick?: (place: Place) => void;
}

const priceLabel = (level: number) => "$".repeat(level);

const PlaceCard = ({ place, favorite, onToggleFavorite, onClick }: Props) => {
  return (
    <article
      onClick={() => onClick?.(place)}
      className="group glass-strong relative overflow-hidden rounded-3xl transition-smooth hover:-translate-y-1 hover:shadow-elevated cursor-pointer animate-fade-up"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
        {/* Top row */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {place.premium && (
            <span className="bg-gradient-premium inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground shadow-card">
              <Sparkles className="h-3 w-3" /> Premium
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(place.id);
            }}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-md transition-smooth hover:scale-110 hover:bg-background"
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-smooth",
                favorite ? "fill-destructive text-destructive" : "text-foreground",
              )}
            />
          </button>
        </div>
        {/* Bottom rating chip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-xs font-semibold">{place.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({place.reviews})</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{place.name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{place.city}</span>
              <span>·</span>
              <span>{place.distanceKm.toFixed(1)} km</span>
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary">{priceLabel(place.priceLevel)}</span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{place.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        {place.whyRecommended && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-primary/5 p-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-snug text-foreground/80">
              <span className="font-semibold text-primary">Why we picked this · </span>
              {place.whyRecommended}
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default PlaceCard;
