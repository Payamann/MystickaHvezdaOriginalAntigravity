# ✅ Checklist for Adding New Features to seo-organic-growth Skill

Use this checklist every time you add a new feature to ensure consistency and quality.

---

## 📋 Pre-Implementation Planning (10 minutes)

### Feature Definition
- [ ] **Clear Goal**: What problem does this solve?
  - Example: "Increase email subscribers by 40% with targeted popups"

- [ ] **Metrics**: How will we measure success?
  - Example: ["email_subscribers", "newsletter_signup_rate"]

- [ ] **Dependencies**: What must run before this?
  - Example: ["setup-google-analytics"] (needs tracking)

- [ ] **Timeline**: How long should this take?
  - [ ] Quick-win (1-2 weeks)
  - [ ] Medium (1-3 months)
  - [ ] Strategic (3-12 months)

### Documentation
- [ ] **Title**: Create action name
  - Good: "Setup Mailchimp Email Automation"
  - Bad: "Email stuff"

- [ ] **Description**: One sentence describing what it does
  - Good: "Configure automated email sequences for newsletter subscribers"
  - Bad: "Does email"

---

## 💻 Implementation Phase (30 minutes - 2 hours)

### Step 1: Create Action Script (15-30 min)

- [ ] **Copy template**:
  ```bash
  cp server/scripts/.action-template.js server/scripts/your-action.js
  ```

- [ ] **Update metadata**:
  - [ ] Set `id` (kebab-case): `your-action-id`
  - [ ] Set `name` (readable): "Your Action Name"
  - [ ] Set `category`: Pick one:
    - `'analytics'` - Tracking & data
    - `'seo'` - Search engine optimization
    - `'content'` - Content creation/optimization
    - `'conversion'` - Conversion funnels/rates
    - `'email'` - Email marketing

  - [ ] Set `priority`: Pick one:
    - `'quick-win'` - Do first (1-2 weeks)
    - `'medium'` - Build on quick wins (1-3 months)
    - `'strategic'` - Long-term (3-12 months)

  - [ ] Set `estimatedTime`: Pick one:
    - `'5min'` - Quick task
    - `'15min'` - Short task
    - `'30min'` - Medium task
    - `'1hour'` - Longer task

- [ ] **Add dependencies**:
  ```javascript
  dependencies: ['setup-google-analytics'],
  ```

- [ ] **Add metrics**:
  ```javascript
  metrics: ['organic_traffic', 'conversion_rate'],
  ```

- [ ] **Implement handler function**:
  - [ ] Check environment variables
  - [ ] Read/modify files
  - [ ] Log progress (console.log)
  - [ ] Return result object
  - [ ] Handle errors properly

- [ ] **Code quality**:
  - [ ] Add comments explaining logic
  - [ ] Use consistent naming
  - [ ] Error messages are clear
  - [ ] Follow existing code style
  - [ ] No hardcoded paths (use `path.join`)

### Step 2: Test Your Action (15 minutes)

- [ ] **Unit test**:
  ```bash
  node -e "
  import('./server/scripts/your-action.js').then(m => {
    m.yourActionId.execute().then(r => console.log(r));
  });
  "
  ```

- [ ] **Verify output**:
  - [ ] Returns success: true
  - [ ] Files created/modified as expected
  - [ ] No console errors
  - [ ] Error handling works

- [ ] **Test with dependencies**:
  ```bash
  node -e "
  import { SEQUENCES } from './server/skills/skill-framework.js';
  registry.executeSequence(['your-action-id']);
  "
  ```

---

## 📋 Registration & Integration (15 minutes)

### Step 3: Register Action

- [ ] **Import in skill-framework.js**:
  ```javascript
  import { yourActionId } from '../scripts/your-action.js';
  ```

- [ ] **Register**:
  ```javascript
  registry.register(yourActionId);
  ```

- [ ] **Add to sequence** (if appropriate):
  ```javascript
  SEQUENCES.seoFoundation.push('your-action-id');
  // OR create new sequence if needed
  ```

### Step 4: Documentation

- [ ] **Update SKILL-ARCHITECTURE-GUIDE.md**:
  - [ ] Add example if new pattern
  - [ ] Update directory structure if files added

- [ ] **Add to Skills README**:
  ```bash
  node server/skills/generate-action-docs.js
  ```

- [ ] **Update SEO-OPTIMIZATION-QUICK-START.md** (if relevant):
  - [ ] Add step-by-step instructions
  - [ ] Include expected results

---

## 🧪 Quality Assurance (15 minutes)

### Code Review Checklist

- [ ] **Functionality**:
  - [ ] Does what it says it does
  - [ ] Returns correct data structure
  - [ ] Handles errors gracefully

- [ ] **Compatibility**:
  - [ ] Works with existing code
  - [ ] Dependencies are satisfied
  - [ ] No conflicts with other actions

