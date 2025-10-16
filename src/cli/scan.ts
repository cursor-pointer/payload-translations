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
 * Find translation fields file in common locations
 */
function findTranslationFile(): string | null {
  const commonPaths = [
    'src/translations/fields.ts',
    'src/translations/fields.js',
    'src/translations/config.ts',
    'src/translations/config.js',
    'translations/fields.ts',
    'translations/fields.js',
  ]

  for (const filePath of commonPaths) {
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

/**
 * Append new fields to translation file
 */
function appendToFile(filePath: string, newFields: string): void {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Find the export statement (array or const declaration)
  const exportMatch = content.match(/export\s+const\s+\w+\s*[:=]\s*\[/)

  if (!exportMatch) {
    console.error('❌ Could not find translation fields array in file')
    console.error('   Please add the fields manually')
    return
  }

  // Find the closing bracket of the array
  let bracketCount = 0
  let insertPosition = -1
  let inArray = false

  for (let i = exportMatch.index!; i < content.length; i++) {
    if (content[i] === '[') {
      bracketCount++
      inArray = true
    } else if (content[i] === ']') {
      bracketCount--
      if (inArray && bracketCount === 0) {
        insertPosition = i
        break
      }
    }
  }

  if (insertPosition === -1) {
    console.error('❌ Could not find end of translation fields array')
    console.error('   Please add the fields manually')
    return
  }

  // Insert new fields before the closing bracket
  const before = content.substring(0, insertPosition)
  const after = content.substring(insertPosition)

  // Add proper indentation and comma
  const newContent = before + newFields + '\n' + after

  fs.writeFileSync(filePath, newContent)
  console.log(`\n✅ Added new fields to ${filePath}`)
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  let pattern = 'src/**/*.{ts,tsx,js,jsx}'
  let outputFile: string | null = null
  let autoWrite = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--write' || args[i] === '-w') {
      autoWrite = true
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        outputFile = args[++i]
      }
    } else if (!args[i].startsWith('-')) {
      pattern = args[i]
    }
  }

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

  const newFields = generateFieldDefinitions(Array.from(uniqueKeys.values()))

  if (autoWrite) {
    // Find or use specified file
    const targetFile = outputFile || findTranslationFile()

    if (!targetFile) {
      console.error('\n❌ Could not find translation fields file')
      console.error('   Specify file with --write <file> or create one of:')
      console.error('   - src/translations/fields.ts')
      console.error('   - src/translations/config.ts')
      console.log('\n📋 Here are the fields to add manually:\n')
      console.log(newFields)
    } else {
      appendToFile(targetFile, newFields)
      console.log(`\n💡 Don't forget to fill in the translations in your Payload admin!`)
    }
  } else {
    console.log('\n📋 Copy these field definitions to your translation config:\n')
    console.log(newFields)
    console.log('\n💡 Tip: Use --write to automatically append to your fields file')
    console.log('   Example: npx payload-translations scan --write')
  }

  console.log('')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
