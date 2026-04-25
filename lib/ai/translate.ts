import { env } from '../env';
import { translateDemo } from '../backend/demoBackend';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export type TranslationSource = 'text' | 'voice';

export interface TranslateInput {
  text: string;
  targetLang: string;
  source?: TranslationSource;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface TranslateResult {
  translatedText: string;
  detectedLanguage: string;
  source: TranslationSource;
  provider: 'gemini' | 'fallback';
}

function targetName(code: string) {
  const map: Record<string, string> = {
    ru: 'Russian',
    en: 'English',
    ky: 'Kyrgyz',
    de: 'German',
    zh: 'Chinese',
    ar: 'Arabic',
  };
  return map[code] ?? code;
}

function fallback(input: TranslateInput): TranslateResult {
  return {
    translatedText: translateDemo(input.text, input.targetLang),
    detectedLanguage: 'auto',
    source: input.source ?? 'text',
    provider: 'fallback',
  };
}

export async function translateWithGemini(input: TranslateInput): Promise<TranslateResult> {
  const clean = input.text.trim();
  if (!clean && !input.audioBase64) {
    return fallback(input);
  }

  if (!env.gemini.apiKey) {
    return fallback(input);
  }

  const prompt = `You are Tabylga's tourist translator for Kyrgyzstan.
Translate the user's ${input.source === 'voice' ? 'spoken' : 'written'} message into ${targetName(input.targetLang)}.
Preserve meaning, travel context, politeness, names, prices, hotel/taxi/restaurant details, and emergency information.
If the message is already in the target language, rewrite it naturally.
Return strict JSON with keys: translatedText, detectedLanguage.

Text transcript:
${clean || '[audio only]'}`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (input.audioBase64 && input.audioMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.audioMimeType,
        data: input.audioBase64,
      },
    });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${env.gemini.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[translator] Gemini API ${response.status}: ${errText.slice(0, 160)}`);
      return fallback(input);
    }

    const data = await response.json();
    const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textPart) return fallback(input);

    const parsed = JSON.parse(textPart) as Partial<TranslateResult>;
    if (typeof parsed.translatedText !== 'string') return fallback(input);

    return {
      translatedText: parsed.translatedText,
      detectedLanguage: typeof parsed.detectedLanguage === 'string' ? parsed.detectedLanguage : 'auto',
      source: input.source ?? 'text',
      provider: 'gemini',
    };
  } catch (error) {
    console.warn('[translator] Gemini translation failed, using fallback', error);
    return fallback(input);
  }
}
