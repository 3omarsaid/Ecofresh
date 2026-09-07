/**
 * Unified Central Currency Configuration
 * Single Source of Truth for the entire Ecofresh ERP System.
 *
 * ONE SYSTEM | ONE CURRENCY: EGP (Egyptian Pound / جنيه مصري / ج.م)
 */

export const CURRENCY_CONFIG = {
  code: 'EGP',
  symbol: 'ج.م',
  nameAr: 'جنيه مصري',
  nameEn: 'Egyptian Pound',
  standardLocale: 'en-US',
} as const;

export type CurrencyCode = typeof CURRENCY_CONFIG.code;

export interface FormatCurrencyOptions {
  /**
   * Whether to append/prepend the currency symbol (default: true)
   */
  showSymbol?: boolean;

  /**
   * Number of decimal fraction digits (default: 2)
   */
  decimals?: number;

  /**
   * Position of the currency symbol (default: 'suffix')
   */
  symbolPosition?: 'suffix' | 'prefix';

  /**
   * Force displaying positive sign '+' for positive amounts (default: false)
   */
  showSign?: boolean;
}

/**
 * Centrally formats any monetary amount into a clean, consistent Arabic currency display.
 *
 * Handles:
 * - Plain numbers (e.g., 22400 -> "22,400.00 ج.م")
 * - Strings (e.g., "1250.5" -> "1,250.50 ج.م")
 * - Prisma Decimal objects with .toNumber()
 * - null / undefined / NaN / empty strings (safely defaults to "0.00 ج.م")
 *
 * Examples:
 * formatCurrency(22400)                  => "22,400.00 ج.م"
 * formatCurrency(0)                      => "0.00 ج.م"
 * formatCurrency(1250.5, { decimals: 0 }) => "1,251 ج.م"
 * formatCurrency(1250.5, { showSymbol: false }) => "1,250.50"
 * formatCurrency(-500)                   => "-500.00 ج.م"
 * formatCurrency(500, { showSign: true })=> "+500.00 ج.م"
 */
export function formatCurrency(
  amount: number | string | bigint | { toNumber?: () => number; toString?: () => string } | null | undefined,
  options?: FormatCurrencyOptions
): string {
  const {
    showSymbol = true,
    decimals = 2,
    symbolPosition = 'suffix',
    showSign = false,
  } = options || {};

  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? `0.00 ${CURRENCY_CONFIG.symbol}` : '0.00';
  }

  let num: number;
  if (typeof amount === 'number') {
    num = amount;
  } else if (typeof amount === 'bigint') {
    num = Number(amount);
  } else if (typeof amount === 'object' && amount !== null && typeof amount.toNumber === 'function') {
    num = amount.toNumber();
  } else {
    num = Number(amount);
  }

  if (isNaN(num)) {
    return showSymbol ? `0.00 ${CURRENCY_CONFIG.symbol}` : '0.00';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formattedNumber = new Intl.NumberFormat(CURRENCY_CONFIG.standardLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absNum);

  let prefixSign = '';
  if (isNegative) {
    prefixSign = '-';
  } else if (showSign && num > 0) {
    prefixSign = '+';
  }

  if (!showSymbol) {
    return `${prefixSign}${formattedNumber}`;
  }

  if (symbolPosition === 'prefix') {
    return `${prefixSign}${CURRENCY_CONFIG.symbol} ${formattedNumber}`;
  }

  return `${prefixSign}${formattedNumber} ${CURRENCY_CONFIG.symbol}`;
}

/**
 * Safely parses an input value into a clean finite numeric amount.
 * Returns 0 if invalid or empty.
 */
export function parseCurrencyAmount(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  return isFinite(parsed) ? parsed : 0;
}
