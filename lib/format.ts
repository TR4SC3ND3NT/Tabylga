// Exchange rate mock — 1 USD = 89 KGS (KICB rate, updated daily in prod)
const USD_TO_KGS = 89;

// ── Phone ─────────────────────────────────────────────────────
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // +996 XXX XXX XXX
  if (digits.startsWith('996') && digits.length === 12) {
    return `+996 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  // Generic: insert spaces every 3 digits after country code
  return `+${digits}`;
}

// ── Currency ──────────────────────────────────────────────────
interface FormatCurrencyOptions {
  decimals?: number;
  showCode?: boolean;
}

export function formatUSD(amount: number, opts: FormatCurrencyOptions = {}): string {
  const { decimals = 0, showCode = false } = opts;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showCode ? `$${formatted} USD` : `$${formatted}`;
}

export function formatKGS(amount: number, opts: FormatCurrencyOptions = {}): string {
  const { decimals = 0, showCode = true } = opts;
  const formatted = Math.round(amount).toLocaleString('ru-RU');
  return showCode ? `${formatted} KGS` : formatted;
}

export function usdToKgs(usd: number): number {
  return Math.round(usd * USD_TO_KGS);
}

export function kgsToUsd(kgs: number): number {
  return kgs / USD_TO_KGS;
}

/** Shows both currencies: "$45 · 4 005 KGS" */
export function formatDualCurrency(usd: number): string {
  return `${formatUSD(usd)} · ${formatKGS(usdToKgs(usd))}`;
}

// ── Date ──────────────────────────────────────────────────────
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(ts: number | Date, opts?: { includeYear?: boolean }): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  if (opts?.includeYear) {
    return `${day} ${month} ${d.getFullYear()}`;
  }
  return `${day} ${month}`;
}

export function formatDateRange(startTs: number, endTs: number): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  }
  return `${formatDate(startTs)} – ${formatDate(endTs)}`;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

// ── Text ──────────────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k reviews`;
  return `${count} reviews`;
}
