# payload-translations

> A Payload CMS 3 plugin for managing UI translations with automatic string collection and full static generation support

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Add the plugin to your Payload config](#1-add-the-plugin-to-your-payload-config)
  - [2. Set up the translations provider](#2-set-up-the-translations-provider-in-your-layout)
  - [3. Use translations in your components](#3-use-translations-in-your-components)
  - [4. Fill in translations](#4-fill-in-translations)
- [Common Use Cases](#common-use-cases)
  - [Variables in translations](#variables-in-translations)
  - [Pluralization](#pluralization)
  - [Dynamic messages](#dynamic-messages)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [`translationsPlugin(options)`](#translationspluginoptions)
  - [`getTranslations(locale, config)`](#gettranslationslocale-config)
  - [`useTranslations()`](#usetranslations)
  - [`t(key, contextOrVars?, vars?)`](#tkey-contextorvars-vars)
  - [`formatDate(date, style?)`](#formatdatedate-style)
  - [`formatNumber(num, options?)`](#formatnumbernum-options)
  - [`formatCurrency(amount, currency?)`](#formatcurrencyamount-currency)
- [Development Tools](#development-tools)
  - [Automatically Generate Translation Fields](#automatically-generate-translation-fields)
  - [Run Tests](#run-tests)
- [TypeScript Support](#typescript-support)
- [Performance](#performance)
- [Translation Updates & Caching](#translation-updates--caching)
  - [How it Works](#how-it-works)
  - [Automatic Revalidation (Default)](#automatic-revalidation-default)
  - [Disabling Automatic Revalidation](#disabling-automatic-revalidation)
  - [Other Strategies](#other-strategies)
- [Examples](#examples)
- [License](#license)
- [Support](#support)

## Features

- ✨ **Automatic Field Generation** - CLI scanner finds all `t()` calls and generates field definitions
- 🌐 **Dual Interpolation** - Supports both ICU MessageFormat and sprintf-style variables
- 📝 **Familiar-Style** - Familiar `t('key', 'Context')` API for easy adoption (if you used WPML or Polylang in the past)
- 🎯 **Type-Safe** - Full TypeScript support with autocomplete
- ⚡ **Zero Runtime Overhead** - All translations fetched at build time
- 🚀 **SSG Compatible** - Works with Next.js static generation
- 📦 **Tiny Bundle** - ~2KB gzipped
- 🔍 **Missing Translation Detection** - Automatically logs missing translations in dev

## Installation

```bash
npm install payload-translations
# or
pnpm add payload-translations
# or
yarn add payload-translations
```

## Quick Start

### 1. Add the plugin to your Payload config

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { translationsPlugin } from 'payload-translations'

export default buildConfig({
  // ... your config
  plugins: [
    translationsPlugin({
      // Define your translation fields (required)
      customFields: [
        {
          label: 'Navigation',
          fields: [
            { name: 'home', type: 'text', localized: true, required: true },
            { name: 'about', type: 'text', localized: true, required: true },
            { name: 'contact', type: 'text', localized: true, required: true },
          ],
        },
        {
          label: 'Authentication',
          fields: [
            { name: 'loginButton', type: 'text', localized: true, required: true },
            { name: 'logoutButton', type: 'text', localized: true, required: true },
            { name: 'forgotPassword', type: 'text', localized: true, required: true },
          ],
        },
      ],
    }),
  ],
})
```

### 2. Set up the translations provider in your layout

```tsx
// app/[locale]/layout.tsx
import { TranslationsProvider } from 'payload-translations/react'
import { getTranslations } from 'payload-translations/server'

export default async function Layout({
  children,
  params,
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
import { useTranslations } from 'payload-translations/react'

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

**Server Components (WPML-style - same as client!):**

```tsx
import { getTranslations } from 'payload-translations/server'
import config from '@/payload.config'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { t } = await getTranslations(locale, config)

  return (
    <div>
      <h1>{t('Welcome to our site', 'HomePage')}</h1>
      <button>{t('Get Started', 'HomePage')}</button>
    </div>
  )
}
```

**Or use direct access if you prefer:**

```tsx
const { translations } = await getTranslations(locale, config)
return <h1>{translations.home}</h1> // Type-safe
```

### 4. Fill in translations

Go to `/admin/globals/translations` in your Payload admin panel and fill in translations for all locales.

## Common Use Cases

### Variables in translations

**ICU MessageFormat (Object):**

```tsx
// In your CMS, add field 'welcomeMessage' with value:
// "Welcome back, {name}!"

const { t } = useTranslations()
<h1>{t('welcomeMessage', { name: user.name })}</h1>
// Output: "Welcome back, John!"
```

**Sprintf Style (Array):**

```tsx
// In your CMS, add field 'welcomeMessage' with value:
// "Welcome back, %s!"

const { t } = useTranslations()
<h1>{t('welcomeMessage', [user.name])}</h1>
// Output: "Welcome back, John!"
```

### Pluralization

**ICU MessageFormat (with automatic locale rules):**

```tsx
// In your CMS, add field 'cartItems' with value:
// "{count, plural, zero {No items} one {# item} other {# items}}"

const { t } = useTranslations()
<p>{t('cartItems', { count: 0 })}</p>  // "No items"
<p>{t('cartItems', { count: 1 })}</p>  // "1 item"
<p>{t('cartItems', { count: 5 })}</p>  // "5 items"
```

**Sprintf Style (simpler but manual):**

```tsx
// Store both singular and plural in CMS, choose manually
const { t } = useTranslations()
const count = 5
<p>{t(count === 1 ? 'item' : 'items', [count])}</p>  // "5 items"
```

### Dynamic messages

**ICU MessageFormat:**

```tsx
// In your CMS, add field 'notification' with value:
// "{user} liked your {type}"

const { t } = useTranslations()
<p>{t('notification', { user: 'Sarah', type: 'post' })}</p>
// Output: "Sarah liked your post"
```

**Sprintf Style:**

```tsx
// In your CMS, add field 'notification' with value:
// "%s liked your %s"

const { t } = useTranslations()
<p>{t('notification', ['Sarah', 'post'])}</p>
// Output: "Sarah liked your post"
```

## Configuration

The plugin is fully generic - you define all translation fields for your project:

```typescript
translationsPlugin({
  customFields: [
    {
      label: 'Navigation',
      fields: [
        { name: 'home', type: 'text', localized: true, required: true },
        { name: 'about', type: 'text', localized: true, required: true },
      ],
    },
    {
      label: 'Forms',
      fields: [
        { name: 'submit', type: 'text', localized: true, required: true },
        { name: 'cancel', type: 'text', localized: true, required: true },
      ],
    },
  ],
})
```

Organize fields into tabs for better admin UX.

## API Reference

### `translationsPlugin(options)`

#### Options

```typescript
{
  // Whether to enable the translations global (default: true)
  enabled?: boolean

  // The slug for the translations global (default: 'translations')
  slug?: string

  // Translation field tabs (required)
  // Each tab groups related translation fields
  customFields: Array<{
    label: string        // Tab label in admin
    fields: Field[]      // Payload field definitions
  }>
}
```

**Example:**

```typescript
translationsPlugin({
  customFields: [
    {
      label: 'UI Components',
      fields: [
        { name: 'loading', type: 'text', localized: true, required: true },
        { name: 'error', type: 'text', localized: true, required: true },
        { name: 'success', type: 'text', localized: true, required: true },
      ],
    },
  ],
})
```

### `getTranslations(locale, config)`

Server-side function to fetch translations for a specific locale.

```typescript
import { getTranslations } from 'payload-translations/server'
import config from '@/payload.config'

const { t, translations, formatDate, formatNumber, formatCurrency, locale } =
  await getTranslations('en', config)

// WPML-style (recommended)
<button>{t('Submit', 'LoginForm')}</button>

// Direct access (type-safe)
<h1>{translations.home}</h1>
```

**Returns:**

- `t(key, context?)` - WPML-style translation function
- `translations` - Raw translations object
- `formatDate()` - Locale-aware date formatting
- `formatNumber()` - Locale-aware number formatting
- `formatCurrency()` - Locale-aware currency formatting
- `locale` - Current locale string

### `useTranslations()`

React hook for accessing translations in client components.

```typescript
const {
  translations, // Translation object
  locale, // Current locale
  t, // WPML-style helper function
  formatDate, // Locale-aware date formatting
  formatNumber, // Locale-aware number formatting
  formatCurrency, // Locale-aware currency formatting
} = useTranslations()
```

### `t(key, contextOrVars?, vars?)`

WPML-style translation helper with **dual interpolation support** - use whichever style you prefer:

#### **ICU MessageFormat Style (Object)** - Recommended

Modern, explicit approach with named placeholders:

```typescript
const { t } = useTranslations()

// Simple variables
<p>{t('Welcome {name}', 'HomePage', { name: 'John' })}</p>
// Output: "Welcome John"

// Without context
<p>{t('Hello {username}', { username: 'Alice' })}</p>
// Output: "Hello Alice"

// Pluralization with automatic locale rules
<p>{t('{count, plural, one {# item} other {# items}}', 'Cart', { count: 1 })}</p>
// Output: "1 item"

<p>{t('{count, plural, one {# item} other {# items}}', 'Cart', { count: 5 })}</p>
// Output: "5 items"

// Complex pluralization
<p>{t('You have {count, plural, zero {no messages} one {# message} other {# messages}}', { count: 0 })}</p>
// Output: "You have no messages"
```

#### **Sprintf Style (Array)** - WPML Compatible

Familiar WordPress-style positional arguments:

```typescript
// Simple string substitution
<p>{t('Welcome %s', 'HomePage', ['John'])}</p>
// Output: "Welcome John"

// Without context
<p>{t('Hello %s', ['Alice'])}</p>
// Output: "Hello Alice"

// Multiple values
<p>{t('Hello %s, you have %d new messages', ['John', 5])}</p>
// Output: "Hello John, you have 5 new messages"

// Number formatting
<p>{t('Total: %d items at $%f each', [42, 19.99])}</p>
// Output: "Total: 42 items at $19.99 each"
```

**Format Specifiers:**

- `%s` - String
- `%d` / `%i` - Integer (rounds down)
- `%f` / `%u` - Float/Number

#### **How It Works**

The plugin automatically detects which style you're using:

- **Pass an object** `{ name: 'John' }` → ICU MessageFormat
- **Pass an array** `['John']` → Sprintf style

No configuration needed - just use whichever style feels natural!

#### **ICU MessageFormat Features**

- **Simple variables**: `{variableName}`
- **Pluralization**: `{count, plural, zero {...} one {...} other {...}}`
- **Automatic plural rules**: Uses `Intl.PluralRules` for locale-aware pluralization

**Missing translations are logged in dev console:**

```
🌐 Missing Translations Detected
Copy-paste these fields into your translationFields array:

  {
    name: 'welcome',
    type: 'text',
    label: 'Welcome {name}',
    localized: true,
    // Used in: HomePage
  }
```

Simply copy the logged output and paste it into your `translationFields` array in your config!

### `formatDate(date, style?)`

Locale-aware date formatting:

```typescript
const { formatDate } = useTranslations()

formatDate(new Date(), 'full') // "Monday, January 15, 2025"
formatDate(new Date(), 'long') // "January 15, 2025"
formatDate(new Date(), 'medium') // "Jan 15, 2025"
formatDate(new Date(), 'short') // "1/15/25"
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

### Automatically Generate Translation Fields

The plugin includes a CLI scanner that finds all `t()` calls in your codebase and generates the field definitions for you:

```bash
npx payload-translations scan [pattern]
```

**Default pattern**: `src/**/*.{ts,tsx,js,jsx}`

**Example output:**

```
🔍 Scanning for translation calls...

📝 Found 14 unique translation calls:

  LoginForm: 1 translations
  HomePage: 2 translations
  Footer: 4 translations

📋 Copy these field definitions to your translation config:

  {
    type: 'collapsible',
    label: 'LoginForm',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'submit',
        type: 'text',
        label: 'Submit',
        localized: true,
      },
    ],
  },
```

Simply copy-paste the output into your `translationFields` array!

**Usage examples:**

```bash
# Scan and display fields (copy-paste required)
npx payload-translations scan

# Automatically append to your translation fields file
npx payload-translations scan --write

# Specify a custom file to append to
npx payload-translations scan --write src/my-translations.ts

# Scan specific directory and auto-write
npx payload-translations scan "components/**/*.tsx" --write
```

**How it works:**

1. Scans your code for `t('key')` and `t('key', 'Context')` calls
2. Groups translations by context (component name)
3. Converts keys to camelCase field names
4. Generates ready-to-use Payload field definitions
5. With `--write`: Automatically appends new fields to your file
6. Automatically organizes fields into collapsible groups

**Auto-detection of translation files:**

When using `--write` without specifying a file, the CLI looks for:

- `src/translations/fields.ts`
- `src/translations/fields.js`
- `src/translations/config.ts`
- `src/translations/config.js`
- `translations/fields.ts`
- `translations/fields.js`

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

## Translation Updates & Caching

### How it Works

By default, translations are fetched when pages are rendered. In production with Next.js static generation:

- Translations are fetched at **build time**
- Results are cached in the static HTML
- Changes in Payload admin require revalidation to appear

### Automatic Revalidation (Default)

The plugin automatically revalidates all pages when translations change. **This is enabled by default and requires zero configuration:**

```typescript
translationsPlugin({
  revalidateOnChange: true, // ← Default! No setup needed
  customFields: [
    /* ... */
  ],
})
```

**How it works automatically:**

When you update translations in the Payload admin, the plugin:

1. Detects the change via an internal `afterChange` hook
2. Calls `revalidatePath('/', 'layout')` to revalidate all pages
3. Next.js regenerates pages with the new translations
4. Changes appear immediately - **no rebuild or app code changes required!**

**✨ You don't need to add any hooks or code to your app - it just works!**

### Disabling Automatic Revalidation

If you prefer manual control or aren't using Next.js:

```typescript
translationsPlugin({
  revalidateOnChange: false, // Disable auto-revalidation
  customFields: [
    /* ... */
  ],
})
```

### Other Strategies

**Time-Based ISR:**

```typescript
// In your page/layout
export const revalidate = 3600 // Revalidate every hour
```

**Manual On-Demand Revalidation:**

```typescript
// Create a webhook endpoint
import { revalidatePath } from 'next/cache'

export async function POST() {
  revalidatePath('/', 'layout')
  return Response.json({ revalidated: true })
}
```

**Dynamic Rendering (always fresh):**

```typescript
// Force dynamic rendering for a specific page
export const dynamic = 'force-dynamic'
```

## Examples

See the [README.md](./README.md) for comprehensive examples and advanced usage patterns.

## License

MIT

## Support

- [GitHub Issues](https://github.com/cursor-pointer/payload-translations/issues)
- [Documentation](https://github.com/cursor-pointer/payload-translations)
- [npm Package](https://www.npmjs.com/package/payload-translations)
- [Payload CMS Discord](https://discord.gg/payload)
