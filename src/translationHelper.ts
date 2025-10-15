import type { Translations } from './server/getTranslations'

/**
 * Translation helper that mimics WPML's automatic string collection
 *
 * In development: Collects and logs missing translations
 * In production: Returns translation or fallback
 *
 * @example
 * // Wrap any string with t()
 * <button>{t('Submit')}</button>
 * <input placeholder={t('Enter your email')} />
 *
 * Missing translations are logged to console in development
 */

// Store for collecting missing translations in development
const missingTranslations = new Map<string, Set<string>>()

// Debounced logger to avoid spam
let logTimeout: NodeJS.Timeout | null = null

function logMissingTranslations() {
  if (missingTranslations.size === 0) return

  console.group('🌐 Missing Translations Detected')
  console.log('Copy-paste these fields into your translationFields array:\n')

  const fields: string[] = []

  missingTranslations.forEach((contexts, key) => {
    const fieldName = key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, '')       // Remove leading/trailing underscores
      .replace(/_+/g, '_')           // Replace multiple underscores with single

    const fieldConfig = `  {
    name: '${fieldName}',
    type: 'text',
    label: '${key}',
    localized: true,
    // Used in: ${Array.from(contexts).join(', ')}
  }`

    fields.push(fieldConfig)
  })

  console.log(fields.join(',\n'))

  console.groupEnd()
  missingTranslations.clear()
}

function collectMissingTranslation(key: string, context: string) {
  if (!missingTranslations.has(key)) {
    missingTranslations.set(key, new Set())
  }
  missingTranslations.get(key)!.add(context)

  // Debounce logging
  if (logTimeout) clearTimeout(logTimeout)
  logTimeout = setTimeout(logMissingTranslations, 2000)
}

/**
 * Translation function that automatically collects missing strings
 *
 * Usage patterns:
 * 1. Direct key: t('Submit') - looks for translations.submit
 * 2. Nested key: t('forms.submit') - looks for translations.forms.submit
 * 3. With context: t('Submit', 'LoginForm') - helps track where strings are used
 */
export function createTranslationHelper(translations: Translations, locale: string = 'en') {
  return function t(key: string, context: string = 'Unknown'): string {
    // Try to find in translations object
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      // Try camelCase version
      const camelKey = k.replace(/\s+/g, '')
        .replace(/^(.)/, (m) => m.toLowerCase())
        .replace(/\s(.)/g, (m) => m.toUpperCase())

      value = value?.[camelKey]
      if (value === undefined) break
    }

    // If found, return it
    if (typeof value === 'string') {
      return value
    }

    // In development, collect missing translations
    if (process.env.NODE_ENV === 'development') {
      collectMissingTranslation(key, context)
    }

    // Return the key as fallback (like i18next)
    return key
  }
}

/**
 * Date formatting helper that respects locale
 *
 * @example
 * formatDate(new Date(), 'en', 'long') // "January 15, 2025"
 * formatDate(new Date(), 'nl', 'long') // "15 januari 2025"
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en',
  style: 'full' | 'long' | 'medium' | 'short' = 'long'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    short: { year: '2-digit', month: 'numeric', day: 'numeric' },
  }

  const options = optionsMap[style]

  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

/**
 * Number formatting helper that respects locale
 *
 * @example
 * formatNumber(1234.56, 'en') // "1,234.56"
 * formatNumber(1234.56, 'nl') // "1.234,56"
 */
export function formatNumber(
  num: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num)
}

/**
 * Currency formatting helper that respects locale
 *
 * @example
 * formatCurrency(1234.56, 'en', 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'nl', 'EUR') // "€ 1.234,56"
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en',
  currency: string = 'EUR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}
