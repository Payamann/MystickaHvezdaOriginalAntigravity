# 🎨 Skill Coding Standards & Best Practices

Zajistěte konzistenci a kvalitu všech nových features v `seo-organic-growth` skill.

---

## 📝 Naming Conventions

### Action IDs
```javascript
// ✅ GOOD - kebab-case, descriptive
id: 'setup-google-analytics'
id: 'create-landing-pages'
id: 'generate-rss-feed'

// ❌ BAD - camelCase, unclear
id: 'setupGA'
id: 'createPages'
id: 'genRSS'

// ❌ BAD - unclear abbreviations
id: 'add-schema'        // Schema for what?
id: 'optimize'          // Optimize what?
id: 'setup'             // Setup of what?
```

### Function Names
```javascript
// ✅ GOOD - verb_noun pattern
function generateRSSFeed() { }
function addSchemaMarkup() { }
function setupEmailAutomation() { }
function optimizeKeywords() { }

// ❌ BAD - unclear
function doStuff() { }
function process() { }
function handleData() { }
```

### Variable Names
```javascript
// ✅ GOOD - specific, descriptive
const blogPostsWithMetadata = [...];
const conversionFunnelAnalysis = { };
const htmlFilePathsToModify = [];

// ❌ BAD - unclear, abbreviated
const data = [...];
const result = { };
const files = [];
```

### File Names
```javascript
// ✅ GOOD - descriptor-action.js
setup-analytics.js
add-schema-markup.js
create-landing-pages.js
optimize-keywords.js

// ❌ BAD - unclear
analytics.js
schema.js
pages.js
optimize.js
```

---

## 🎯 File Structure

### Standard Action File Layout

```javascript
/**
 * [DESCRIPTIVE TITLE]
 * [What this does and why it matters]
 */

// 1. IMPORTS (grouped by type)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillAction } from '../skills/skill-framework.js';

// 2. CONSTANTS & SETUP
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// 3. CONFIGURATION
const CONFIG = {
  defaultLanguage: 'cs',
  validCategories: ['analytics', 'seo', 'content'],
  timeout: 30000
};

// 4. HELPER FUNCTIONS
function validateInput(data) { }
function formatOutput(data) { }
function handleError(error) { }

// 5. MAIN ACTION DEFINITION
export const yourActionId = new SkillAction({
  id: 'your-action-id',
  // ... rest of config
  handler: async (context) => {
    // Implementation
  }
});

// 6. HELPER EXPORTS (if needed)
export function setupInitialization() { }
export function validateConstraints() { }
```

---

## 💬 Code Comments

### Documentation Comments (above functions/classes)
```javascript
/**
 * Validates email address format
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 *
 * @throws {Error} If email parameter is missing
 *
 * @example
 * validateEmail('user@example.com'); // true
 * validateEmail('invalid'); // false
 */
function validateEmail(email) { }
```

### Inline Comments (inside functions)
```javascript
// ✅ GOOD - explains WHY, not WHAT
const delay = 2000; // Wait for DOM to fully render before checking

// ❌ BAD - states the obvious
const delay = 2000; // Set delay to 2000
delay = delay + 1000; // Add 1000 to delay
```

### Section Comments (organize code blocks)
```javascript
// ============================================
// VALIDATION PHASE
// ============================================
if (!process.env.GA4_MEASUREMENT_ID) {
  throw new Error('Missing GA4_MEASUREMENT_ID');
}

// ============================================
// FILE PROCESSING PHASE
// ============================================
const files = fs.readdirSync(filePath);
for (const file of files) {
  // ...
}

// ============================================
// RESULTS PHASE
// ============================================
return { success: true, filesProcessed: files.length };
```

---

## 🔍 Logging Standards

### User-Facing Logs (use console.log)

```javascript
// Show what's happening
console.log('\n📌 Setup Google Analytics');
console.log('   Creating GA4 tracking script...\n');

// Success with emoji
console.log('✅ Added schema markup to 5 pages');
console.log('   Organization schema: homepage');
console.log('   Service schemas: 4 feature pages\n');

// Progress indicators
console.log('🔍 Processing files...');
for (const file of files) {
  console.log(`   ✓ ${file}`);
}

// Error with context
console.error('❌ Failed to read file:', filePath);
console.error('   Reason: File not found or permission denied');
console.error('   Action: Check file path and permissions\n');

// Warnings
console.warn('⚠️  Missing environment variable: GA4_MEASUREMENT_ID');
console.warn('   This is required for analytics tracking');
```

