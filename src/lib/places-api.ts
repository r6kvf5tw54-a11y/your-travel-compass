/**
 * Live place data for any city, with no API keys:
 *  - geocoding: Nominatim (OpenStreetMap)
 *  - places:    Overpass API (OpenStreetMap)
 *  - photos:    Wikipedia page images (for places that carry a `wikipedia` tag)
 *
 * Everything is fetched in the browser and cached in localStorage for a day.
 */
import type { Category, FoodPref, Place } from "@/types";
import restaurantImg from "@/assets/place-restaurant.jpg";
import restaurant2Img from "@/assets/place-restaurant2.jpg";
import hotelImg from "@/assets/place-hotel.jpg";
import spaImg from "@/assets/place-spa.jpg";
import gymImg from "@/assets/place-gym.jpg";
import attractionImg from "@/assets/place-attraction.jpg";

export type GeoPoint = { lat: number; lon: number };

export type Destination = GeoPoint & {
  /** Short label, e.g. "Paris, France" */
  label: string;
  city: string;
  country: string;
};

const CACHE_TTL = 24 * 60 * 60 * 1000;
const SEARCH_RADIUS_M = 3500;
const PER_CATEGORY = 24;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/* ---------------- cache ---------------- */

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw) as { t: number; v: T };
    if (Date.now() - t > CACHE_TTL) return null;
    return v;
  } catch {
    return null;
  }
}

function cacheSet(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* quota — ignore */
  }
}

/* ---------------- geocoding ---------------- */

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

export async function geocode(query: string): Promise<Destination> {
  const q = query.trim();
  const key = `ta.geo.${q.toLowerCase()}`;
  const cached = cacheGet<Destination>(key);
  if (cached) return cached;

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&accept-language=en&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const hits = (await res.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) throw new Error(`We couldn't find "${q}". Try a city name like "Rome, Italy".`);

  const a = hit.address ?? {};
  const city =
    a.city || a.town || a.village || a.municipality || a.county || a.state || q.split(",")[0].trim();
  const country = a.country || "";
  const dest: Destination = {
    lat: parseFloat(hit.lat),
    lon: parseFloat(hit.lon),
    city,
    country,
    label: country && city !== country ? `${city}, ${country}` : city,
  };
  cacheSet(key, dest);
  return dest;
}

/* ---------------- Overpass ---------------- */

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const CATEGORY_FILTERS: Record<Category, string[]> = {
  restaurant: [`["amenity"~"^(restaurant|cafe)$"]`],
  hotel: [`["tourism"~"^(hotel|guest_house|hostel|apartment|resort|boutique_hotel)$"]`],
  spa: [`["leisure"~"^(spa|sauna)$"]`, `["amenity"="spa"]`, `["shop"~"^(massage|beauty)$"]`],
  gym: [`["leisure"~"^(fitness_centre|sports_centre|swimming_pool)$"]`],
  attraction: [
    `["tourism"~"^(attraction|museum|viewpoint|gallery|artwork|zoo|aquarium|theme_park)$"]`,
    `["historic"~"^(monument|castle|memorial|ruins|archaeological_site|church|cathedral|palace)$"]`,
  ],
};

function buildQuery(center: GeoPoint, categories: Category[]): string {
  const around = `(around:${SEARCH_RADIUS_M},${center.lat.toFixed(5)},${center.lon.toFixed(5)})`;
  const parts: string[] = [];
  for (const cat of categories) {
    for (const f of CATEGORY_FILTERS[cat]) {
      parts.push(`nwr${f}["name"]${around};`);
    }
  }
  return `[out:json][timeout:25];(${parts.join("")});out tags center ${categories.length * 120};`;
}

async function overpass(query: string): Promise<OsmElement[]> {
  let lastErr: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements: OsmElement[] };
      return json.elements;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Places service unavailable");
}

/* ---------------- mapping OSM → Place ---------------- */

const FALLBACK_IMAGE: Record<Category, string[]> = {
  restaurant: [restaurantImg, restaurant2Img],
  hotel: [hotelImg],
  spa: [spaImg],
  gym: [gymImg],
  attraction: [attractionImg],
};

