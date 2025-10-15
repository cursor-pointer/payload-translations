import type { Config, Field, Plugin } from 'payload'

export interface TranslationsPluginOptions {
  /**
   * Whether to enable the translations global
   * @default true
   */
  enabled?: boolean

  /**
   * The slug for the translations global
   * @default 'translations'
   */
  slug?: string

  /**
   * Translation field tabs to add to the translations global
   * Each tab contains a group of related translation fields
   *
   * @example
   * ```ts
   * customFields: [
   *   {
   *     label: 'Navigation',
   *     fields: [
   *       { name: 'home', type: 'text', localized: true, required: true },
   *       { name: 'about', type: 'text', localized: true, required: true },
   *     ]
   *   }
   * ]
   * ```
   */
  customFields: Array<{
    label: string
    fields: Field[]
  }>
}

/**
 * Payload CMS Translations Plugin
 *
 * Adds a translations global to your Payload config with automatic string collection,
 * locale-aware formatting, and full static generation support.
 *
 * @example
 * ```ts
 * import { translationsPlugin } from './Translations/plugin'
 *
 * export default buildConfig({
 *   plugins: [
 *     translationsPlugin({
 *       customFields: [
 *         {
 *           label: 'Authentication',
 *           fields: [
 *             { name: 'loginButton', type: 'text', localized: true, required: true },
 *             { name: 'logoutButton', type: 'text', localized: true, required: true },
 *           ]
 *         }
 *       ]
 *     })
 *   ]
 * })
 * ```
 */
export const translationsPlugin = (
  options: TranslationsPluginOptions
): Plugin => {
  const {
    enabled = true,
    slug = 'translations',
    customFields,
  } = options

  return (config: Config): Config => {
    if (!enabled) return config

    // Plugin is fully generic - no hardcoded defaults
    // Users must provide their own customFields
    if (customFields.length === 0) {
      console.warn(
        '[@cursorpointer/payload-translations] No customFields provided. ' +
        'The translations global will be created but will be empty. ' +
        'Please configure translation fields in your plugin options.'
      )
    }

    // Add the translations global to the config
    const translationsGlobal = {
      slug,
      label: 'Translations',
      access: {
        read: () => true,
      },
      fields: [
        {
          type: 'tabs' as const,
          tabs: customFields,
        },
      ],
    }

    return {
      ...config,
      globals: [...(config.globals || []), translationsGlobal],
    }
  }
}
