export const NBKR_DAILY_RATES_URL = 'https://www.nbkr.kg/XML/daily.xml';
export const FALLBACK_USD_TO_KGS_RATE = 87.5;

export type ExchangeRateSource = 'NBKR' | 'FALLBACK';

export interface ExchangeRateResult {
  rate: number;
  source: ExchangeRateSource;
  date: string;
  fetchedAt: string;
  isFallback: boolean;
}

export function parseNbkrRateXml(xml: string): Pick<ExchangeRateResult, 'rate' | 'date'> {
  const dateMatch = xml.match(/<CurrencyRates\b[^>]*\bDate="([^"]+)"/i);
  const usdMatch = xml.match(/<Currency\b[^>]*\bISOCode="USD"[^>]*>([\s\S]*?)<\/Currency>/i);

  if (!usdMatch) {
    throw new Error('USD currency block was not found in NBKR response.');
  }

  const valueMatch = usdMatch[1].match(/<Value>\s*([^<]+?)\s*<\/Value>/i);
  if (!valueMatch) {
    throw new Error('USD rate value was not found in NBKR response.');
  }

  const normalized = valueMatch[1].trim().replace(',', '.');
  const rate = Number(normalized);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('USD rate value from NBKR is invalid.');
  }

  return {
    rate,
    date: dateMatch?.[1] ?? new Date().toISOString(),
  };
}

function fallbackRate(): ExchangeRateResult {
  return {
    rate: FALLBACK_USD_TO_KGS_RATE,
    source: 'FALLBACK',
    date: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    isFallback: true,
  };
}

export async function getUsdToKgsRate(): Promise<ExchangeRateResult> {
  try {
    const response = await fetch(NBKR_DAILY_RATES_URL);
    if (!response.ok) {
      throw new Error(`NBKR request failed with status ${response.status}.`);
    }

    const xml = await response.text();
    const parsed = parseNbkrRateXml(xml);

    return {
      ...parsed,
      source: 'NBKR',
      fetchedAt: new Date().toISOString(),
      isFallback: false,
    };
  } catch (error) {
    console.warn('[exchangeRateService] NBKR rate unavailable, using fallback.', error);
    return fallbackRate();
  }
}
