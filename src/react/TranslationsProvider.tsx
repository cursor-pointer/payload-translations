'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Translations } from '../server/getTranslations'
import { createTranslationHelper, formatDate, formatNumber, formatCurrency } from '../translationHelper'

interface TranslationsContextValue {
  translations: Translations
  locale: string
  t: (key: string, context?: string) => string
  formatDate: (date: Date | string, style?: 'full' | 'long' | 'medium' | 'short') => string
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number, currency?: string) => string
}

const TranslationsContext = createContext<TranslationsContextValue | undefined>(undefined)

/**
 * Provider for translations in Client Components
 * Pass translations fetched from Server Component
 *
 * @example
 * // In Server Component (layout or page)
 * const translations = await getTranslations(locale)
 * return <TranslationsProvider translations={translations} locale={locale}>{children}</TranslationsProvider>
 */
export function TranslationsProvider({
  translations,
  locale = 'en',
  children,
}: {
  translations: Translations
  locale?: string
  children: React.ReactNode
}) {
  const value = useMemo(() => {
    const t = createTranslationHelper(translations, locale)

    return {
      translations,
      locale,
      t,
      formatDate: (date: Date | string, style?: 'full' | 'long' | 'medium' | 'short') =>
        formatDate(date, locale, style),
      formatNumber: (num: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(num, locale, options),
      formatCurrency: (amount: number, currency?: string) =>
        formatCurrency(amount, locale, currency),
    }
  }, [translations, locale])

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  )
}

/**
 * Hook to use translations in Client Components
 *
 * @example
 * // Direct access to translations object
 * const { translations } = useTranslations()
 * <button>{translations.submit}</button>
 *
 * @example
 * // WPML-style automatic collection
 * const { t } = useTranslations()
 * <button>{t('Submit', 'LoginForm')}</button>
 * <input placeholder={t('Enter your email')} />
 *
 * @example
 * // Locale-aware date formatting
 * const { formatDate } = useTranslations()
 * <time>{formatDate(event.date, 'long')}</time>
 */
export function useTranslations(): TranslationsContextValue {
  const context = useContext(TranslationsContext)
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationsProvider')
  }
  return context
}
