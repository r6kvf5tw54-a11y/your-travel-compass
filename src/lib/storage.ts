import type { OnboardingState } from "@/types";

const ONBOARDING_KEY = "ta.onboarding";
const FAVORITES_KEY = "ta.favorites";

export function loadOnboarding(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? (JSON.parse(raw) as OnboardingState) : null;
  } catch {
    return null;
  }
}

export function saveOnboarding(state: OnboardingState) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
}

export function clearOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}