function categoryOf(t: Record<string, string>): Category | null {
  if (t.amenity === "restaurant" || t.amenity === "cafe") return "restaurant";
  if (t.tourism && /^(hotel|guest_house|hostel|apartment|resort|boutique_hotel)$/.test(t.tourism))
    return "hotel";
  if (t.leisure === "spa" || t.leisure === "sauna" || t.amenity === "spa" || t.shop === "massage" || t.shop === "beauty")
    return "spa";
  if (t.leisure && /^(fitness_centre|sports_centre|swimming_pool)$/.test(t.leisure)) return "gym";
  if (t.tourism || t.historic) return "attraction";
  return null;
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const FOOD_RULES: Array<[FoodPref, RegExp]> = [
  ["seafood", /seafood|fish|sushi|oyster|crab|lobster|ceviche|poke/],
  ["meat", /steak|grill|bbq|barbecue|burger|kebab|churrasc|meat|carne|asado|yakiniku|rotisserie/],
  ["cheese", /cheese|fondue|raclette|pizza|italian|french|tapas|wine/],
  ["salads", /salad|healthy|bowl|juice|organic/],
  ["vegan", /vegan|vegetarian/],
  ["buffet", /buffet|all_you_can_eat|meze|mezze|brunch/],
  ["street-food", /street|kebab|taco|falafel|noodle|dumpling|ramen|food_court|fast_food|pizza|burger/],
  ["fine-dining", /fine_dining|gourmet|gastronom|tasting|michelin|haute/],
];

function foodTagsOf(t: Record<string, string>): FoodPref[] {
  const hay = [t.cuisine, t.description, t.name, t["diet:vegan"] === "yes" ? "vegan" : "", t["diet:vegetarian"] === "yes" ? "vegetarian" : "", t.michelin ? "michelin" : ""]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const out: FoodPref[] = [];
  for (const [pref, re] of FOOD_RULES) if (re.test(hay)) out.push(pref);
  return out;
}

function priceLevelOf(cat: Category, t: Record<string, string>): 1 | 2 | 3 | 4 {
  if (cat === "hotel" && t.stars) {
    const s = parseInt(t.stars, 10);
    if (s >= 5) return 4;
    if (s >= 4) return 3;
    if (s >= 3) return 2;
    return 1;
  }
  if (cat === "attraction") return t.fee === "no" ? 1 : 2;
  if (t.michelin || /fine_dining|gourmet/.test(t.cuisine ?? "")) return 4;
  if (t.amenity === "cafe") return 1;
  return 2;
}

function tagsOf(cat: Category, t: Record<string, string>): string[] {
  const out: string[] = [];
  if (t.cuisine) out.push(...t.cuisine.split(";").slice(0, 3).map((c) => titleCase(c.trim())));
  if (t.stars) out.push(`${t.stars}★ hotel`);
  if (t["diet:vegan"] === "yes") out.push("vegan options");
  if (t["diet:vegetarian"] === "yes") out.push("vegetarian");
  if (t.outdoor_seating === "yes") out.push("terrace");
  if (t.wheelchair === "yes") out.push("accessible");
  if (t.michelin) out.push("Michelin");
  if (t.internet_access && t.internet_access !== "no") out.push("wi-fi");
  if (t.swimming_pool === "yes" || t.leisure === "swimming_pool") out.push("pool");
  if (t.fee === "no") out.push("free entry");
  if (t.tourism === "museum") out.push("museum");
  if (t.tourism === "viewpoint") out.push("viewpoint");
  if (t.historic) out.push(titleCase(t.historic));
  if (t.leisure === "sauna") out.push("sauna");
  if (t.opening_hours?.includes("24/7")) out.push("24/7");
  if (out.length === 0) out.push(titleCase(cat));
  return [...new Set(out)].slice(0, 6);
}

function descriptionOf(cat: Category, t: Record<string, string>, city: string): string {
  if (t.description) return t.description;
  const bits: string[] = [];
  const kind =
    cat === "restaurant"
      ? t.amenity === "cafe"
        ? "Café"
        : t.cuisine
          ? `${titleCase(t.cuisine.split(";")[0])} restaurant`
          : "Restaurant"
      : cat === "hotel"
        ? t.stars
          ? `${t.stars}-star ${titleCase(t.tourism ?? "hotel")}`
          : titleCase(t.tourism ?? "hotel")
        : cat === "spa"
          ? t.leisure === "sauna"
            ? "Sauna"
            : "Spa & wellness"
          : cat === "gym"
            ? t.leisure === "swimming_pool"
              ? "Swimming pool"
              : "Fitness club"
            : titleCase(t.tourism ?? t.historic ?? "attraction");
  bits.push(`${kind} in ${city}`);
  const street = t["addr:street"] ?? t["contact:street"];
  const num = t["addr:housenumber"] ?? t["contact:housenumber"];
  if (street) bits.push(`${num ? num + " " : ""}${street}`);
  if (t.opening_hours) bits.push(`open ${t.opening_hours.replace(/;.*$/, "")}`);
  return bits.join(" · ") + ".";
}

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough data-quality score: richer OSM entries are usually better-known places. */
function richness(t: Record<string, string>) {
  let s = 0;
  if (t.wikipedia || t.wikidata) s += 4;
  if (t.website || t["contact:website"]) s += 2;
  if (t.opening_hours) s += 1;
  if (t.cuisine) s += 1;
  if (t.stars) s += 1;
  if (t.phone || t["contact:phone"]) s += 1;
  if (t.image) s += 2;
  if (t.michelin) s += 3;
  return s;
}

function toPlace(el: OsmElement, dest: Destination): (Place & { _rich: number; _wiki?: string }) | null {
  const t = el.tags ?? {};
  const cat = categoryOf(t);
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!cat || !t.name || lat === undefined || lon === undefined) return null;
  const imgs = FALLBACK_IMAGE[cat];
  const hashed = Math.abs(el.id) % imgs.length;
  const imageTag = t.image && /^https?:\/\//.test(t.image) ? t.image : undefined;
  return {
    id: `${el.type}/${el.id}`,
    name: t.name,
    category: cat,
    city: t["addr:city"] ?? dest.city,
    country: dest.country,
    image: imageTag ?? imgs[hashed],
    description: descriptionOf(cat, t, t["addr:city"] ?? dest.city),
    tags: tagsOf(cat, t),
    foodTags: cat === "restaurant" ? foodTagsOf(t) : undefined,
    priceLevel: priceLevelOf(cat, t),
    distanceKm: haversineKm(dest, { lat, lon }),
    premium: Boolean(t.michelin) || (cat === "hotel" && parseInt(t.stars ?? "0", 10) >= 5),
    lat,
    lon,
    website: t.website ?? t["contact:website"],
    _rich: richness(t),
    _wiki: t.wikipedia,
  };
}

