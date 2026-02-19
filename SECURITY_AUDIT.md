# Security Audit Report — LuisFotoNature Backend

**Date:** February 19, 2026
**Target:** Production deployment with HTTPS

---

## CRITICAL (Fix before deploying)

### 1. Exposed secrets in git repository
**File:** `.env`
Your `.env` file with all production secrets (DB credentials, API keys, JWT secret) is in the repo. After deploying:
- Rotate ALL secrets (DB password, AWS keys, Brevo key, JWT secret)
- Remove `.env` from git history with `git filter-branch` or `BFG Repo-Cleaner`
- Ensure `.env` is in `.gitignore`

### 2. Hardcoded IPs in CORS and email URLs
**Files:** `app.js:16`, `emailController.js:86`, `set-cors.js:16`
Replace hardcoded `http://46.225.161.233` with `process.env.FRONTEND_URL` and use HTTPS in production.

### 3. Unprotected email endpoints
**File:** `routes/emailRoutes.js`
`sendPostCampaignEmail` and `getAllSuscribers` have **no auth middleware** — anyone can send campaigns to your entire list or read subscriber data. Add `authMiddleware` + `adminMiddleware`.

---

## HIGH (Fix soon after deploying)

### 4. JWT secret has weak default fallback
**File:** `services/authService.js:7`
```js
const JWT_SECRET = process.env.JWT_SECRET || "super-secret";
```
Remove the fallback. Crash on startup if `JWT_SECRET` is missing or too short (<32 chars).

### 5. No rate limiting
**Global**
No protection against brute force on `/login`, comment spam, or upload abuse. Add `express-rate-limit`:
- Auth endpoints: 5-10 req/min per IP
- Public endpoints: 30 req/min per IP
- Upload endpoints: 5 req/min per user

### 6. No input validation
**Files:** All controllers
No email format validation, no password strength rules, no content length limits, no sanitization against XSS. Add a validation library like `zod` or `joi` to validate all request bodies.

### 7. Inconsistent ID parsing
**Files:** `postController.js:98`, `commentController.js:61`
Some endpoints use `parseInt(postId)`, others pass the raw string. Validate all numeric IDs are actually numbers before querying.

### 8. npm dependency vulnerabilities
Run `npm audit` — there are multiple known vulnerabilities in dependencies. Run `npm audit fix` to patch.

---

## MEDIUM (Important improvements)

### 9. No security headers
**File:** `app.js`
Add `helmet` middleware for HSTS, X-Content-Type-Options, X-Frame-Options, etc:
```js
import helmet from "helmet";
app.use(helmet());
```

### 10. Cookie configuration
**File:** `controllers/authController.js:17-22`
- Change `sameSite: "lax"` to `"strict"` for auth cookies
- Ensure `secure: true` is always set in production
- Don't send token in both cookie AND JSON response body — pick one

### 11. Presigned URL validation
**File:** `controllers/uploadController.js`
No validation that `contentType` is actually an image type, and `filename` could contain path traversal (`../`). Whitelist allowed content types and sanitize filenames.

### 12. Error messages leak internals
**Files:** All controllers
`res.status(500).json({ error: err.message })` can expose database structure, constraint names, etc. Return generic messages to the client, log details server-side.

### 13. No env var validation on startup
**File:** `server.js`
App silently fails at runtime if env vars are missing. Validate all required vars exist on startup.

### 14. Hardcoded admin emails
**File:** `services/email.js:13-16`
Move to environment variable.

### 15. Database SSL config
**File:** `db/client.js:10`
`ssl: { rejectUnauthorized: false }` skips certificate validation. Set to `true` in production.

---

## LOW (Nice to have)

### 16. No token invalidation on logout
**File:** `services/authService.js:57-64`
Logout doesn't actually invalidate the JWT. Consider a Redis-backed token blacklist.

### 17. No request timeouts
**File:** `server.js`
Add `server.setTimeout(30000)` to prevent slow requests from hanging.

### 18. No structured logging
**Global**
Replace `console.log/error` with a structured logger like `winston` or `pino` for production monitoring.

### 19. S3 CORS too permissive
**File:** `scripts/set-cors.js:18`
`AllowedHeaders: ["*"]` — restrict to `["Content-Type", "Authorization"]`.

### 20. Inconsistent token expiration
**File:** `services/authService.js:32-49`
Registration gives 1-hour tokens, login gives 5-day tokens. Standardize.

---

## Priority order

1. Rotate all exposed secrets
2. Protect email endpoints with auth middleware
3. Add `helmet` for security headers
4. Add rate limiting
5. Replace hardcoded IPs with env vars (HTTPS)
6. Add input validation
7. Fix error message leakage
8. Run `npm audit fix`
9. Validate env vars on startup
10. Everything else
