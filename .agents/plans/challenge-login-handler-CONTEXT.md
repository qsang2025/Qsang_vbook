# Context Bundle: Challenge & Login Handler for vBook Extensions

## 1. Environment & Repository Baseline
- **Repository:** `Qsang_vbook` (`/home/antigravity/qsang2025/Qsang_vbook`)
- **Git Branch:** `feature/challenge-login-popup` (derived directly from `origin/main` at commit `2c3e368`)
- **Git Status:** Clean working tree.
- **Node.js Environment:** Linux x86_64, Node v24 LTS.
- **Validation Baseline:**
  ```
  npm run validate
  Đã kiểm tra 17 nguồn, 17 mục trong registry: PASS (0 cảnh báo).
  OK: plugin.json khớp với 17 nguồn trên đĩa.
  ```

---

## 2. API Contract & Runtime Constraints (`extension-api.md`)

### MD5 Checksum Verification
Both canonical copies of `extension-api.md` are identical:
```
982141b2e170b77bbef8f1d4b20cab25  extension-api.md
982141b2e170b77bbef8f1d4b20cab25  .agents/skills/vbook-extensions/reference/extension-api.md
```

### Analysis of Browser & Popup Capabilities in vBook Engine
An audit of `extension-api.md` (2,337 lines) reveals the exact engine capabilities:
1. **No Programmatic In-App UI Dialog / Browser Launch API**:
   - There is NO API such as `Engine.openBrowser(url)`, `Engine.showDialog(...)`, or `window.open(...)`.
   - JavaScript execution inside vBook runs within a sandboxed Rhino ES6 JavaScript engine (Android/iOS native wrapper).
   - The only occurrence of `type: "browser"` is within `download_links` on detail screens for ebook files, which instructs the native UI to open the URL in the in-app browser upon user tap.
2. **Headless WebView API (`Engine.newBrowser()`)**:
   - Method signature:
     - `var browser = Engine.newBrowser();`
     - `var doc = browser.launch(url, timeoutMs);` (waits for page load, returns Document)
     - `browser.launchAsync(url);`
     - `browser.waitUrl([".*pattern.*"], timeoutMs);`
     - `var doc = browser.html(waitMs);`
     - `var result = browser.callJs(codeStr, timeoutMs);` (returns string parsed as HtmlElement)
     - `browser.block([patternRegexes]);`
     - `browser.urls();`
     - `browser.loadHtml(baseUrl, htmlStr);`
     - `browser.setUserAgent(ua);`
     - `browser.close();`
   - Limitations: Runs headlessly in the background. If a Cloudflare challenge requires human interaction (e.g., interactive Turnstile checkbox or puzzle) or an interactive login form, `Engine.newBrowser()` cannot prompt the user.
3. **Cookie Jar Architecture & Sharing**:
   - `fetch(...)` automatically utilizes the app's native cookie jar. Any `Cookie` header passed is stored; `Set-Cookie` headers from responses are automatically persisted.
   - `localCookie.setCookie("name=value; path=/")` and `localCookie.getCookie()` manage cookies scoped to the extension's source domain.
   - **Crucial In-App Shared State**: In the mobile app, when a user opens the site via the in-app browser (by clicking the globe/browser icon in vBook) and passes Cloudflare or logs in, the resulting session cookies (specifically `cf_clearance`, session tokens, auth cookies) are stored in the app's shared cookie store. Subsequent requests from the extension's `fetch()` or `Engine.newBrowser()` inherit these cookies automatically if User-Agent is kept consistent (do NOT rotate UA).

---

## 3. Existing Shared Libraries (`lib/`) Survey

