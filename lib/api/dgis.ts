import { env } from "../env";
import type { Language } from "../strings";
import type { Place } from "./places";

export interface DgisPlace {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
  rating?: number;
  reviewCount?: number;
  ratingCount?: number;
  category?: string;
  description?: string;
  photoUrl?: string;
  photoUrls: string[];
  hasPhotos?: boolean;
  mediaKind?: "2gis_photo" | "unsplash_photo";
}

export interface DgisSearchResult {
  total: number;
  items: DgisPlace[];
}

interface DgisCatalogOptions {
  query?: string;
  city?: string;
  location?: {
    lat: number;
    lon: number;
  };
  radius?: number;
  pageSize?: number;
  sort?: "relevance" | "distance" | "rating" | "name";
  regionId?: number;
  rubricIds?: number[];
  language?: Language;
}

interface DgisRubric {
  id?: unknown;
  name?: unknown;
}

interface DgisReviews {
  rating?: unknown;
  general_rating?: unknown;
  org_rating?: unknown;
  review_count?: unknown;
  general_review_count?: unknown;
  org_review_count?: unknown;
  general_review_count_with_stars?: unknown;
  org_review_count_with_stars?: unknown;
}

interface DgisRawItem {
  id?: unknown;
  name?: unknown;
  address_name?: unknown;
  full_address_name?: unknown;
  description?: unknown;
  purpose_name?: unknown;
  summary?: {
    text?: unknown;
  };
  flags?: {
    photos?: unknown;
  };
  photos?: unknown;
  external_content?: Array<{
    main_photo_url?: unknown;
  }>;
  point?: {
    lat?: unknown;
    lon?: unknown;
  };
  reviews?: DgisReviews;
  rubrics?: DgisRubric[];
}

const DEFAULT_DGIS_FIELDS = [
  "items.point",
  "items.address_name",
  "items.full_address_name",
  "items.reviews",
  "items.rubrics",
  "items.description",
  "items.summary",
  "items.flags",
  "items.photos",
  "items.external_content",
];

export const HOME_SEARCH_LOCATION = {
  lat: 42.8746,
  lon: 74.6122,
} as const;

export const DGIS_BISHKEK_REGION_ID = 112;

export const DGIS_BUSINESS_RUBRICS = {
  hotels: [269, 52681, 111005],
  hotel: [269],
  hostel: [52681],
  guesthouse: [111005],
  food: [164, 161],
  restaurants: [164],
  cafes: [161],
  transport: [533],
  activities: [272, 25108],
} as const;

export function hasDgisKey(): boolean {
  return env.dgis.apiKey.length > 0;
}

