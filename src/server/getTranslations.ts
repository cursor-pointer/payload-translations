import { getPayload } from 'payload'
import type { SanitizedConfig } from 'payload'

export interface Translations {
  // Navigation
  home: string
  events: string
  posts: string
  resources: string

  // Search
  search: string
  searchPlaceholder: string
  searchButton: string
  noResults: string

  // Common
  readMore: string
  viewAll: string
  loading: string
  previous: string
  next: string

  // Forms
  submit: string
  required: string
  invalidEmail: string

  // Events
  upcomingEvents: string
  pastEvents: string
  eventDate: string
  location: string

  // Footer
  quickLinks: string
  followUs: string
  visitOur: string
  page: string
}

/**
 * Get translations for a specific locale
 * Works in Server Components and is statically generated at build time
 *
 * @example
 * // In a Server Component
 * const t = await getTranslations('en', config)
 * <h1>{t.home}</h1>
 */
export async function getTranslations(
  locale: 'all' | 'en' | 'nl' | 'es' | 'fr' | 'cat' = 'en',
  config: SanitizedConfig | Promise<SanitizedConfig>
): Promise<Translations> {
  const payload = await getPayload({ config })

  try {
    const translations = await payload.findGlobal({
      slug: 'translations',
      locale,
    })

    return translations as unknown as Translations
  } catch (error) {
    console.error(`Failed to fetch translations for locale: ${locale}`, error)

    // Return fallback English translations
    return {
      // Navigation
      home: 'Home',
      events: 'Events',
      posts: 'Posts',
      resources: 'Resources',

      // Search
      search: 'Search',
      searchPlaceholder: 'Search',
      searchButton: 'Search',
      noResults: 'No results found',

      // Common
      readMore: 'Read More',
      viewAll: 'View All',
      loading: 'Loading',
      previous: 'Previous',
      next: 'Next',

      // Forms
      submit: 'Submit',
      required: 'This field is required',
      invalidEmail: 'Invalid email address',

      // Events
      upcomingEvents: 'Upcoming Events',
      pastEvents: 'Past Events',
      eventDate: 'Date',
      location: 'Location',

      // Footer
      quickLinks: 'Quick Links',
      followUs: 'Follow Us',
      visitOur: 'Visit our',
      page: 'page',
    }
  }
}
