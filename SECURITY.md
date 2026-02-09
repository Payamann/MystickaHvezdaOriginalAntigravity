# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in Mystická Hvězda, please report it responsibly:

1. **Do NOT** create a public GitHub issue for security vulnerabilities.
2. Email details to the project maintainer directly.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Expected Response

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix timeline:** Depends on severity
  - Critical: Within 24 hours
  - High: Within 1 week
  - Medium: Within 1 month
  - Low: Next release cycle

## Scope

### In Scope
- Authentication and authorization bypass
- Cross-site scripting (XSS)
- Server-side injection (SQL, command, template)
- Sensitive data exposure (API keys, tokens, PII)
- Cross-site request forgery (CSRF)
- Insecure direct object references
- Payment/Stripe integration vulnerabilities

### Out of Scope
- Denial of Service (DoS) attacks
- Social engineering
- Physical security
- Third-party service vulnerabilities (Stripe, Supabase, Google)
- Vulnerabilities requiring physical access

## Security Measures in Place

- JWT-based authentication with centralized secret management
- Content Security Policy (CSP) headers
- Rate limiting on API and auth endpoints
- Input sanitization for XSS prevention
- Prompt injection protection for AI endpoints
- HSTS and upgrade-insecure-requests headers
- Database-driven admin role verification
