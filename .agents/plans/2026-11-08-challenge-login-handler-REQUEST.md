# User Request: Challenge & Login Handler for vBook Extensions

## Overview
- **Goal:** Build a shared library `lib/challenge-handler.js` for Cloudflare challenge + login page detection and handling within vBook extension API constraints.
- **Repository:** `Qsang_vbook` (`/home/antigravity/qsang2025/Qsang_vbook`)
- **Active Branch:** `feature/challenge-login-popup` (branched from `origin/main`)

---

## Background & Objectives
Many novel reading sites employ Cloudflare protections (Turnstile, managed challenge, JS challenge, 403 / 503 HTTP status) or require user accounts (paywalled/VIP chapters, anti-bot login gates). In the vBook mobile application:
1. Extensions execute in a Rhino ES6 JavaScript environment without direct DOM access to open modal dialogs or interactive popups programmatically.
2. The headless browser (`Engine.newBrowser()`) can execute JS and extract DOM/cookies in the background, but cannot show a visible challenge/captcha UI to the user when human interaction is required.
3. The vBook application provides an in-app browser with a shared cookie jar (`localCookie` and standard HTTP client share session cookies like `cf_clearance`).
4. Therefore, extensions need a unified, resilient mechanism to:
   - Accurately detect Cloudflare challenges (headers, status codes, HTML title/body patterns).
   - Accurately detect login requirement gates (redirects, login forms, error codes, VIP markers).
   - Attempt automated resolution via headless `Engine.newBrowser()` if possible.
   - If interactive intervention is required, fail gracefully with `Response.error(...)` providing clear Vietnamese instructions on how to open the in-app browser, pass verification or log in, and return to read.

---

## Definition of Done (DoD)
1. **API Contract Verification**:
   - Check `extension-api.md` and `.agents/skills/vbook-extensions/reference/extension-api.md` (verify exact md5 match).
   - Document the API limitations regarding browser popups and dialogs (confirming no programmatic interactive popup API exists in vBook JS sandbox).
2. **Shared Library (`lib/challenge-handler.js`)**:
   - Strictly Rhino ES6 compliant: only `var`, `function`, string concatenation with `+`; no arrow functions, template literals, optional chaining, async/await, or modern syntax.
   - Inlined at build time into `src/` of target extensions per AGENTS.md §9.
   - Rule 1 compliance: no nested `load()` calls inside `lib/challenge-handler.js`.
   - Reuses and expands detection logic:
     - `isChallengeText(html/text)`
     - `isChallengeDoc(doc)`
     - HTTP status codes (403, 503, 429) and headers (`cf-mitigated: challenge`, `cf-ray`)
     - Login page indicators (`/login`, `/dang-nhap`, login forms, paywall prompts).
   - Headless fallback support via `Engine.newBrowser()` when available.
   - User guidance messages in Vietnamese clearly explaining the exact steps:
     - Open in-app browser via the browser icon.
     - Complete Cloudflare verification or log into account.
     - Return to vBook and refresh/retry.
3. **Integration into Target Extensions**:
   - `extensions/novel/sangtacviet/` (Cloudflare protection)
   - `extensions/novel/lacatruyen/` (Account login & token handling)
   - `extensions/novel/tiemtruyenchu/` (Login & cookie session)
   - `extensions/novel/apptruyenchu/` (Cloudflare & Next.js error fallback)
   - `extensions/novel/biquge/` (Cloudflare TLS/challenge protection)
   - Bump extension versions in each target `plugin.json` and rebuild `plugin.zip` with `scripts/cli.js build`.
4. **Validation & Quality Gates**:
   - `npm run validate` PASS with 0 errors.
   - `node scripts/cli.js build-catalog --check` OK (root `plugin.json` in sync).
   - Test/report on developer server connectivity and `cf_clearance` sharing mechanisms.
5. **Git & Push Rules**:
   - Changes committed strictly on `feature/challenge-login-popup`.
   - Pushed ONLY to `origin/feature/challenge-login-popup`.
   - No push to `main`, no rebase `main`, no merge to `main`.

---

## Explicit Prohibitions (What Must NOT Be Done)
- DO NOT push to `main`, do NOT merge to `main`, do NOT rebase `main`.
- DO NOT edit root `plugin.json` manually (always generate via `node scripts/cli.js build-catalog`).
- DO NOT use modern JavaScript syntax (ES2015+ features unsupported by Rhino ES6).
- DO NOT violate the single-depth `load()` rule (files loaded via `load()` must not call `load()`).
- DO NOT commit credentials, tokens, or personal session cookies.
