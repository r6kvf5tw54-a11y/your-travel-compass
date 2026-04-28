import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import Onboarding from "@/components/Onboarding";
import Discover from "@/components/Discover";
import {
  loadFavorites,
  loadOnboarding,
  saveFavorites,
  saveOnboarding,
  clearOnboarding,
} from "@/lib/storage";
import type { OnboardingState } from "@/types";
import heroGlobe from "@/assets/hero-globe.jpg";

type Stage = "welcome" | "onboarding" | "discover";

const Index = () => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Hydrate from storage on mount
  useEffect(() => {
    const saved = loadOnboarding();
    if (saved) {
      setOnboarding(saved);
      setStage("discover");
    }
    setFavorites(loadFavorites());
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const handleComplete = (state: OnboardingState) => {
    setOnboarding(state);
    saveOnboarding(state);
    setStage("discover");
  };

  const handleRestart = () => {
    clearOnboarding();
    setOnboarding(null);
    setStage("onboarding");
  };

  const seoTitle = useMemo(() => {
    if (stage === "discover" && onboarding?.destination) {
      return `${onboarding.destination} · Tourist Adventures`;
    }
    return "Tourist Adventures — Premium travel discovery";
  }, [stage, onboarding]);

  useEffect(() => {
    document.title = seoTitle;
    const meta =
      document.querySelector('meta[name="description"]') ?? (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute(
      "content",
      "Personalized recommendations for restaurants, hotels, spas, gyms and attractions — tailored to your tastes.",
    );
  }, [seoTitle]);

  return (
    <>
      <AmbientBackdrop />

      {stage === "welcome" && (
        <Welcome onStart={() => setStage("onboarding")} heroImage={heroGlobe} />
      )}

      {stage === "onboarding" && <Onboarding onComplete={handleComplete} />}

      {stage === "discover" && onboarding && (
        <Discover
          onboarding={onboarding}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onRestart={handleRestart}
        />
      )}
    </>
  );
};

const Welcome = ({ onStart, heroImage }: { onStart: () => void; heroImage: string }) => (
  <main className="relative flex min-h-screen flex-col px-5 pb-10 pt-10 sm:px-8">
    <nav className="mx-auto flex w-full max-w-6xl items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">Tourist Adventures</span>
      </div>
      <Button variant="ghost" className="rounded-full text-sm">
        Sign in
      </Button>
    </nav>

    <section className="mx-auto mt-10 grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 lg:mt-0 lg:grid-cols-2">
      <div className="animate-fade-up text-center lg:text-left">
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Your personal travel concierge
        </span>
        <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Find places <br />
          <span className="text-gradient">you will love.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-muted-foreground sm:text-lg lg:mx-0">
          Tell us your tastes. We curate the best restaurants, hotels, spas and hidden gems in any city — instantly.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
          <Button
            onClick={onStart}
            size="lg"
            className="h-14 w-full rounded-full bg-gradient-primary px-8 text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95 hover:shadow-elevated sm:w-auto"
          >
            Start your journey
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">Free to try · No account needed</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
          {[
            { k: "20K+", v: "Curated places" },
            { k: "120", v: "Cities" },
            { k: "4.9★", v: "User rating" },
          ].map((s) => (
            <div key={s.v} className="glass-subtle rounded-2xl p-3 text-center">
              <div className="font-display text-xl font-bold">{s.k}</div>
              <div className="text-[11px] text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="glass-strong relative overflow-hidden rounded-[2rem] p-3 shadow-elevated">
          <img
            src={heroImage}
            alt="Glowing earth globe with a travel pin floating above clouds"
            width={1536}
            height={1024}
            className="h-auto w-full rounded-3xl object-cover"
          />
          <div className="pointer-events-none absolute inset-3 rounded-3xl ring-1 ring-inset ring-white/40" />
        </div>
      </div>
    </section>
  </main>
);

export default Index;
