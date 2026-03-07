# Custom Skills for Mystická Hvězda

This directory contains custom Claude Code skills designed to streamline development and maintenance of the Mystická Hvězda astrology web application.

## Available Skills

### 1. **build-mystickahvezda** - Build & Test
Manage the development server, run tests, and verify the build.

**Triggers:**
- "build mystickahvezda"
- "run tests"
- "start dev server"
- "verify build"
- "check tests"

**Actions:**
- `start-dev-server` - Start development server with auto-reload (`npm run dev`)
- `run-tests` - Run all Jest tests (`npm test`)
- `start-production` - Start production server (`npm start`)

**Use cases:**
- Setting up local development environment
- Running tests before committing changes
- Verifying the application builds successfully

---

### 2. **optimize-mystickahvezda** - Performance Optimization
Run optimization scripts for HTML, CSS, images, and other assets.

**Triggers:**
- "optimize mystickahvezda"
- "optimize html"
- "compress css"
- "optimize images"
- "fix css"

**Actions:**
- `optimize-html` - Optimize all HTML files
- `compress-css` - Compress and optimize CSS files
- `fix-css` - Fix CSS issues and inconsistencies
- `optimize-background` - Optimize background images
- `optimize-map` - Optimize map assets

**Use cases:**
- Improving page load performance
- Reducing file sizes before deployment
- Maintaining CSS consistency
- Optimizing assets for production

---

### 3. **verify-mystickahvezda** - Data Verification
Verify database integrity, content, encoding, and production readiness.

**Triggers:**
- "verify mystickahvezda"
- "check database"
- "check encoding"
- "verify data"
- "verify horoscopes"

**Actions:**
- `check-database` - Verify database integrity
- `check-encoding` - Check and fix Czech character encoding
- `verify-horoscopes` - Verify horoscope data integrity
- `verify-tarot-paths` - Verify tarot image paths are correct
- `verify-production` - Verify production readiness

**Use cases:**
- Pre-deployment verification
- Troubleshooting data issues
- Ensuring proper character encoding
- Checking asset references

---

### 4. **generate-mystickahvezda** - Content Generation
Generate SEO pages, blog content, sitemaps, and other dynamic content.

**Triggers:**
- "generate content"
- "generate pages"
- "generate seo"
- "generate blog"
- "generate sitemap"

**Actions:**
- `generate-seo-pages` - Generate SEO-optimized pages
- `generate-sitemap` - Generate XML sitemap
- `generate-blog` - Generate blog pages
- `generate-compatibility` - Generate compatibility pages
- `generate-dictionary` - Generate dictionary pages
- `generate-zodiac-pages` - Generate zodiac sign pages

**Use cases:**
- Creating new content pages
- Updating sitemaps for search engines
- Maintaining SEO-friendly pages
- Generating compatibility and reference pages

---

## Usage

These skills are designed to work with Claude Code. You can:

1. **Use the Skill tool directly:**
   ```
   /skill build-mystickahvezda
   ```

2. **Reference skills in conversations:**
   - "Can you help me optimize mystickahvezda?"
   - "Start the dev server for mystickahvezda"
   - "Verify the data in mystickahvezda"

3. **Combine multiple skills** for complete workflows:
   - Generate content → Optimize assets → Verify data → Run tests

## Skill Categories

| Category | Skills |
|----------|--------|
| **Development** | build-mystickahvezda |
| **Performance** | optimize-mystickahvezda |
| **Quality Assurance** | verify-mystickahvezda |
| **Content Management** | generate-mystickahvezda |

## Notes

- All skills are configured for the Mystická Hvězda project root directory
- Skills execute scripts in the project directory
- Test execution uses Jest with proper module setup
- All optimization and verification scripts are idempotent (safe to run multiple times)

## Adding New Skills

To add more skills:

1. Create a new JSON file in the `skills/` directory
2. Follow the same structure as existing skills
3. Update this README with the new skill information
4. Commit and push the changes

## Support

For issues or questions about these skills, refer to the project documentation or Claude Code documentation.