The repository provides several reference template libraries in `lib/`:
1. **`lib/fetch-helpers.js`**:
   - Current functions:
     - `defaultHeaders(referer)`: Sets standard Accept and Accept-Language headers. Respects `BASE_URL`.
     - `isChallengeDoc(doc)`: Detects Cloudflare challenge page via title matching (`/just a moment/i`, `"Chờ một chút"`) or `challenges.cloudflare.com` script presence.
     - `fetchViaBrowser(url)`: Headless retry loop with `Engine.newBrowser()`.
     - `fetchPage(url, options)`: Retries on 429 using `Retry-After`. Falls back to `fetchViaBrowser`. Note: Returns `null` on failure (which violates rule 6.5 if returned raw).
     - `fetchDoc(url, options)`: Returns `Document` or `null`.
     - `fetchWithFallback(url, mirrors)`: Iterates through mirrors.
   - **Gaps**: Lacks structured response objects distinguishing between network errors, Cloudflare challenges, and login walls. Lacks comprehensive header inspection (`cf-mitigated: challenge`, `cf-ray`). Does not provide standardized Vietnamese guidance strings.
2. **`lib/cleanHtml.js`**:
   - Chapter content sanitizer: strips tags (`<script>`, `<style>`, `<iframe>`, `<noscript>`), adverts, fixes punctuation, spacing, and un-censors obfuscated Vietnamese words (`ch*t` -> `chết`, `gi*t` -> `giết`).
3. **`lib/config-helpers.js`**:
   - Manages `BASE_URL`, `normalizeUrl(url)`, `absUrl(href)`, `cleanText(s)`, `storyItem(el)`, `storyItems(node)`, `nextPageToken(doc)`, and `pagedUrl(url, page)`.
4. **`lib/crypto.js`**:
   - Full AES, MD5, and CryptoJS pure JavaScript implementations for encrypted novel sources.

---

## 4. Target Extensions Survey & Diagnostics

### Target 1: `extensions/novel/sangtacviet/`
- **Location:** `extensions/novel/sangtacviet/`
- **Plugin Manifest:** v1, source `https://sangtacviet.app`.
- **Key Scripts:**
  - `detail.js`: Directly executes `var response = fetch(url); if (!response.ok) return Response.error("HTTP Error: " + response.status);`. If Cloudflare challenges with 403 or 503, fails immediately.
  - `chap.js`: Calls internal STV API with `x-stv-transport: app`, `x-stv-sign`, MD5 hash, and retry logic for translation code 7. If the web domain or API endpoint triggers Cloudflare WAF, fetch fails with HTTP error without guidance.

### Target 2: `extensions/novel/lacatruyen/`
- **Location:** `extensions/novel/lacatruyen/`
- **Plugin Manifest:** v1, source `https://lacatruyen.com`.
- **Key Scripts:**
  - `chap.js`: Employs 2-stage AES decryption (`MASTER_KEY`, `rs`, `ri`). Detects `notify === "not_login"` and `previewHtml`.
  - Current login handling:
    ```javascript
    if (notify === "not_login") {
        return Response.error("Chương yêu cầu đăng nhập. Vui lòng đăng nhập trên trình duyệt vBook hoặc điền TOKEN trong cài đặt extension.");
    }
    ```
  - Opportunity: Standardize detection and fallback via `challenge-handler.js`.

### Target 3: `extensions/novel/tiemtruyenchu/`
- **Location:** `extensions/novel/tiemtruyenchu/`
- **Plugin Manifest:** v1, source `https://tiemtruyenchu.cloud`.
- **Key Scripts:**
  - `chap.js`: Attempts fast API (`/api/prefetch-chapter/`, `/api/v1/chapters/content`), then fetches HTML, then falls back to `Engine.newBrowser()` to extract `document.cookie`.
  - Current guidance:
    ```javascript
    return Response.error("Tiệm Truyện Chữ yêu cầu đăng nhập tài khoản để đọc nội dung chương. Vui lòng mở Trình duyệt trong vBook truy cập https://tiemtruyenchu.cloud/login để đăng nhập hoặc điền Cookie vào phần Cài đặt nguồn.");
    ```
  - Opportunity: Unify browser cookie extraction and guidance with shared helper.

### Target 4: `extensions/novel/apptruyenchu/`
- **Location:** `extensions/novel/apptruyenchu/`
- **Plugin Manifest:** v1, source `https://apptruyenchu.com`.
- **Key Scripts:**
  - Uses `cleanHtml.js`, `config-helpers.js`, `fetch-helpers.js`, `helper.js`.
  - `chap.js`: Uses `getPage(url)` with retries and `fetchWithFallback(url, MIRROR_LIST)`. Checks for Next.js error `"Application error"`.
  - Fails when Cloudflare blocks or serves a challenge page.