- [ ] **Documentation**:
  - [ ] Clear description
  - [ ] Comments explain complex logic
  - [ ] Error messages are helpful

- [ ] **Performance**:
  - [ ] Doesn't take too long (matches estimatedTime)
  - [ ] Doesn't use excessive memory
  - [ ] Scales to large data

- [ ] **Security**:
  - [ ] No hardcoded secrets/passwords
  - [ ] Uses environment variables for config
  - [ ] No SQL injection vulnerabilities
  - [ ] Proper file permissions

### Integration Testing

- [ ] **Run full sequence**:
  ```bash
  npm run test:skill -- seoFoundation
  ```

- [ ] **Check for regressions**:
  - [ ] Other actions still work
  - [ ] Documentation is accurate
  - [ ] Git history is clean

---

## 📊 Metrics & Success (10 minutes)

### Baseline
- [ ] Establish current metric values:
  ```
  Before: organic_traffic = X
  Before: conversion_rate = Y%
  ```

### Goals
- [ ] Set 3-month goal:
  ```
  Goal (3m): organic_traffic = X * 1.3
  Goal (3m): conversion_rate = Y% * 1.5
  ```

### Tracking
- [ ] Create dashboard metric:
  - [ ] Define measurement method
  - [ ] Set update frequency (daily/weekly)
  - [ ] Create dashboard/report

---

## 🚀 Deployment & Communication (5 minutes)

### Git Workflow

- [ ] **Commit changes**:
  ```bash
  git add .
  git commit -m "Add [action-name] feature

  Implements: [What it does]
  Category: [Category]
  Metrics: [What improves]
  Timeline: [Quick-win/Medium/Strategic]

  Related: [GitHub issue if applicable]"
  ```

- [ ] **Push to branch**:
  ```bash
  git push -u origin claude/custom-skills-builder-YMdaN
  ```

### Communication

- [ ] **Update team** (if applicable):
  - [ ] Announce new feature
  - [ ] Share documentation link
  - [ ] Provide example usage

- [ ] **Track in issues**:
  - [ ] Link to implementation
  - [ ] Add success metrics
  - [ ] Set review date

---

## 📈 Post-Launch Monitoring (Ongoing)

### Week 1
- [ ] Monitor execution logs for errors
- [ ] Check that metrics are being tracked
- [ ] Collect user feedback

### Month 1
- [ ] Review baseline vs. actual metrics
- [ ] Identify any issues/improvements
- [ ] Document lessons learned

### Quarter 1
- [ ] Full metric analysis
- [ ] ROI calculation
- [ ] Decision: Expand, Iterate, or Archive

---

## 🎓 Examples of Good Implementations

### Example 1: analytics-setup.js
```
✅ Clear purpose: Setup GA4 tracking
✅ Well-documented handler function
✅ Returns detailed results
✅ Good error messages
✅ Proper logging of progress
✅ Validates environment variables
```

### Example 2: schema-markup.js
```
✅ Focused on one task: Add schemas
✅ Iterates through pages
✅ Shows progress with console.log
✅ Returns count of changes
✅ Handles missing files gracefully
```

---

## 🔧 Troubleshooting

### Action won't run?
- [ ] Check dependencies are in registry
- [ ] Verify environment variables set
- [ ] Check file paths are correct
- [ ] Review error message carefully

### Results not matching expectations?
- [ ] Check handler function logic
- [ ] Verify dependencies ran successfully
- [ ] Test with manual values first
- [ ] Add more console.log statements

### Performance issues?
- [ ] Profile the handler function
- [ ] Check for unnecessary loops
- [ ] Reduce file I/O if possible
- [ ] Cache expensive computations

### Integration problems?
- [ ] Test action in isolation first
- [ ] Verify no conflicting actions
- [ ] Check for side effects
- [ ] Review error logs

---

## ✨ Best Practices Summary

1. **Keep actions focused** - One responsibility per action
2. **Use standard patterns** - Follow the template
3. **Document well** - Clear descriptions and comments
4. **Test thoroughly** - Unit and integration tests
5. **Handle errors gracefully** - Try-catch and validation
6. **Return useful data** - Include summary/count
7. **Log progress** - User needs feedback
8. **Measure impact** - Define metrics upfront
9. **Update documentation** - Auto-generate when possible
10. **Get feedback** - Ask for code review before merging

---

## 📚 Related Documents

- `SKILL-ARCHITECTURE-GUIDE.md` - Architecture & design
- `SEO-ORGANIC-GROWTH-STRATEGY.md` - Overall strategy
- `SEO-OPTIMIZATION-QUICK-START.md` - Implementation guide
- `server/scripts/.action-template.js` - Template to copy

---

## 💬 Questions?

Refer to:
1. Existing actions as examples
2. SKILL-ARCHITECTURE-GUIDE.md for patterns
3. Template file for standard structure
4. GitHub issues for known problems

---

**Use this checklist for EVERY new feature = consistent, high-quality skill!** ✅
