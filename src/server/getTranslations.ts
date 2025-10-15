import { getPayload } from 'payload'
import type { SanitizedConfig } from 'payload'
import { createTranslationHelper, formatDate, formatNumber, formatCurrency } from '../translationHelper'

// Generic interface - users should extend this in their app
export interface Translations {
  [key: string]: string
}

export interface TranslationsHelper {
  /** WPML-style translation function - works the same in server and client */
  t: (key: string, context?: string) => string
  /** Locale-aware date formatting */
  formatDate: (date: Date | string, style?: 'full' | 'long' | 'medium' | 'short') => string
  /** Locale-aware number formatting */
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string
  /** Locale-aware currency formatting */
  formatCurrency: (amount: number, currency?: string) => string
  /** Raw translations object (for direct access if needed) */
  translations: Translations
  /** Current locale */
  locale: string
}

/**
 * Get translations for a specific locale from Payload CMS
 * Works in Server Components and is statically generated at build time
 *
 * @example
 * // In a Server Component - WPML style (recommended)
 * import { getTranslations } from '@cursorpointer/payload-translations/server'
 * import config from '@/payload.config'
 *
 * const { t } = await getTranslations('en', config)
 * <button>{t('Submit', 'LoginForm')}</button>
 *
 * @example
 * // Direct access (if you prefer)
 * const { translations } = await getTranslations('en', config)
 * <h1>{translations.home}</h1>
 */
export async function getTranslations(
  locale: string = 'en',
  config: SanitizedConfig | Promise<SanitizedConfig>,
  slug: string = 'translations'
): Promise<TranslationsHelper> {
  const payload = await getPayload({ config })

  try {
    const translations = await payload.findGlobal({
      slug: slug as any, // Cast to avoid GlobalSlug type constraint
      locale: locale as any, // Cast to avoid Locale union constraint
    })

    const translationsObj = translations as unknown as Translations

    return {
      t: createTranslationHelper(translationsObj, locale),
      formatDate: (date, style) => formatDate(date, locale, style),
      formatNumber: (num, options) => formatNumber(num, locale, options),
      formatCurrency: (amount, currency) => formatCurrency(amount, locale, currency),
      translations: translationsObj,
      locale,
    }
  } catch (error) {
    console.error(`Failed to fetch translations for locale: ${locale}`, error)

    // Return empty translations with fallback helpers
    const emptyTranslations: Translations = {}

    return {
      t: createTranslationHelper(emptyTranslations, locale),
      formatDate: (date, style) => formatDate(date, locale, style),
      formatNumber: (num, options) => formatNumber(num, locale, options),
      formatCurrency: (amount, currency) => formatCurrency(amount, locale, currency),
      translations: emptyTranslations,
      locale,
    }
  }
}