export function buildDgisDirectionsUrl(points: Place[]): string {
  const routePoints = points
    .map((point) => `${point.lon},${point.lat}`)
    .join("/");
  return `https://2gis.kg/directions/points/${routePoints}`;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeDgisPlace(item: DgisRawItem): DgisPlace | null {
  return normalizeDgisPlaceForLanguage(item, "en");
}

function normalizeDgisPlaceForLanguage(
  item: DgisRawItem,
  language: Language,
): DgisPlace | null {
  const id = item.id == null ? "" : String(item.id);
  const rawName = typeof item.name === "string" ? item.name.trim() : "";
  const name = localizeDgisName(rawName, item.rubrics, language);
  if (!id || !name) return null;

  const primaryRubric = item.rubrics?.find(
    (rubric) => typeof rubric?.name === "string",
  );
  const category = localizeDgisCategory(primaryRubric, language);
  const address =
    typeof item.full_address_name === "string"
      ? item.full_address_name
      : typeof item.address_name === "string"
        ? item.address_name
        : undefined;
  const lat = toNumber(item.point?.lat);
  const lon = toNumber(item.point?.lon);
  const description =
    typeof item.description === "string" && item.description.trim()
      ? item.description.trim()
      : typeof item.summary?.text === "string" && item.summary.text.trim()
        ? item.summary.text.trim()
        : buildFallbackDescription({
            category:
              typeof item.purpose_name === "string"
                ? localizeKnownDgisTerm(item.purpose_name, language)
                : category,
            address,
            language,
          });
  const externalPhotoUrl = item.external_content?.find(
    (content) => typeof content?.main_photo_url === "string",
  )?.main_photo_url;
  const photoUrls = uniqueUrls([
    ...extractPhotoUrls(item.photos),
    ...(typeof externalPhotoUrl === "string" ? [externalPhotoUrl] : []),
  ]);

  return {
    id,
    name,
    address,
    lat,
    lon,
    rating: toNumber(
      item.reviews?.general_rating ??
        item.reviews?.rating ??
        item.reviews?.org_rating,
    ),
    reviewCount: toNumber(
      item.reviews?.org_review_count ??
        item.reviews?.review_count ??
        item.reviews?.general_review_count,
    ),
    ratingCount: toNumber(
      item.reviews?.org_review_count ??
        item.reviews?.general_review_count ??
        item.reviews?.review_count ??
        item.reviews?.general_review_count_with_stars ??
        item.reviews?.org_review_count_with_stars,
    ),
    category,
    description,
    photoUrl: photoUrls[0],
    photoUrls,
    hasPhotos: item.flags?.photos === true || photoUrls.length > 0,
    mediaKind: photoUrls.length > 0 ? "2gis_photo" : undefined,
  };
}

function extractPhotoUrls(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return isHttpUrl(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((item) => extractPhotoUrls(item));
  if (typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const directKeys = [
    "url",
    "photo_url",
    "preview_url",
    "main_photo_url",
    "src",
    "href",
  ];
  const direct = directKeys.flatMap((key) => {
    const candidate = record[key];
    return typeof candidate === "string" && isHttpUrl(candidate) ? [candidate] : [];
  });

  return [
    ...direct,
    ...Object.entries(record)
      .filter(([key]) => !["url", "href"].includes(key))
      .flatMap(([, nested]) => extractPhotoUrls(nested)),
  ];
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.map((url) => url.trim()).filter(isHttpUrl))];
}

const unsplashCache = new Map<string, Promise<string[]>>();

async function fetchUnsplashPhotoUrls(query: string, perPage: number): Promise<string[]> {
  const cleanQuery = query.trim();
  if (!env.unsplash.accessKey || !cleanQuery) return [];

  const cacheKey = `${cleanQuery}:${perPage}`;
  const cached = unsplashCache.get(cacheKey);
  if (cached) return cached;

  const request = (async () => {
    try {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", cleanQuery);
      url.searchParams.set("per_page", String(Math.min(Math.max(perPage, 1), 12)));
      url.searchParams.set("orientation", "landscape");
      url.searchParams.set("client_id", env.unsplash.accessKey);

      const response = await fetch(url.toString());
      if (!response.ok) return [];

      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      return uniqueUrls(
        results.flatMap((item: unknown) => {
          if (!item || typeof item !== "object") return [];
          const urls = (item as Record<string, unknown>).urls;
          if (!urls || typeof urls !== "object") return [];
          const urlRecord = urls as Record<string, unknown>;
          return [
            typeof urlRecord.regular === "string" ? urlRecord.regular : null,
            typeof urlRecord.small === "string" ? urlRecord.small : null,
          ].filter((url): url is string => typeof url === "string");
        }),
      );
    } catch (error) {
      console.warn("[unsplash] photo search failed", error);
      return [];
    }
  })();

  unsplashCache.set(cacheKey, request);
  return request;
}

function unsplashQueryForPlace(place: DgisPlace): string {
  const text = `${place.category ?? ""} ${place.name}`.toLowerCase();
  if (text.includes("hotel") || text.includes("гостини") || text.includes("мейман") || text.includes("отель")) {
    return "hotel room interior";
  }
  if (text.includes("hostel")) return "hostel room travel";
  if (text.includes("guest") || text.includes("гостев") || text.includes("конок")) {
    return "guest house travel";
  }
  if (text.includes("restaurant") || text.includes("ресторан")) return "restaurant food";
  if (text.includes("cafe") || text.includes("кафе")) return "cafe interior coffee";
  if (text.includes("taxi") || text.includes("такси")) return "taxi car city";
  if (text.includes("tour") || text.includes("тур") || text.includes("travel") || text.includes("agency")) {
    return "kyrgyzstan mountains travel";
  }
  return "kyrgyzstan travel";
}

async function withWorkingPhotos(place: DgisPlace): Promise<DgisPlace> {
  if (place.photoUrls.length > 0) return place;

  const placeQuery = `${place.name} ${place.category ?? ""} Bishkek`;
  const placePhotos = await fetchUnsplashPhotoUrls(placeQuery, 6);
  const photoUrls = placePhotos.length > 0
    ? placePhotos
    : await fetchUnsplashPhotoUrls(unsplashQueryForPlace(place), 6);
  if (photoUrls.length === 0) return place;

  return {
    ...place,
    photoUrl: photoUrls[0],
    photoUrls,
    hasPhotos: true,
    mediaKind: "unsplash_photo",
  };
}

function getDgisLocale(language: Language): string {
  switch (language) {
    case "ky":
      return "ky_KG";
    case "ru":
      return "ru_KG";
    case "ar":
      return "ar_RU";
    default:
      // 2GIS has no en_KG/de_KG/zh_KG locale. ru_KG gives complete KG results;
      // display labels are localized below for unsupported content locales.
      return "ru_KG";
  }
}

function localizeDgisName(
  rawName: string,
  rubrics: DgisRubric[] | undefined,
  language: Language,
): string {
  if (!rawName) return rawName;
  const parts = rawName.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return rawName;

  const suffix = parts.at(-1);
  if (!suffix) return rawName;

  const localizedSuffix = localizeKnownDgisTerm(suffix, language);
  const suffixChanged = localizedSuffix.toLowerCase() !== suffix.toLowerCase();
  if (!suffixChanged) {
    const category = localizeDgisCategory(
      rubrics?.find((rubric) => typeof rubric?.name === "string"),
      language,
    );
    return category ? `${parts.slice(0, -1).join(", ")}, ${category}` : rawName;
  }

  return `${parts.slice(0, -1).join(", ")}, ${localizedSuffix}`;
}

function localizeDgisCategory(
  rubric: DgisRubric | undefined,
  language: Language,
): string | undefined {
  const rubricId = rubric?.id == null ? undefined : String(rubric.id);
  const fromId = rubricId ? DGIS_RUBRIC_LABELS[rubricId]?.[language] : undefined;
  if (fromId) return fromId;

  if (typeof rubric?.name === "string") {
    return localizeKnownDgisTerm(rubric.name, language);
  }

  return undefined;
}

function localizeKnownDgisTerm(term: string, language: Language): string {
  const normalized = term.trim().toLowerCase();
  const labels = DGIS_TERM_LABELS[normalized];
  return labels?.[language] ?? labels?.en ?? term;
}

function buildFallbackDescription({
  category,
  address,
  language,
}: {
  category?: string;
  address?: string;
  language: Language;
}): string {
  const copy = DGIS_DESCRIPTION_COPY[language] ?? DGIS_DESCRIPTION_COPY.en;
  return [
    category,
    address ? `${copy.near} ${address}` : undefined,
    copy.listed,
  ]
    .filter(Boolean)
    .join(" · ");
}

const DGIS_RUBRIC_LABELS: Record<string, Partial<Record<Language, string>>> = {
  "269": { en: "Hotel", ru: "Гостиница", ky: "Мейманкана", ar: "فندق", de: "Hotel", zh: "酒店" },
  "52681": { en: "Hostel", ru: "Хостел", ky: "Хостел", ar: "نُزل", de: "Hostel", zh: "旅舍" },
  "111005": { en: "Guest house", ru: "Гостевой дом", ky: "Конок үй", ar: "بيت ضيافة", de: "Gästehaus", zh: "民宿" },
  "164": { en: "Restaurant", ru: "Ресторан", ky: "Ресторан", ar: "مطعم", de: "Restaurant", zh: "餐厅" },
  "161": { en: "Cafe", ru: "Кафе", ky: "Кафе", ar: "مقهى", de: "Cafe", zh: "咖啡馆" },
  "533": { en: "Taxi", ru: "Такси", ky: "Такси", ar: "تاكسي", de: "Taxi", zh: "出租车" },
  "272": { en: "Travel agency", ru: "Турагентство", ky: "Турагенттик", ar: "وكالة سفر", de: "Reisebüro", zh: "旅行社" },
  "25108": { en: "Active tours", ru: "Активные туры", ky: "Активдүү турлар", ar: "جولات نشطة", de: "Aktivreisen", zh: "户外旅行" },
};

const DGIS_TERM_LABELS: Record<string, Partial<Record<Language, string>>> = {
  "отель": DGIS_RUBRIC_LABELS["269"],
  "гостиница": DGIS_RUBRIC_LABELS["269"],
  "гостиницы": DGIS_RUBRIC_LABELS["269"],
  "мейманкана": DGIS_RUBRIC_LABELS["269"],
  "мейманканалар": DGIS_RUBRIC_LABELS["269"],
  "хостел": DGIS_RUBRIC_LABELS["52681"],
  "хостелы": DGIS_RUBRIC_LABELS["52681"],
  "гостевой дом": DGIS_RUBRIC_LABELS["111005"],
  "аренда коттеджей / гостевых домов": DGIS_RUBRIC_LABELS["111005"],
  "кафе": DGIS_RUBRIC_LABELS["161"],
  "ресторан": DGIS_RUBRIC_LABELS["164"],
  "рестораны": DGIS_RUBRIC_LABELS["164"],
  "такси": DGIS_RUBRIC_LABELS["533"],
  "служба заказа легкового транспорта": DGIS_RUBRIC_LABELS["533"],
  "турагентства": DGIS_RUBRIC_LABELS["272"],
  "туристическая компания": DGIS_RUBRIC_LABELS["272"],
  "туристическое агентство": DGIS_RUBRIC_LABELS["272"],
  "организация активных туров": DGIS_RUBRIC_LABELS["25108"],
};

const DGIS_DESCRIPTION_COPY: Record<Language, { near: string; listed: string }> = {
  en: { near: "near", listed: "listed in 2GIS" },
  ru: { near: "рядом с", listed: "из 2GIS" },
  ky: { near: "дареги", listed: "2GISтен алынган" },
  zh: { near: "靠近", listed: "来自 2GIS" },
  ar: { near: "بالقرب من", listed: "مدرج في 2GIS" },
  de: { near: "bei", listed: "in 2GIS gelistet" },
};

export async function searchDgisCatalog(
  options: DgisCatalogOptions,
): Promise<DgisSearchResult> {
  const query = options.query?.trim();
  if (!env.dgis.apiKey || (!query && !options.rubricIds?.length)) {
    return { total: 0, items: [] };
  }

  try {
    const url = new URL("https://catalog.api.2gis.com/3.0/items");
    const language = options.language ?? "en";
    url.searchParams.set("locale", getDgisLocale(language));
    if (query) {
      url.searchParams.set(
        "q",
        options.city ? `${query}, ${options.city}` : query,
      );
    }
    const maxPageSize = options.rubricIds?.length ? 10 : 50;
    url.searchParams.set("fields", DEFAULT_DGIS_FIELDS.join(","));
    url.searchParams.set(
      "page_size",
      String(Math.min(Math.max(options.pageSize ?? 10, 1), maxPageSize)),
    );
    url.searchParams.set("key", env.dgis.apiKey);
    if (options.regionId) {
      url.searchParams.set("region_id", String(options.regionId));
    }
    if (options.rubricIds?.length) {
      url.searchParams.set("rubric_id", options.rubricIds.join(","));
      url.searchParams.set("type", "branch");
    }
    if (options.sort) url.searchParams.set("sort", options.sort);
    if (options.location) {
      url.searchParams.set(
        "location",
        `${options.location.lon},${options.location.lat}`,
      );
    }
    if (typeof options.radius === "number") {
      url.searchParams.set(
        "radius",
        String(Math.min(Math.max(options.radius, 0), 40000)),
      );
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      console.warn("[2gis] search failed", response.status, response.statusText, body);
      return { total: 0, items: [] };
    }

    const data = await response.json();
    const rawItems: DgisRawItem[] = Array.isArray(data?.result?.items)
      ? data.result.items
      : [];
    const items = rawItems
      .map((item: DgisRawItem) =>
        normalizeDgisPlaceForLanguage(item, language),
      )
      .filter((item): item is DgisPlace => item !== null);

    return {
      total: toNumber(data?.result?.total) ?? rawItems.length,
      items: await Promise.all(items.map(withWorkingPhotos)),
    };
  } catch (error) {
    console.warn("[2gis] search failed", error);
    return { total: 0, items: [] };
  }
}

export async function searchDgisPlaces(
  query: string,
  city = "Бишкек",
  language: Language = "en",
): Promise<DgisPlace[]> {
  const result = await searchDgisCatalog({ query, city, pageSize: 10, language });
  return result.items;
}

export async function getDgisBusinessSection(
  rubricIds: readonly number[],
  pageSize = 6,
  language: Language = "en",
): Promise<DgisSearchResult> {
  return searchDgisCatalog({
    rubricIds: [...rubricIds],
    regionId: DGIS_BISHKEK_REGION_ID,
    location: HOME_SEARCH_LOCATION,
    radius: 25000,
    pageSize,
    sort: "relevance",
    language,
  });
}
