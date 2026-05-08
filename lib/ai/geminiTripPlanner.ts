import { env } from '../env';
import {
  DEFAULT_TRIP_PREFERENCES,
  type BudgetTier,
  type ExperienceKey,
  type InternetComfort,
  type Pace,
  type PlannerActivityLevel,
  type RequirementKey,
  type RoadTolerance,
  type StartPoint,
  type StayPreference,
  type TravelersType,
  type TravelStyle,
  type TripDays,
  type TripPreferences,
} from '../data/tripPlaces';
import type { GeneratedTrip } from '../trip/tripGenerator';

export type AiPlannerRole = 'user' | 'assistant';

export interface AiPlannerMessage {
  id: string;
  role: AiPlannerRole;
  text: string;
  createdAt: number;
  suggestions?: string[];
}

export interface AiPlannerResult {
  assistantMessage: string;
  preferencePatch: Partial<TripPreferences>;
  missingDetails: string[];
  suggestions: string[];
  readyToGenerate: boolean;
  source: 'gemini' | 'local';
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_COOLDOWN_DEFAULT_MS = 45_000;
let geminiDisabledUntil = 0;

const ALLOWED = {
  days: [3, 5, 7, 10, 14],
  startPoint: ['manas_airport', 'bishkek', 'osh', 'issyk_kul', 'not_sure'],
  travelersType: ['solo', 'couple', 'family', 'friends', 'colleagues'],
  travelStyles: ['relax', 'adventure', 'cultural_discovery', 'food_local_life', 'business', 'family_trip', 'digital_nomad', 'premium_comfort'],
  budgetTier: ['budget', 'standard', 'comfort', 'premium'],
  stayPreference: ['hotels_only', 'guesthouse_ok', 'yurt_ok', 'remote_basic_ok'],
  pace: ['relaxed', 'balanced', 'packed'],
  activityLevel: ['easy', 'light', 'moderate', 'hard'],
  roadTolerance: ['low', 'medium', 'high'],
  internetComfort: ['prefer_internet', 'offline_ok', 'remote_ok_if_worth_it'],
  experiences: ['museums_history', 'bazaars_local_life', 'nomadic_culture', 'local_food', 'mountain_views', 'lakes_canyons', 'horse_riding', 'hot_springs', 'shopping_crafts', 'photography_spots', 'nightlife', 'light_hiking'],
  requirements: ['halal', 'vegetarian', 'vegan', 'wheelchair', 'family_friendly', 'no_alcohol', 'prayer_friendly', 'english_guide', 'chinese_guide', 'arabic_guide', 'none'],
} as const;

function compactTrip(trip: GeneratedTrip | null) {
  if (!trip) return null;
  return {
    title: trip.title,
    days: trip.days,
    travelerCount: trip.travelerCount,
    budgetTier: trip.budgetTier,
    totalCost: trip.totalCost,
    costPerPerson: trip.costPerPerson,
    regions: trip.regions,
    dailyPlans: trip.dailyPlans.map((day) => ({
      day: day.day,
      region: day.region,
      stay: day.stay.name,
      transport: day.transport.name,
      food: day.food.name,
      activities: day.activities.map((activity) => activity.name),
      estimatedCost: day.estimatedCost,
    })),
  };
}

function systemPrompt() {
  return [
    'You are Tabylga AI, a Kyrgyzstan travel planner inside a mobile app.',
    'Turn natural Russian, Kyrgyz, or English trip requests into structured preferences for the app.',
    'Use only the allowed enum values. Never invent hotels, prices, currencies, or IDs.',
    'The local app will calculate the actual itinerary and budget from verified local datasets after your patch.',
    'If the user adds missing details later, update only the relevant preferences and explain what changed.',
    'Treat unspecified values conservatively: default startPoint not_sure, budget standard, pace balanced, roadTolerance medium.',
    'Use preferencePatch keys only from TripPreferences: days, startPoint, travelersType, travelerCount, travelStyles, budgetTier, stayPreference, pace, activityLevel, roadTolerance, internetComfort, experiences, requirements.',
    'Never use alternative keys such as duration, number_of_travelers, people, budget, interests, or region.',
    'If the localParserPatch in context already extracted days, budget or travelers, preserve those exact keys unless the latest user text clearly changes them.',
    'If the user gives enough core details (days or destination/theme plus budget or travelers), set readyToGenerate true; missingDetails should contain only genuinely missing required details.',
    'For mountain requests prefer adventure, mountain_views, lakes_canyons, light_hiking; use hard only for explicit extreme trekking.',
    'For tight budgets prefer budget, shared/basic options, and avoid premium comfort.',
    'Reply in the same language as the user when possible.',
    'Return strict valid JSON only, with no markdown, no duplicate keys, no trailing commas, and this exact top-level shape:',
    '{"assistantMessage":"string","preferencePatch":{},"missingDetails":["string"],"suggestions":["string"],"readyToGenerate":true}',
    `Allowed values: ${JSON.stringify(ALLOWED)}.`,
  ].join('\n');
}

function browserGeminiProxy() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/api/gemini`;
}

function geminiProxyUrl() {
  return env.gemini.proxyUrl || browserGeminiProxy();
}

function cooldownFromMessage(message: string) {
  if (/leaked|reported as leaked/i.test(message)) return 24 * 60 * 60 * 1000;
  const retry = message.match(/retry in\s+([\d.]+)s/i);
  if (retry) return Math.ceil(Number(retry[1]) * 1000) + 1000;
  if (/quota|rate|429|too many/i.test(message)) return 30_000;
  return GEMINI_COOLDOWN_DEFAULT_MS;
}

function rememberGeminiFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  geminiDisabledUntil = Date.now() + cooldownFromMessage(message);
}

async function callGemini(contents: GeminiContent[], systemInstructionText: string) {
  if (Date.now() < geminiDisabledUntil) throw new Error('Gemini is cooling down.');

  const proxyUrl = geminiProxyUrl();
  if (!proxyUrl) throw new Error('Gemini proxy is not configured.');

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      systemInstruction: { parts: [{ text: systemInstructionText }] },
      contents,
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? `Gemini request failed (${response.status}).`;
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini response was not JSON.');
    return JSON.parse(match[0]);
  }
}

function isOneOf<T extends readonly unknown[]>(value: unknown, allowed: T): value is T[number] {
  return allowed.includes(value as never);
}

function cleanPatch(input: unknown): Partial<TripPreferences> {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const patch: Partial<TripPreferences> = {};

  if (isOneOf(raw.days, ALLOWED.days)) patch.days = raw.days as TripDays;
  if (isOneOf(raw.startPoint, ALLOWED.startPoint)) patch.startPoint = raw.startPoint as StartPoint;
  if (isOneOf(raw.travelersType, ALLOWED.travelersType)) patch.travelersType = raw.travelersType as TravelersType;
  if (typeof raw.travelerCount === 'number' && Number.isFinite(raw.travelerCount)) patch.travelerCount = Math.max(1, Math.min(Math.round(raw.travelerCount), 5));
  if (isOneOf(raw.budgetTier, ALLOWED.budgetTier)) patch.budgetTier = raw.budgetTier as BudgetTier;
  if (isOneOf(raw.stayPreference, ALLOWED.stayPreference)) patch.stayPreference = raw.stayPreference as StayPreference;
  if (isOneOf(raw.pace, ALLOWED.pace)) patch.pace = raw.pace as Pace;
  if (isOneOf(raw.activityLevel, ALLOWED.activityLevel)) patch.activityLevel = raw.activityLevel as PlannerActivityLevel;
  if (isOneOf(raw.roadTolerance, ALLOWED.roadTolerance)) patch.roadTolerance = raw.roadTolerance as RoadTolerance;
  if (isOneOf(raw.internetComfort, ALLOWED.internetComfort)) patch.internetComfort = raw.internetComfort as InternetComfort;

  if (Array.isArray(raw.travelStyles)) {
    const values = raw.travelStyles.filter((value): value is TravelStyle => isOneOf(value, ALLOWED.travelStyles));
    if (values.length) patch.travelStyles = Array.from(new Set(values));
  }
  if (Array.isArray(raw.experiences)) {
    const values = raw.experiences.filter((value): value is ExperienceKey => isOneOf(value, ALLOWED.experiences));
    if (values.length) patch.experiences = Array.from(new Set(values));
  }
  if (Array.isArray(raw.requirements)) {
    const values = raw.requirements.filter((value): value is RequirementKey => isOneOf(value, ALLOWED.requirements));
    if (values.length) patch.requirements = values.includes('none') && values.length > 1 ? values.filter((item) => item !== 'none') : Array.from(new Set(values));
  }

  return patch;
}

function dollarsFromText(text: string) {
  const dollar = text.match(/(?:\$|usd|доллар|долларов|бакс)[^\d]{0,8}(\d{2,5})|(\d{2,5})\s*(?:\$|usd|доллар|долларов|бакс)/i);
  if (dollar) return Number(dollar[1] ?? dollar[2]);

  const budget = text.match(/(?:бюджет|budget|примерно|около|around|до)\D{0,12}(\d{2,5})/i);
  if (budget) return Number(budget[1]);

  const som = text.match(/(\d{4,7})\s*(?:сом|kgs|kgs)/i);
  if (som) return Math.round(Number(som[1]) / 90);

  return null;
}

function budgetTierFromAmount(amount: number | null): BudgetTier | null {
  if (!amount || !Number.isFinite(amount)) return null;
  if (amount <= 300) return 'budget';
  if (amount <= 600) return 'standard';
  if (amount <= 1200) return 'comfort';
  return 'premium';
}

function localPatchFromText(text: string, current: TripPreferences): Partial<TripPreferences> {
  const lower = text.toLowerCase();
  const patch: Partial<TripPreferences> = {};

  const dayMatch = lower.match(/(\d{1,2})\s*(?:дн|день|дня|дней|day|days)/);
  const numericDays = dayMatch ? Number(dayMatch[1]) : lower.includes('недел') || lower.includes('week') ? 7 : lower.includes('выходн') || lower.includes('weekend') ? 3 : null;
  if (numericDays) {
    const closest = [...ALLOWED.days].reduce((best, value) => Math.abs(value - numericDays) < Math.abs(best - numericDays) ? value : best, 5);
    patch.days = closest as TripDays;
  }

  const budget = budgetTierFromAmount(dollarsFromText(lower));
  if (budget) patch.budgetTier = budget;
  if (/дешев|эконом|недорог|budget|cheap|доступн/.test(lower)) patch.budgetTier = 'budget';
  if (/комфорт|comfort|удобн/.test(lower)) patch.budgetTier = patch.budgetTier === 'budget' ? 'standard' : 'comfort';
  if (/премиум|люкс|premium|luxury/.test(lower)) patch.budgetTier = 'premium';

  if (/семь|семья|дет|family|kids/.test(lower)) {
    patch.travelersType = 'family';
    patch.travelStyles = Array.from(new Set([...(current.travelStyles ?? []), 'family_trip']));
    patch.requirements = Array.from(new Set([...(current.requirements.filter((item) => item !== 'none') ?? []), 'family_friendly']));
  } else if (/пар|couple|вдвоем|вдвоём|2 человека/.test(lower)) {
    patch.travelersType = 'couple';
    patch.travelerCount = 2;
  } else if (/друз|friends|компан/.test(lower)) {
    patch.travelersType = 'friends';
    const count = lower.match(/(\d)\s*(?:человек|людей|traveler|people)/);
    if (count) patch.travelerCount = Number(count[1]);
  } else if (/коллег|work|business|делов/.test(lower)) {
    patch.travelersType = 'colleagues';
  } else if (/один|одна|solo|сам/.test(lower)) {
    patch.travelersType = 'solo';
    patch.travelerCount = 1;
  }

  if (/манас|airport|аэропорт/.test(lower)) patch.startPoint = 'manas_airport';
  if (/бишкек|bishkek/.test(lower)) patch.startPoint = 'bishkek';
  if (/\bош\b|osh/.test(lower)) patch.startPoint = 'osh';
  if (/иссык|issyk|kul|куль/.test(lower)) patch.startPoint = 'issyk_kul';

  const styles = new Set(current.travelStyles);
  const experiences = new Set(current.experiences);
  if (/гор|mountain|trek|поход|хайк|hiking|ущель|canyon|lake|озер|озёр/.test(lower)) {
    styles.add('adventure');
    experiences.add('mountain_views');
    experiences.add('lakes_canyons');
    experiences.add('light_hiking');
    patch.activityLevel = /экстрим|сложн|hard|extreme|trek/.test(lower) ? 'hard' : 'light';
    patch.roadTolerance = /далеко|remote|сон.?к[уү]л|song/.test(lower) ? 'high' : 'medium';
    patch.internetComfort = /без интернета|offline|remote/.test(lower) ? 'remote_ok_if_worth_it' : current.internetComfort;
  }
  if (/еда|food|кафе|ресторан|базар|рынок|местн/.test(lower)) {
    styles.add('food_local_life');
    experiences.add('local_food');
    experiences.add('bazaars_local_life');
  }
  if (/культур|истор|музе|culture|history|nomad|юрта|yurt/.test(lower)) {
    styles.add('cultural_discovery');
    experiences.add('museums_history');
    experiences.add('nomadic_culture');
  }
  if (/отдох|релакс|спокой|chill|relax/.test(lower)) {
    styles.add('relax');
    patch.pace = 'relaxed';
    patch.activityLevel = patch.activityLevel ?? 'easy';
  }
  if (/работ|wifi|wi-fi|интернет|digital|business/.test(lower)) {
    styles.add(/business|делов|работа/.test(lower) ? 'business' : 'digital_nomad');
    patch.internetComfort = 'prefer_internet';
  }
  if (/лошад|horse/.test(lower)) experiences.add('horse_riding');
  if (/горяч|источник|spring|spa/.test(lower)) experiences.add('hot_springs');
  if (/фото|photo|instagram/.test(lower)) experiences.add('photography_spots');
  if (/ночн|nightlife|бар/.test(lower)) experiences.add('nightlife');

  if (/юрта|yurt/.test(lower)) patch.stayPreference = 'yurt_ok';
  if (/отел|hotel/.test(lower)) patch.stayPreference = 'hotels_only';
  if (/гест|guest/.test(lower)) patch.stayPreference = 'guesthouse_ok';
  if (/удален|remote|basic|палат/.test(lower)) patch.stayPreference = 'remote_basic_ok';

  const requirements = new Set(current.requirements.filter((item) => item !== 'none'));
  if (/халал|halal/.test(lower)) requirements.add('halal');
  if (/вегетариан|vegetarian/.test(lower)) requirements.add('vegetarian');
  if (/vegan|веган/.test(lower)) requirements.add('vegan');
  if (/инвалид|wheelchair/.test(lower)) requirements.add('wheelchair');
  if (/англ|english/.test(lower)) requirements.add('english_guide');
  if (requirements.size) patch.requirements = Array.from(requirements);

  if (styles.size) patch.travelStyles = Array.from(styles);
  if (experiences.size) patch.experiences = Array.from(experiences);

  return patch;
}

function missingDetails(preferences: TripPreferences, userText: string, hasTrip: boolean) {
  if (hasTrip) return [];
  const lower = userText.toLowerCase();
  const missing: string[] = [];
  if (!/бюджет|budget|\$|usd|доллар|сом|дешев|эконом|premium|comfort|комфорт/.test(lower) && preferences.budgetTier === DEFAULT_TRIP_PREFERENCES.budgetTier) missing.push('бюджет');
  if (!/один|одна|solo|пар|couple|сем|family|друз|friends|человек|traveler|people/.test(lower) && preferences.travelersType === DEFAULT_TRIP_PREFERENCES.travelersType) missing.push('кто едет');
  return missing;
}

function localSuggestions(preferences: TripPreferences) {
  const suggestions = ['Сделай дешевле', 'Добавь горы', 'Поменяй на 7 дней'];
  if (preferences.budgetTier === 'budget') suggestions[0] = 'Чуть комфортнее';
  if (!preferences.experiences.includes('horse_riding')) suggestions.push('Добавь прогулку на лошадях');
  if (preferences.stayPreference !== 'yurt_ok') suggestions.push('Хочу одну ночь в юрте');
  return suggestions.slice(0, 3);
}

function localResult(text: string, currentPreferences: TripPreferences, currentTrip: GeneratedTrip | null): AiPlannerResult {
  const patch = cleanPatch(localPatchFromText(text, currentPreferences));
  const next = { ...currentPreferences, ...patch };
  const missing = missingDetails(next, text, !!currentTrip);
  const changed = Object.keys(patch).length > 0;
  const budgetLabel = next.budgetTier === 'budget' ? '$100-300' : next.budgetTier === 'standard' ? '$300-600' : next.budgetTier === 'comfort' ? '$600-1200' : '$1200+';
  const summary = `${next.days} дней, ${next.travelerCount} ${next.travelerCount === 1 ? 'человек' : 'чел.'}, ${budgetLabel}`;
  return {
    assistantMessage: changed
      ? `Готово. Пересчитал маршрут: ${summary}. Можно открыть план или уточнить, что поменять.`
      : 'Напишите, какой отдых нужен: горы, озера, даты, бюджет, кто едет и уровень активности. Я соберу маршрут и потом смогу его менять по вашим уточнениям.',
    preferencePatch: patch,
    missingDetails: missing,
    suggestions: localSuggestions(next),
    readyToGenerate: changed,
    source: 'local',
  };
}

export async function runAiPlannerTurn(params: {
  userText: string;
  messages: AiPlannerMessage[];
  preferences: TripPreferences;
  currentTrip: GeneratedTrip | null;
}): Promise<AiPlannerResult> {
  const local = localResult(params.userText, params.preferences, params.currentTrip);

  try {
    const recentMessages = params.messages.slice(-10).map((message) => ({
      role: message.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: message.text }],
    }));
    const context = {
      currentPreferences: params.preferences,
      currentTrip: compactTrip(params.currentTrip),
      localParserPatch: local.preferencePatch,
      latestUserText: params.userText,
    };
    const text = await callGemini(
      [
        ...recentMessages,
        {
          role: 'user',
          parts: [{ text: `Planner context:\n${JSON.stringify(context)}\n\nUpdate the trip from the latest user text.` }],
        },
      ],
      systemPrompt(),
    );
    const parsed = parseJsonObject(text);
    const preferencePatch = cleanPatch(parsed.preferencePatch);
    const mergedPatch = Object.keys(preferencePatch).length ? preferencePatch : local.preferencePatch;
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item: unknown): item is string => typeof item === 'string').slice(0, 4)
      : local.suggestions;

    return {
      assistantMessage: typeof parsed.assistantMessage === 'string' && parsed.assistantMessage.trim()
        ? parsed.assistantMessage.trim()
        : local.assistantMessage,
      preferencePatch: mergedPatch,
      missingDetails: Array.isArray(parsed.missingDetails)
        ? parsed.missingDetails.filter((item: unknown): item is string => typeof item === 'string').slice(0, 4)
        : local.missingDetails,
      suggestions: suggestions.length ? suggestions : local.suggestions,
      readyToGenerate: Boolean(parsed.readyToGenerate) || local.readyToGenerate || Object.keys(mergedPatch).length > 0,
      source: 'gemini',
    };
  } catch (error) {
    rememberGeminiFailure(error);
    return local;
  }
}

export async function transcribePlannerAudio(base64Audio: string, mimeType: string) {
  try {
    const text = await callGemini(
      [{
        role: 'user',
        parts: [
          { text: 'Transcribe this travel-planning voice note exactly. Return JSON only: {"text":"transcript"}.' },
          { inlineData: { mimeType, data: base64Audio } },
        ],
      }],
      'You transcribe short voice notes for a travel planner. Keep the user language. Return JSON only.',
    );
    const parsed = parseJsonObject(text);
    return typeof parsed.text === 'string' ? parsed.text.trim() : '';
  } catch (error) {
    rememberGeminiFailure(error);
    throw error;
  }
}