### Target 5: `extensions/novel/biquge/`
- **Location:** `extensions/novel/biquge/` (Note: in `extensions/novel/`, not `chinese_novel/`).
- **Plugin Manifest:** v1, source `https://www.biquge.tw`.
- **Key Scripts:**
  - Uses `config-helpers.js`, `fetch-helpers.js`, `helper.js`.
  - `chap.js`: Uses `fetchDoc(url)`. Biquge frequently activates Cloudflare TLS checks and challenge pages. When blocked, `fetchDoc` returns null, failing with `"Không tải được chương: " + url`.

---

## 5. Developer Server Connectivity & Testing Report

- **Command executed:** `node scripts/cli.js connect`
- **Result:**
  ```
  ERROR: no server configured.
  -> Copy .agents/skills/vbook-extensions/scripts/servers.example.json to .agents/skills/vbook-extensions/scripts/servers.json...
  ```
- **Analysis:**
  - In the remote container sandbox, no physical mobile device running the vBook app is currently bridged via Wi-Fi/ADB.
  - Verification of syntax, engine compatibility, and packaging will be strictly validated via:
    1. Rhino ES6 static AST linter (`node scripts/cli.js validate`).
    2. Catalog and dependency integrity (`node scripts/cli.js build-catalog --check`).
    3. Automated packaging test (`node scripts/cli.js build extensions/<type>/<name>`).
  - **`cf_clearance` sharing mechanism on phone:**
    - On Android, vBook uses Android `WebView` and `CookieManager.getInstance()`. Both the in-app browser and the native network layer (OkHttp / HttpURLConnection) synchronize cookies with the app's default WebKit cookie store.
    - When a user taps the in-app browser icon for an extension, navigates to the host URL, completes the Turnstile/Cloudflare challenge, `cf_clearance` is stored into `CookieManager`.
    - Because the extension uses the system default User-Agent (as enforced by rule 6.10: "Không xoay User-Agent mặc định"), subsequent requests from `fetch()` carry the identical `cf_clearance` cookie and matching UA, allowing immediate clearance.

---

## 6. House Rules & Architectural Constraints (`AGENTS.md`)

1. **Rule 1: Rhino ES6 `load()` Constraint**:
   - `load('file.js')` only loads files from the top-level `src/` directory of the extension.
   - Non-recursive: A file loaded by `load()` **MUST NOT** call `load()`.
   - `lib/challenge-handler.js` must be self-contained and must NOT call `load()`.
2. **Build Lib-Inline Mechanism (§9)**:
   - Shared library lives in `lib/challenge-handler.js`.
   - `tools/cli/build.js` inspects `src/*.js` for `load('challenge-handler.js')` and automatically copies `lib/challenge-handler.js` into temporary `src/` during packaging.
3. **Pure Rhino ES6 Syntax**:
   - Only `var`, `function`, string concatenation with `+`.
   - Forbidden: `const`, `let`, `() => {}`, `...` (spread), `` `...` `` (template literals), `?.`, `??`, `async/await`, `.flat()`.
4. **Error Handling (§6.5)**:
   - Always return `Response.error("Thông báo tiếng Việt...")`, never `return null`.
5. **No User-Agent Rotation (§6.10)**:
   - Do NOT rotate User-Agent. Cloudflare binds `cf_clearance` strictly to the client's User-Agent.
6. **Version Bumping & Packaging Discipline (§7-8)**:
   - Whenever an extension source is updated:
     - Bump `metadata.version` in `extensions/<type>/<name>/plugin.json`.
     - Run `node scripts/cli.js build extensions/<type>/<name>`.
     - Regenerate root `plugin.json` via `node scripts/cli.js build-catalog`.
     - Commit `plugin.zip` alongside sources.
7. **Git Branching Discipline**:
   - All commits on `feature/challenge-login-popup`.
   - Never push or rebase to `main`.