### Emoji Guide
```javascript
✅ - Success / Completed
❌ - Error / Failed
⚠️  - Warning / Needs attention
📌 - Information / Starting
🔍 - Searching / Processing
💡 - Tip / Pro tip
🚀 - Ready / Launching
📊 - Metrics / Data
📈 - Growth / Improvement
🔗 - Link / Reference
```

### NOT Acceptable
```javascript
// ❌ BAD - no context
console.log('Done');
console.log('Error');
console.log(result);

// ❌ BAD - too verbose
for (let i = 0; i < 1000000; i++) {
  console.log(`Processing file ${i}`); // 1M lines of output!
}

// ❌ BAD - production errors left in code
console.log('DEBUG: context =', context);
console.log('TODO: Fix this later');
```

---

## ⚡ Error Handling

### Validation Pattern
```javascript
// ✅ GOOD - validate early, fail fast
async handler(context) {
  // 1. Validate inputs
  if (!process.env.REQUIRED_VAR) {
    throw new Error('Missing: REQUIRED_VAR');
  }

  if (!fs.existsSync(requiredFile)) {
    throw new Error(`File not found: ${requiredFile}`);
  }

  // 2. Process
  // ... your code ...

  // 3. Return results
  return { success: true, /* ... */ };
}
```

### Error Messages Pattern
```javascript
// ✅ GOOD - what, why, how to fix
throw new Error(
  'Missing Google Analytics ID\n' +
  'Required for: Analytics tracking setup\n' +
  'Action: Set GA4_MEASUREMENT_ID in .env file'
);

// ❌ BAD - unclear
throw new Error('GA4_MEASUREMENT_ID not set');
```

### Try-Catch Pattern
```javascript
// ✅ GOOD - let framework handle try-catch
async handler(context) {
  // Validation throws errors
  if (!valid) throw new Error('Invalid input');

  // Processing
  const result = await processFile(path);

  // Return results
  return result;
}
// SkillAction automatically handles try-catch

// ❌ BAD - catch and swallow errors
try {
  // ... code ...
} catch (e) {
  // Silently fails, user doesn't know what happened
}
```

---

## 📐 Code Style

### Imports
```javascript
// ✅ GOOD - grouped, organized
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { SkillAction } from '../skills/skill-framework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ❌ BAD - scattered, no groups
import { SkillAction } from '../skills/skill-framework.js';
import fs from 'fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import path from 'path';
```

### String Formatting
```javascript
// ✅ GOOD - use template literals for multiline
const message = `Processing file: ${file}
Status: In progress
Progress: ${current}/${total}`;

// ✅ GOOD - use template literals for variables
const path = `${rootDir}/public/${fileName}`;

// ❌ BAD - string concatenation
const message = 'Processing file: ' + file + '\n' +
                'Status: In progress\n' +
                'Progress: ' + current + '/' + total;
```

### Object Formatting
```javascript
// ✅ GOOD - clear structure
const config = {
  id: 'action-id',
  name: 'Action Name',
  category: 'seo',
  handler: async (context) => {
    // ...
  }
};

// ❌ BAD - unclear
const config = {id:'id',name:'name',category:'seo',handler:async(c)=>{}};
```

### Conditionals
```javascript
// ✅ GOOD - clear conditions
if (!process.env.REQUIRED) {
  throw new Error('Missing required env var');
}

if (files.length === 0) {
  console.log('No files to process');
  return { processed: 0 };
}

// ❌ BAD - cryptic
if (!p && !q) { }
if (f.l == 0) { }
if (!!x && !y) { }
```

### Loops
```javascript
// ✅ GOOD - clear, readable
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  processContent(content);
}

// ✅ GOOD - with meaningful variable names
const validFiles = files.filter(f =>
  f.endsWith('.html') && fs.existsSync(f)
);

// ❌ BAD - unclear
for (let i = 0; i < f.l; i++) {
  p(f[i]);
}
```

---

## 🧪 Testing Standards

### Unit Test Pattern
```javascript
// Create test file: test/your-action.test.js
import { yourActionId } from '../server/scripts/your-action.js';

describe('yourActionId', () => {
  test('should execute successfully', async () => {
    const result = await yourActionId.execute({});
    expect(result.success).toBe(true);
  });

  test('should handle missing dependencies', async () => {
    // Test dependency checking
  });

  test('should validate requirements', async () => {
    // Test env var requirements
  });
});
```

