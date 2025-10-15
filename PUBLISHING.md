# Publishing Guide for @cursorpointer/payload-translations

## Pre-Publishing Checklist

- [x] Package structure created
- [x] TypeScript compiled successfully
- [x] All tests passing (6/6)
- [x] README.md complete with examples
- [x] Package.json configured with correct exports
- [x] Tested in real project (rumba)
- [x] Dev server running successfully
- [ ] Update version in package.json
- [ ] Create GitHub repository
- [ ] Add LICENSE file
- [ ] Add CHANGELOG.md

## Package Structure

```
packages/payload-translations/
├── src/
│   ├── plugin.ts               # Main plugin
│   ├── config.ts               # Translations global config
│   ├── translationHelper.ts    # Helper functions
│   ├── index.ts                # Main entry point
│   ├── server/
│   │   ├── getTranslations.ts  # Server-side fetcher
│   │   └── index.ts
│   └── react/
│       ├── TranslationsProvider.tsx
│       └── index.ts
├── dist/                       # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Publishing Steps

### 1. Prepare the Package

```bash
cd packages/payload-translations

# Make sure everything builds
pnpm build

# Run tests (if moved to package)
pnpm test
```

### 2. Set up GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Payload CMS Translations Plugin"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/payload-translations.git
git push -u origin main
```

### 3. Create npm Account

If you don't have one:
```bash
npm adduser
```

Or login:
```bash
npm login
```

### 4. Publish to npm

```bash
# Dry run first
npm publish --dry-run

# Publish for real
npm publish --access public
```

### 5. Create GitHub Release

- Go to GitHub releases
- Create new release with tag `v0.1.0`
- Add release notes from CHANGELOG.md

### 6. Submit to Payload Plugin Directory

Visit: https://payloadcms.com/community

Create submission with:
- Plugin name: `@cursorpointer/payload-translations`
- Description: "Manage UI translations in Payload CMS with automatic string collection and full SSG support"
- Tags: translations, i18n, localization, ssg
- GitHub URL
- npm URL

## Post-Publishing

### Update Documentation

- [ ] Add installation instructions to README
- [ ] Add badges (npm version, downloads, license)
- [ ] Create example repository
- [ ] Write blog post/tutorial

### Promotion

- [ ] Tweet about the plugin
- [ ] Share in Payload Discord
- [ ] Share in Next.js Discord
- [ ] Post on Reddit r/nextjs
- [ ] Add to awesome-payloadcms list

## Versioning

Follow Semantic Versioning (semver):

- **Patch** (0.1.x): Bug fixes
- **Minor** (0.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

## Maintenance

### Updating

```bash
# Bump version
npm version patch|minor|major

# Publish update
npm publish
```

### Responding to Issues

- Monitor GitHub issues
- Respond within 48 hours
- Label appropriately (bug, enhancement, question)
- Close with clear explanations

## Integration with CI/CD

Consider adding:

- GitHub Actions for automated testing
- Automated npm publishing on release
- Dependency updates with Dependabot
- Code quality checks with ESLint/Prettier

## License

Make sure to add an MIT LICENSE file:

```
MIT License

Copyright (c) 2025 Koray Sels / CursorPointer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support

Set up support channels:
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord channel (optional)
- Email for security issues