/* ---------------- Wikipedia photos ---------------- */

async function wikiThumbs(titlesByLang: Map<string, string[]>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const jobs: Promise<void>[] = [];
  for (const [lang, titles] of titlesByLang) {
    for (let i = 0; i < titles.length; i += 50) {
      const chunk = titles.slice(i, i + 50);
      const url =
        `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=900&redirects=1&titles=` +
        encodeURIComponent(chunk.join("|"));
      jobs.push(
        fetch(url)
          .then((r) => r.json())
          .then((j: { query?: { pages?: Record<string, { title: string; thumbnail?: { source: string } }>; normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] } }) => {
            const back = new Map<string, string>();
            for (const n of j.query?.normalized ?? []) back.set(n.to, n.from);
            for (const r of j.query?.redirects ?? []) back.set(r.to, back.get(r.from) ?? r.from);
            for (const p of Object.values(j.query?.pages ?? {})) {
              if (!p.thumbnail) continue;
              const original = back.get(p.title) ?? p.title;
              out.set(`${lang}:${original}`, p.thumbnail.source);
              out.set(`${lang}:${p.title}`, p.thumbnail.source);
            }
          })
          .catch(() => undefined),
      );
    }
  }
  await Promise.all(jobs);
  return out;
}

/* ---------------- public API ---------------- */