### Testing Checklist
- [ ] Unit tests for core logic
- [ ] Integration tests with other actions
- [ ] Error handling tests
- [ ] Edge cases (empty input, large files, etc.)
- [ ] Performance tests (doesn't timeout)

---

## 📋 Return Value Standards

### Success Response
```javascript
// ✅ GOOD - detailed, helpful
return {
  files_created: ['file1.html', 'file2.html'],
  files_modified: ['index.html'],
  metrics_affected: ['organic_traffic', 'ctr'],
  summary: 'Added schema markup to 5 pages',
  timestamp: new Date().toISOString(),
  next_steps: [
    'Validate at schema.org/validator',
    'Check Google Search Console'
  ]
};
```

### Error Response
```javascript
// ✅ GOOD - automatic via SkillAction
throw new Error(
  'Clear error message\n' +
  'Why it happened\n' +
  'How to fix it'
);

// SkillAction returns:
// {
//   success: false,
//   action: 'action-id',
//   error: 'Error message',
//   timestamp: '2026-03-07...'
// }
```

---

## 🔒 Security Standards

### Environment Variables
```javascript
// ✅ GOOD - never hardcode secrets
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('Missing API_KEY');

// ❌ BAD - hardcoded secrets
const apiKey = 'sk_live_abc123xyz789';
```

### File Paths
```javascript
// ✅ GOOD - use path.join to avoid injection
const filePath = path.join(rootDir, userInput);

// ❌ BAD - string concatenation allows path traversal
const filePath = `${rootDir}/${userInput}`; // Could be ../../../etc/passwd
```

### SQL/Database
```javascript
// ✅ GOOD - use parameterized queries
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ BAD - SQL injection vulnerability
const result = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

---

## ✅ Pre-Commit Checklist

Before committing new actions:

- [ ] **Code Quality**
  - [ ] Passes linter (if configured)
  - [ ] Uses consistent naming
  - [ ] Comments explain complex logic
  - [ ] No console.log left for debugging

- [ ] **Functionality**
  - [ ] Does what it claims
  - [ ] Handles errors gracefully
  - [ ] Returns useful data
  - [ ] Validates inputs

- [ ] **Testing**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Error scenarios tested
  - [ ] Performance acceptable

- [ ] **Documentation**
  - [ ] Clear description
  - [ ] Dependencies listed
  - [ ] Metrics defined
  - [ ] Examples included

- [ ] **Integration**
  - [ ] Registered in ActionRegistry
  - [ ] Added to appropriate sequence
  - [ ] No conflicts with existing actions
  - [ ] README updated

---

## 📚 Reference Examples

### Good Example: setup-analytics.js
```javascript
✅ Clear naming (setupAnalytics)
✅ Good comments (what and why)
✅ Proper error handling
✅ Returns detailed results
✅ Uses environment variables safely
✅ Comprehensive logging
```

### Good Example: add-schema-markup.js
```javascript
✅ Focused purpose
✅ Iterates clearly
✅ Shows progress
✅ Validates inputs
✅ Returns count of changes
✅ Handles edge cases
```

---

## 🚀 Continuous Improvement

### Code Review Guidelines

When reviewing new actions:

1. **Does it solve the problem?**
   - Clear goal & metrics
   - Appropriate priority
   - Realistic timeline

2. **Is it well-written?**
   - Follows naming conventions
   - Good comments
   - Clean structure
   - No hardcoded values

3. **Is it tested?**
   - Unit tests pass
   - Integration verified
   - Error cases handled
   - Performance OK

4. **Is it documented?**
   - Clear description
   - Examples provided
   - Dependencies noted
   - Usage instructions

5. **Does it fit the system?**
   - Follows SkillAction pattern
   - Properly registered
   - No conflicts
   - README updated

---

## 💡 Pro Tips

1. **Copy the template** - Don't start from scratch
2. **Use existing actions as examples** - Follow proven patterns
3. **Test early, test often** - Catch issues early
4. **Log generously** - Users need feedback
5. **Document as you code** - Easier than later
6. **Validate inputs** - Fail fast, fail clearly
7. **Keep it simple** - One responsibility per action
8. **Reuse code** - Extract helper functions
9. **Handle errors** - Never silently fail
10. **Measure impact** - Define metrics upfront

---

## 🆘 When in Doubt

1. Look at existing actions for patterns
2. Check SKILL-ARCHITECTURE-GUIDE.md
3. Review NEW-FEATURE-CHECKLIST.md
4. Ask in code review
5. Reference this document

---

**Budoucí vývojáři ti budou děkovat za čisty, konzistentní kód!** 🙏
