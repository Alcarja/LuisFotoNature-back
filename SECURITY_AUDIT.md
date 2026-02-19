# Security Audit Report — LuisFotoNature Backend

**Date:** February 19, 2026
**Target:** Production deployment with HTTPS

---

## CRITICAL (Fix before deploying)

### 2. Hardcoded IPs in CORS and email URLs

**Files:** `app.js:16`, `emailController.js:86`, `set-cors.js:16`
Replace hardcoded `http://46.225.161.233` with `process.env.FRONTEND_URL` and use HTTPS in production.

---

### 5. No rate limiting

**Global**
No protection against brute force on `/login`, comment spam, or upload abuse. Add `express-rate-limit`:

- Auth endpoints: 5-10 req/min per IP
- Public endpoints: 30 req/min per IP
- Upload endpoints: 5 req/min per user

### 6. No input validation

**Files:** All controllers
No email format validation, no password strength rules, no content length limits, no sanitization against XSS. Add a validation library like `zod` or `joi` to validate all request bodies.

### 10. Cookie configuration

**File:** `controllers/authController.js:17-22`

- Change `sameSite: "lax"` to `"strict"` for auth cookies
- Ensure `secure: true` is always set in production
- Don't send token in both cookie AND JSON response body — pick one

### 12. Error messages leak internals

**Files:** All controllers
`res.status(500).json({ error: err.message })` can expose database structure, constraint names, etc. Return generic messages to the client, log details server-side.

### 15. Database SSL config

**File:** `db/client.js:10`
`ssl: { rejectUnauthorized: false }` skips certificate validation. Set to `true` in production.

---
