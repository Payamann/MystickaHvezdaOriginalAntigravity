# Quick Start Guide for Security Implementation

**For: Claude Haiku 4.5**
**Branch:** `claude/install-vercel-skills-bZr30`

---

## What to Do First

You have a detailed implementation plan in `IMPLEMENTATION_PLAN.md`. Follow these steps:

### Step 1: Read the Full Plan (5 minutes)
```bash
cat IMPLEMENTATION_PLAN.md
```

### Step 2: Start with Phase 1 - Critical Security Fixes (most important)

The 8 critical fixes are:
1. **Content Security Policy** (CSP headers) - `/server/index.js`
2. **CSRF Token Protection** - `/server/index.js`
3. **Fix Stripe Webhook Order** - `/server/payment.js`
4. **Remove Hardcoded Admin Email** - `/server/admin.js`
5. **SQL Injection Protection** - `/server/routes/user.js`
6. **AI Rate Limiting** - `/server/index.js`
7. **Remove Sensitive Data from Errors** - All routes
8. **HTTPS Enforcement** - `/server/index.js`

### Step 3: For Each Task:
1. Open the file mentioned
2. Find the code location (line numbers in plan)
3. Follow the exact code examples
4. Test the change
5. Commit with: `git commit -m "Task X.X: [description]"`

### Step 4: Install New Dependencies
```bash
npm install xss csrf uuid
npm install --save-dev supertest
```

### Step 5: Update Environment Variables
Add these to `.env`:
```
CSRF_SECRET=generate-random-string-here
ADMIN_EMAIL=your-admin@example.com
SUPPORT_EMAIL=support@example.com
```

### Step 6: Run Tests After Each Phase
```bash
npm test
```

---

## How the Plan is Organized

### **Phase 1: Critical Security Fixes** (8 tasks, ~2 hours)
⚠️ **START HERE** - These fix security vulnerabilities

- Task 1.1: CSP headers
- Task 1.2: CSRF protection
- Task 1.3: Stripe webhook verification
- Task 1.4: Remove hardcoded emails
- Task 1.5: SQL injection protection
- Task 1.6: AI rate limiting
- Task 1.7: Error message security
- Task 1.8: HTTPS enforcement

### **Phase 2: Input Validation** (6 tasks, ~1.5 hours)
Validates all user input

- Task 2.1: Comprehensive input validation
- Task 2.2: XSS protection
- Task 2.3: Stripe event validation
- Task 2.4: Password strength
- Task 2.5: Email content sanitization
- Task 2.6: File upload validation

### **Phase 3: Authentication** (3-4 tasks, ~1 hour)
Improves auth flow

- Task 3.1: Token refresh
- Task 3.2: Session management
- Task 3.3: Auth rate limiting
- Task 3.4: 2FA (optional)

### **Phase 4: DoS Protection** (3 tasks, ~30 min)
Protects against attacks

- Task 4.1: Global rate limiting
- Task 4.2: Request size limits
- Task 4.3: API gateway protection

### **Phase 5: API Security** (3 tasks, ~45 min)
Hardens API endpoints

- Task 5.1: API versioning
- Task 5.2: Request/response logging
- Task 5.3: Security headers validation

### **Phase 6: Performance** (2 tasks, ~45 min)
Improves speed

- Task 6.1: Compression & caching
- Task 6.2: Database optimization

### **Phase 7: Testing** (2 tasks, ~1 hour)
Adds tests & verification

- Task 7.1: Integration tests
- Task 7.2: Security checklist

---

## File Structure for New Files

Create these new files as you go:

```
/server/
├── utils/
│   ├── validation.js        (Task 2.1)
│   ├── token.js             (Task 3.1)
│   ├── sessions.js          (Task 3.2)
│   ├── audit.js             (Task 5.2)
│
/tests/
├── security.test.js         (Task 7.1)
├── validation.test.js       (Task 7.1)
│
SECURITY_CHECKLIST.md        (Task 7.2)
IMPLEMENTATION_PLAN.md       (already created)
QUICK_START_GUIDE.md         (this file)
```

---

## Testing Your Work

### After Phase 1 (Critical Fixes):
```bash
# Test that headers are present
curl -I http://localhost:3001/ | grep -i "content-security-policy"

# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3001/api/auth/login; done
```

### After Phase 2 (Validation):
```bash
npm test -- validation.test.js
```

### After All Phases:
```bash
npm test
npm run build  # if applicable
```

---

## Commit Messages

Follow this pattern:

```bash
git commit -m "Task 1.1: Implement Content Security Policy headers"
git commit -m "Task 1.2: Add CSRF token protection middleware"
git commit -m "Task 1.3: Move Stripe webhook verification before processing"
git commit -m "Task 1.4: Remove hardcoded admin email from code"
# ... and so on
```

---

## Push to Remote

After each phase (or final):
```bash
git push -u origin claude/install-vercel-skills-bZr30
```

---

## Key Files to Modify Most

| File | Tasks | Lines Changed |
|------|-------|--------------|
| `/server/index.js` | 1.1, 1.2, 1.6, 1.8, 4.1, 4.2, 4.3, 5.3 | ~200 |
| `/server/middleware.js` | 3.1, 3.2 | ~50 |
| `/server/routes/auth.js` | 2.4, 3.1, 3.2, 3.3 | ~150 |
| `/server/routes/*.js` (all) | 2.1, 2.2, 2.3 | ~200 |
| `/server/payment.js` | 1.3, 2.3 | ~50 |
| NEW: `/server/utils/validation.js` | 2.1, 2.2, 2.4, 2.6 | ~200 |
| NEW: `/server/utils/token.js` | 3.1 | ~80 |
| NEW: Tests | 7.1 | ~150 |

---

## Common Issues & Solutions

### Issue: "Module not found" error
**Solution:** Check that new files are created in correct directories

### Issue: Tests fail
**Solution:**
- Verify all dependencies installed: `npm install xss csrf uuid`
- Check environment variables in `.env`
- Ensure middleware imports are correct

### Issue: CSP blocks resources
**Solution:**
- Check IMPLEMENTATION_PLAN.md Task 1.1 for allowed domains
- Update CSP directives for any new CDN/API integration

### Issue: Rate limiting too strict
**Solution:**
- Adjust `max` parameter in rate limiter
- Increase `windowMs` for longer periods

---

## When You're Done

1. All tests passing: ✅
2. All code committed with clear messages: ✅
3. SECURITY_CHECKLIST.md updated: ✅
4. Pushed to branch: `git push -u origin claude/install-vercel-skills-bZr30`
5. Ready for review! 🎉

---

## Need Help?

- Reference `IMPLEMENTATION_PLAN.md` for exact code examples
- Check test files for expected behavior
- Review actual error messages for guidance
- Each task is self-contained and can be done in order

---

## Expected Outcomes

After completing all tasks:

✅ All 8 critical security vulnerabilities fixed
✅ All user input validated
✅ Authentication properly secured
✅ Rate limiting prevents abuse
✅ Error messages don't leak data
✅ Audit trail for sensitive operations
✅ Tests verify all security measures
✅ Production-ready security posture

---

**Good luck! You've got this! 🚀**
