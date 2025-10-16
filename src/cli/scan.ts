#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface TranslationCall {
  key: string
  context: string
  file: string
  line: number
}

/**
 * Scan files for t() calls and extract translation keys
 */
async function scanFiles(pattern: string = 'src/**/*.{ts,tsx,js,jsx}'): Promise<TranslationCall[]> {
  const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] })
  const translations: TranslationCall[] = []

  // Regex to match t() calls with various patterns:
  // t('key')
  // t('key', 'Context')
  // t('key', { vars })
  // t('key', 'Context', { vars })
  const tCallRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?/g

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      let match
      while ((match = tCallRegex.exec(line)) !== null) {
        const key = match[1]
        const context = match[2] || 'Unknown'

        // Skip if key contains placeholders (already in CMS) or is a variable
        if (!key.includes('{') && !key.includes('%') && key.length < 100) {
          translations.push({
            key,
            context,
            file: path.relative(process.cwd(), file),
            line: index + 1,
          })
        }
      }
    })
  }

  return translations
}

/**
 * Convert string to camelCase field name
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]+/g, '') // Remove special chars but keep spaces
    .split(/\s+/)                     // Split on spaces
    .map((word, index) => {
      const lower = word.toLowerCase()
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}

/**
 * Group translations by context
 */
function groupByContext(translations: TranslationCall[]): Map<string, Set<string>> {
  const grouped = new Map<string, Set<string>>()

  translations.forEach(({ key, context }) => {
    if (!grouped.has(context)) {
      grouped.set(context, new Set())
    }
    grouped.get(context)!.add(key)
  })

  return grouped
}

/**
 * Generate field definitions in Payload format
 */
function generateFieldDefinitions(translations: TranslationCall[]): string {
  const grouped = groupByContext(translations)
  const output: string[] = []

  // Generate collapsible groups per context
  grouped.forEach((keys, context) => {
    output.push(`  {`)
    output.push(`    type: 'collapsible',`)
    output.push(`    label: '${context}',`)
    output.push(`    admin: { initCollapsed: true },`)
    output.push(`    fields: [`)

    keys.forEach((key) => {
      const fieldName = toCamelCase(key)
      output.push(`      {`)
      output.push(`        name: '${fieldName}',`)
      output.push(`        type: 'text',`)
      output.push(`        label: '${key}',`)
      output.push(`        localized: true,`)
      output.push(`      },`)
    })

    output.push(`    ],`)
    output.push(`  },`)
  })

  return output.join('\n')
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2)
  const pattern = args[0] || 'src/**/*.{ts,tsx,js,jsx}'

  console.log('🔍 Scanning for translation calls...\n')

  const translations = await scanFiles(pattern)

  if (translations.length === 0) {
    console.log('✅ No missing translations found!')
    return
  }

  // Remove duplicates
  const uniqueKeys = new Map<string, TranslationCall>()
  translations.forEach((t) => {
    const key = `${t.key}:${t.context}`
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, t)
    }
  })

  console.log(`📝 Found ${uniqueKeys.size} unique translation calls:\n`)

  // Show summary
  const grouped = groupByContext(Array.from(uniqueKeys.values()))
  grouped.forEach((keys, context) => {
    console.log(`  ${context}: ${keys.size} translations`)
  })

  console.log('\n📋 Copy these field definitions to your translation config:\n')
  console.log(generateFieldDefinitions(Array.from(uniqueKeys.values())))
  console.log('')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