export type PlacesResult = {
  destination: Destination;
  places: Place[];
  source: "live" | "cache";
};

export async function fetchPlaces(destinationQuery: string, categories: Category[]): Promise<PlacesResult> {
  const cats: Category[] = categories.length ? categories : ["restaurant", "hotel", "spa", "gym", "attraction"];
  const destination = await geocode(destinationQuery);
  const key = `ta.places.${destination.lat.toFixed(3)},${destination.lon.toFixed(3)}.${[...cats].sort().join("+")}`;
  const cached = cacheGet<Place[]>(key);
  if (cached) return { destination, places: cached, source: "cache" };

  const elements = await overpass(buildQuery(destination, cats));
  const mapped = elements.map((e) => toPlace(e, destination)).filter((p): p is NonNullable<typeof p> => p !== null);

  // Dedupe by name+category, keep the richest entry.
  const byKey = new Map<string, (typeof mapped)[number]>();
  for (const p of mapped) {
    const k = `${p.category}|${p.name.toLowerCase()}`;
    const prev = byKey.get(k);
    if (!prev || p._rich > prev._rich) byKey.set(k, p);
  }

  // Keep the best N per category: richer first, then closer.
  const perCat = new Map<Category, (typeof mapped)[number][]>();
  for (const p of byKey.values()) {
    const list = perCat.get(p.category) ?? [];
    list.push(p);
    perCat.set(p.category, list);
  }
  const chosen: (typeof mapped)[number][] = [];
  for (const list of perCat.values()) {
    list.sort((a, b) => b._rich - a._rich || a.distanceKm - b.distanceKm);
    chosen.push(...list.slice(0, PER_CATEGORY));
  }

  // Real photos where Wikipedia knows the place.
  const titlesByLang = new Map<string, string[]>();
  for (const p of chosen) {
    if (!p._wiki || !p._wiki.includes(":")) continue;
    const [lang, ...rest] = p._wiki.split(":");
    if (!/^[a-z]{2,3}$/.test(lang)) continue;
    const list = titlesByLang.get(lang) ?? [];
    list.push(rest.join(":"));
    titlesByLang.set(lang, list);
  }
  if (titlesByLang.size) {
    const thumbs = await wikiThumbs(titlesByLang);
    for (const p of chosen) {
      if (!p._wiki) continue;
      const src = thumbs.get(p._wiki);
      if (src) p.image = src;
    }
  }

  const places: Place[] = chosen.map(({ _rich, _wiki, ...rest }) => ({ ...rest, quality: _rich }));
  cacheSet(key, places);
  return { destination, places, source: "live" };
}

/** 0–100 how well a place fits the traveller's onboarding answers. */
export function matchScore(p: Place, foodPrefs: FoodPref[], categories: Category[]): number {
  let s = 40;
  if (categories.includes(p.category)) s += 15;
  const food = p.foodTags?.filter((f) => foodPrefs.includes(f)).length ?? 0;
  s += Math.min(3, food) * 12;
  s += Math.min(10, p.quality ?? 0) * 1.5;
  if (p.premium) s += 5;
  s -= Math.min(15, p.distanceKm * 2);
  return Math.max(35, Math.min(99, Math.round(s)));
}

export function whyRecommended(p: Place, foodPrefs: FoodPref[], categories: Category[]): string {
  const food = p.foodTags?.filter((f) => foodPrefs.includes(f)) ?? [];
  if (food.length) return `Matches your taste for ${food.slice(0, 2).map((f) => f.replace("-", " ")).join(" & ")}`;
  if (p.tags.includes("Michelin")) return "Michelin-listed — worth the detour";
  if ((p.quality ?? 0) >= 4) return "Well-known spot with a strong reputation";
  if (p.distanceKm < 1) return "Right in the centre — an easy walk";
  if (categories.includes(p.category)) return `A solid ${p.category} pick for this trip`;
  return "Popular with travellers nearby";
}
