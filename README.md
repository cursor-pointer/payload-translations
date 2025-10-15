# @rumba/payload-translations

> A Payload CMS 3 plugin for managing UI translations with automatic string collection and full static generation support

## Installation

```bash
npm install @rumba/payload-translations
# or
pnpm add @rumba/payload-translations
# or
yarn add @rumba/payload-translations
```

## Quick Start

### 1. Add the plugin to your Payload config

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { translationsPlugin } from '@rumba/payload-translations'

export default buildConfig({
  // ... your config
  plugins: [
    translationsPlugin({
      // Optional: Add custom translation fields
      customFields: [
        {
          label: 'Authentication',
          fields: [
            { name: 'loginButton', type: 'text', localized: true, required: true },
            { name: 'logoutButton', type: 'text', localized: true, required: true },
            { name: 'forgotPassword', type: 'text', localized: true, required: true },
          ]
        }
      ]
    })
  ]
})
```

### 2. Set up the translations provider in your layout

```tsx
// app/[locale]/layout.tsx
import { TranslationsProvider } from '@rumba/payload-translations/react'
import { getTranslations } from '@rumba/payload-translations/server'

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const translations = await getTranslations(locale)

  return (
    <TranslationsProvider translations={translations} locale={locale}>
      {children}
    </TranslationsProvider>
  )
}
```

### 3. Use translations in your components

**Client Components:**

```tsx
'use client'
import { useTranslations } from '@rumba/payload-translations/react'

export function MyComponent() {
  const { translations, t, formatDate } = useTranslations()

  return (
    <div>
      <h1>{translations.home}</h1>
      <button>{t('Click me', 'MyComponent')}</button>
      <time>{formatDate(new Date(), 'long')}</time>
    </div>
  )
}
```

**Server Components:**

```tsx
import { getTranslations } from '@rumba/payload-translations/server'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const translations = await getTranslations(locale)

  return <h1>{translations.home}</h1>
}
```

### 4. Fill in translations

Go to `/admin/globals/translations` in your Payload admin panel and fill in translations for all locales.

## Default Translation Fields

The plugin comes with sensible defaults for common UI strings:

- **Navigation**: home, events, posts, resources
- **Search**: searchPlaceholder, searchButton, noResults
- **Common**: readMore, viewAll, loading, previous, next
- **Forms**: submit, required, invalidEmail
- **Events**: upcomingEvents, pastEvents, eventDate, location

You can disable defaults and provide your own:

```typescript
translationsPlugin({
  includeDefaults: false,
  customFields: [
    {
      label: 'My Custom Translations',
      fields: [
        // Your fields
      ]
    }
  ]
})
```

## API Reference

### `translationsPlugin(options)`

#### Options

```typescript
{
  // Whether to enable the translations global (default: true)
  enabled?: boolean

  // The slug for the translations global (default: 'translations')
  slug?: string

  // Additional custom translation fields to add
  customFields?: Array<{
    label: string
    fields: Field[]
  }>

  // Whether to include default translation fields (default: true)
  includeDefaults?: boolean
}
```

### `getTranslations(locale)`

Server-side function to fetch translations for a specific locale.

```typescript
const translations = await getTranslations('en')
```

Returns a typed object with all translation strings.

### `useTranslations()`

React hook for accessing translations in client components.

```typescript
const {
  translations,  // Translation object
  locale,        // Current locale
  t,            // WPML-style helper function
  formatDate,   // Locale-aware date formatting
  formatNumber, // Locale-aware number formatting
  formatCurrency // Locale-aware currency formatting
} = useTranslations()
```

### `t(key, context?)`

WPML-style translation helper that auto-collects missing translations in development:

```typescript
const { t } = useTranslations()

// Usage
<button>{t('Submit', 'LoginForm')}</button>

// Missing translations are logged in dev console:
// 🌐 Missing Translations Detected
// Key: "Submit"
// Used in: LoginForm
```

### `formatDate(date, style?)`

Locale-aware date formatting:

```typescript
const { formatDate } = useTranslations()

formatDate(new Date(), 'full')   // "Monday, January 15, 2025"
formatDate(new Date(), 'long')   // "January 15, 2025"
formatDate(new Date(), 'medium') // "Jan 15, 2025"
formatDate(new Date(), 'short')  // "1/15/25"
```

### `formatNumber(num, options?)`

Locale-aware number formatting:

```typescript
const { formatNumber } = useTranslations()

formatNumber(1234.56) // "1,234.56" (en) or "1.234,56" (nl)
formatNumber(0.1234, { style: 'percent' }) // "12.34%"
```

### `formatCurrency(amount, currency?)`

Locale-aware currency formatting:

```typescript
const { formatCurrency } = useTranslations()

formatCurrency(99.99, 'EUR') // "€99.99" (en) or "€ 99,99" (nl)
formatCurrency(99.99, 'USD') // "$99.99"
```

## Development Tools

### Scan for Hardcoded Strings

```bash
pnpm run scan:translations
```

Scans your codebase for hardcoded strings that should be translated.

### Run Tests

```bash
pnpm test
```

## TypeScript Support

The plugin is fully typed. Your IDE will autocomplete translation keys and catch typos:

```typescript
const { translations } = useTranslations()
translations.home // ✅ Valid
translations.homer // ❌ TypeScript error
```

To generate types for custom fields:

```bash
pnpm payload generate:types
```

## Performance

- ⚡ **Zero runtime overhead** - All translations fetched at build time
- 🚀 **Fully static** - Works with Next.js static generation
- 📦 **Small bundle** - ~2KB gzipped
- 🎯 **No hydration issues** - Server and client stay in sync

## Examples

See the [README.md](./README.md) for comprehensive examples and advanced usage patterns.

## License

MIT

## Support

- [GitHub Issues](https://github.com/yourname/payload-translations/issues)
- [Documentation](https://github.com/yourname/payload-translations)
- [Payload CMS Discord](https://discord.gg/payload)
