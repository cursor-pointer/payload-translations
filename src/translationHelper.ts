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
    // Convert to camelCase to match common Payload naming conventions
    const fieldName = key
      .replace(/[^a-zA-Z0-9\s]+/g, '') // Remove special chars but keep spaces
      .split(/\s+/) // Split on spaces
      .map((word, index) => {
        const lower = word.toLowerCase()
        // First word lowercase, rest capitalize first letter
        return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
      })
      .join('')

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
 * Simple plural selector based on Intl.PluralRules
 * Returns 'zero', 'one', 'two', 'few', 'many', or 'other'
 */
function getPluralForm(count: number, locale: string): string {
  const pluralRules = new Intl.PluralRules(locale)
  return pluralRules.select(count)
}

/**
 * Sprintf-style interpolation for WPML familiarity
 * Supports: %s (string), %d/%i (integer), %f (float)
 *
 * @example
 * sprintfInterpolate("Hello %s", ["John"]) // "Hello John"
 * sprintfInterpolate("Total: %d items", [5]) // "Total: 5 items"
 */
function sprintfInterpolate(template: string, values: any[]): string {
  let index = 0
  return template.replace(/%([sdifu])/g, (match, type) => {
    if (index >= values.length) return match

    const value = values[index++]

    switch (type) {
      case 's':
        return String(value)
      case 'd':
      case 'i':
        return String(Math.floor(Number(value)))
      case 'f':
      case 'u':
        return String(Number(value))
      default:
        return match
    }
  })
}

/**
 * ICU MessageFormat-style interpolation
 * Supports:
 * - Simple variables: "Hello {name}" with { name: 'John' }
 * - Pluralization: "{count, plural, one {# item} other {# items}}" with { count: 5 }
 */
function icuInterpolate(
  template: string,
  variables: Record<string, any> = {},
  locale: string = 'en',
): string {
  return template.replace(/\{([^}]+)\}/g, (match, expression) => {
    const parts = expression.split(',').map((p: string) => p.trim())
    const varName = parts[0]

    // Simple variable replacement
    if (parts.length === 1) {
      return variables[varName] !== undefined ? String(variables[varName]) : match
    }

    // Pluralization: {count, plural, one {...} other {...}}
    if (parts[1] === 'plural' && variables[varName] !== undefined) {
      const count = Number(variables[varName])
      const pluralForm = getPluralForm(count, locale)

      // Parse plural forms: "one {# item} other {# items}"
      const formsText = parts.slice(2).join(',').trim()
      const formRegex = /(\w+)\s*\{([^}]+)\}/g
      const forms: Record<string, string> = {}

      let formMatch
      while ((formMatch = formRegex.exec(formsText)) !== null) {
        forms[formMatch[1]] = formMatch[2]
      }

      // Get the matching form, fallback to 'other'
      const selectedForm = forms[pluralForm] || forms.other || match

      // Replace # with the count
      return selectedForm.replace(/#/g, String(count))
    }

    return match
  })
}

/**
 * Universal interpolation function that auto-detects format
 * - Array values → sprintf style (%s, %d, %f)
 * - Object values → ICU MessageFormat style ({name}, {count, plural, ...})
 */
function interpolate(
  template: string,
  variables: Record<string, any> | any[] = {},
  locale: string = 'en',
): string {
  // Detect format based on variables type
  if (Array.isArray(variables)) {
    return sprintfInterpolate(template, variables)
  }

  return icuInterpolate(template, variables, locale)
}

/**
 * Translation function that automatically collects missing strings
 *
 * Supports both ICU MessageFormat and sprintf-style interpolation:
 *
 * ICU MessageFormat (object):
 * - t('Welcome {name}', 'HomePage', { name: 'John' })
 * - t('{count, plural, one {# item} other {# items}}', 'Cart', { count: 5 })
 *
 * Sprintf-style (array):
 * - t('Welcome %s', 'HomePage', ['John'])
 * - t('Total: %d items', 'Cart', [5])
 *
 * Usage patterns:
 * 1. Direct key: t('Submit') - looks for translations.submit
 * 2. ICU with context: t('Welcome {name}', 'HomePage', { name: 'John' })
 * 3. ICU without context: t('Welcome {name}', { name: 'John' })
 * 4. Sprintf with context: t('Welcome %s', 'HomePage', ['John'])
 * 5. Sprintf without context: t('Welcome %s', ['John'])
 */
export function createTranslationHelper(translations: Translations, locale: string = 'en') {
  return function t(
    key: string,
    contextOrVars?: string | Record<string, any> | any[],
    vars?: Record<string, any> | any[],
  ): string {
    // Parse arguments (context is optional)
    let context = 'General'
    let variables: Record<string, any> | any[] = {}

    if (typeof contextOrVars === 'string') {
      context = contextOrVars
      variables = vars || {}
    } else if (contextOrVars !== undefined) {
      variables = contextOrVars
    }

    // Try to find in translations object
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      // Try camelCase version
      const camelKey = k
        .replace(/\s+/g, '')
        .replace(/^(.)/, (m) => m.toLowerCase())
        .replace(/\s(.)/g, (m) => m.toUpperCase())

      value = value?.[camelKey]
      if (value === undefined) break
    }

    // If found and not empty, interpolate and return it
    if (typeof value === 'string' && value.trim() !== '') {
      return interpolate(value, variables, locale)
    }

    // In development, collect missing translations
    if (process.env.NODE_ENV === 'development') {
      collectMissingTranslation(key, context)
    }

    // Return the key with interpolation as fallback (like i18next)
    return interpolate(key, variables, locale)
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
  style: 'full' | 'long' | 'medium' | 'short' = 'long',
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
  options?: Intl.NumberFormatOptions,
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
  currency: string = 'EUR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}
