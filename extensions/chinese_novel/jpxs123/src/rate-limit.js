// rate-limit.js — Helper dung chung: pacing + backoff + cooldown khi bi chan
// theo IP (rate-limit). LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Boi canh: qimao.com chan IP dien thoai bang HTTP 405 sau ~6-10 request nhanh
// (co 2 song song), block keo dai > 2 gio (2026-11-09). Day la rate-limit theo IP
// cua WAF, KHONG phai Cloudflare challenge, KHONG phai login — cach vuot challenge
// cu (challenge-handler.js, browser fallback) khong co tac dung, retry don dap
// chi keo dai block. Chi tiet day du: work/ext-review/RATE-LIMIT-RESEARCH.md.
//
// Quy tac build (AGENTS.md muc 9): file nay chi la nguon mau o repo root. Buoc build
// PHAI copy/inline no vao thu muc src/ cua tung extension truoc khi dong plugin.zip,
// vi load() cua vBook chi load file o top level src/ trong cung extension, khong de
// quy, va file duoc load khong duoc load them file khac. Trong script dung no, viet
// o dau file:
//     nap file config.js truoc (neu can BASE_URL), roi nap file rate-limit.js.
// (Khong can config.js neu khong dung BASE_URL.)
//
// GIOI HAN QUAN TRONG (doc ky truoc khi dung):
// 1. Cooldown luu trong localStorage — ma localStorage cua vBook la THEO TUNG
//    EXTENSION, nen cooldown chi co tac dung trong cung mot extension (vd. chi
//    qimao nho duoc qimao dang bi chan; extension khac khong biet). Khong dung
//    de chia se trang thai giua cac extension.
// 2. Cac ham tinh toan (rateLimitDelay/backoffMs/cooldown) KHONG tu goi fetch —
//    caller van phai tu fetch lai. Rieng pacedFetch() (cuoi file) la wrapper
//    hoan chinh: kiem tra cooldown -> nghi jitter -> fetch -> retry -> tra ve
//    ca ma HTTP (diem ma fetchPage() khong lam duoc).
// 3. sleep() la API runtime cua vBook; neu moi truong khong co sleep thi
//    rateLimitDelay() chi bo qua, khong crash.
// 4. Khong xoay User-Agent o day (quy tac 10 AGENTS.md) — block theo IP thi doi
//    UA cung vo ich.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// --- Delay co jitter truoc moi request --------------------------------------
// Nghi ngau nhien truoc moi request de khong bi coi la bot (pacing tu request
// dau tien — khi luat rate-limit da kich hoat thi dung gui cung khong go block
// ngay). Mac dinh 500-1500ms; truyen minMs/maxMs khac cho host nhay cam
// (vd. qimao: 2000-3000ms). Tra ve so ms da nghi (0 neu khong nghi duoc).
function rateLimitDelay(host, minMs, maxMs) {
    var lo = 500;
    var hi = 1500;
    if (typeof minMs === "number" && !isNaN(minMs) && minMs >= 0) lo = Math.floor(minMs);
    if (typeof maxMs === "number" && !isNaN(maxMs) && maxMs >= 0) hi = Math.floor(maxMs);
    if (hi < lo) {
        var tmp = lo;
        lo = hi;
        hi = tmp;
    }
    var ms = lo + Math.floor(Math.random() * (hi - lo + 1));
    try {
        if (typeof sleep !== "undefined" && sleep) {
            sleep(ms);
        } else {
            return 0;
        }
    } catch (e) {
        return 0;
    }
    try {
        if (host) console.log("rateLimitDelay " + host + ": nghi " + ms + "ms");
    } catch (e2) {
    }
    return ms;
}

// --- Ma HTTP nao thi dang retry ---------------------------------------------
// true voi 429 (qua nhieu request), 405 (mot so WAF dung 405 thay cho 429 —
// vd. qimao), 503 (tam dung dich vu). false voi con lai, ke ca 403 (403 thuong
// la challenge/login, xu ly bang challenge-handler.js chu khong phai retry).
function shouldRetryStatus(status) {
    return status === 429 || status === 405 || status === 503;
}

// --- Backoff ham mu + jitter ------------------------------------------------
// Tinh thoi gian cho truoc khi retry lan thu `attempt` (attempt dem tu 0).
// Khong co Retry-After: 2^attempt giay (lan 0: 1s, lan 1: 2s, lan 2: 4s,
// lan 3: 8s...) + jitter 0-1000ms, tran 30 giay.
// Co Retry-After: ton trong header do — dang so giay ("120") hoac HTTP date
// ("Wed, 21 Oct 2026 07:28:00 GMT"); gia tri am / qua khu / khong doc duoc
// thi roi ve backoff ham mu. Tran cung 30 giay.
function backoffMs(attempt, retryAfterHeader) {
    var MAX_WAIT = 30000;
    var n = 0;
    if (typeof attempt === "number" && !isNaN(attempt) && attempt > 0) {
        n = Math.floor(attempt);
    }
    if (retryAfterHeader !== null && retryAfterHeader !== undefined && retryAfterHeader !== "") {
        var h = String(retryAfterHeader);
        var wait = -1;
        // Dang 1: so giay nguyen.
        if (/^\s*\d+\s*$/.test(h)) {
            wait = parseInt(h, 10) * 1000;
        } else {
            // Dang 2: HTTP date.
            var parsed = Date.parse(h);
            if (!isNaN(parsed)) {
                wait = parsed - Date.now();
            }
        }
        if (wait >= 0) {
            if (wait > MAX_WAIT) wait = MAX_WAIT;
            return wait;
        }
        // Header khong doc duoc / da qua han -> roi ve backoff ham mu ben duoi.
    }
    var base = 1000 * Math.pow(2, n);
    var jitter = Math.floor(Math.random() * 1000);
    var total = base + jitter;
    if (total > MAX_WAIT) total = MAX_WAIT;
    return total;
}

// --- Cooldown theo host (localStorage) ---------------------------------------
// Khi gap 405/429 thi ghi lai "host nay dang bi chan toi thoi diem X" de lan
// goi sau kiem tra truoc, fail nhanh bang loi tieng Viet thay vi gui request
// (moi request gui them khi dang bi chan deu co the keo dai cua so block).
// GIOI HAN: localStorage theo tung extension (xem dau file) — cooldown chi
// nho trong cung extension da ghi no. Khong co localStorage (moi truong la)
// thi cac ham tra ve an toan: khong block, khong crash.
function rlCooldownKey(host) {
    return "rl_blocked_" + String(host || "").replace(/[^A-Za-z0-9._-]/g, "_");
}

// Ghi cooldown cho host trong `ms` mili-giay ke tu bay gio. Tra true neu ghi
// duoc, false neu khong co localStorage hoac ghi loi.
function setCooldown(host, ms) {
    try {
        if (typeof localStorage === "undefined" || !localStorage) return false;
        var dur = 0;
        if (typeof ms === "number" && !isNaN(ms) && ms > 0) dur = Math.floor(ms);
        localStorage.setItem(rlCooldownKey(host), String(Date.now() + dur));
        return true;
    } catch (e) {
        return false;
    }
}

// Con bao nhieu mili-giay nua moi het cooldown (0 = khong bi chan / het han /
// khong doc duoc). Gia tri hong trong storage thi coi nhu khong bi chan.
function cooldownRemainingMs(host) {
    try {
        if (typeof localStorage === "undefined" || !localStorage) return 0;
        var raw = localStorage.getItem(rlCooldownKey(host));
        if (!raw) return 0;
        var until = parseInt(String(raw), 10);
        if (isNaN(until)) return 0;
        var remain = until - Date.now();
        return remain > 0 ? remain : 0;
    } catch (e) {
        return 0;
    }
}

// Host co dang trong thoi gian cooldown khong.
function isCoolingDown(host) {
    return cooldownRemainingMs(host) > 0;
}

// --- Co nen dung browser fallback khong --------------------------------------
// Browser fallback (Engine.newBrowser) chay CUNG IP voi fetch thuong, nen khi
// bi chan theo IP (405/429) thi WebView cung bi chan — thu browser chi them
// request vao dung host dang block. Chi dung browser khi la challenge/login
// (403 co marker Cloudflare hoac trang login — luc do cookie phien cua trinh
// duyet app co the cuu duoc). `isChallenge` do caller truyen vao (true khi
// body/header co dau hieu challenge Cloudflare hoac trang yeu cau dang nhap).
function shouldUseBrowserFallback(status, isChallenge) {
    if (status === 405 || status === 429) return false;
    return isChallenge === true;
}

// --- Thong bao loi tieng Viet cho nguoi dung ---------------------------------
// remainingMs <= 0: khong biet con bao lau thi noi chung "thu lai sau it phut".
// remainingMs > 0: noi ro so phut (lam tron len, toi thieu 1 phut).
function rateLimitErrorMessage(siteName, host, remainingMs) {
    var name = siteName || "Website";
    var h = host || "";
    if (typeof remainingMs === "number" && !isNaN(remainingMs) && remainingMs > 0) {
        var minutes = Math.ceil(remainingMs / 60000);
        if (minutes < 1) minutes = 1;
        return "Website " + name + " đang tạm chặn IP của bạn vì gửi request quá nhanh" +
            (h ? " (" + h + ")" : "") +
            ". Vui lòng thử lại sau khoảng " + minutes + " phút." +
            " Đừng bấm tải lại liên tục — mỗi lần thử lại khi còn bị chặn đều có thể kéo dài thời gian bị chặn.";
    }
    return "Website " + name + " đang tạm chặn IP của bạn vì gửi request quá nhanh" +
        (h ? " (" + h + ")" : "") +
        ". Vui lòng thử lại sau ít phút." +
        " Đừng bấm tải lại liên tục — mỗi lần thử lại khi còn bị chặn đều có thể kéo dài thời gian bị chặn.";
}

// --- Wrapper fetch co pacing + retry + cooldown ----------------------------
// pacedFetch(url, options) — mot lan goi fetch "lich su": kiem tra cooldown
// truoc, nghi jitter, fetch, retry 429/405/503 bang backoff, tra ve ca ma HTTP.
// Diem khac biet so voi fetchPage() (fetch-helpers.js): fetchPage() tra null
// khi loi nen caller khong biet ma loi la 405 hay loi mang; pacedFetch() LUON
// tra object {ok, status, res, headers, text, error, cooldownRemainingMs,
// attempts} de caller phan biet duoc (vd. 405 -> setCooldown + bao loi chan;
// 0 -> loi mang, khong phai bi chan).
// GIOI HAN:
// - Body KHONG doc o day: response body cua vBook doc 1 lan (goi res.text()
//   se tieu thu body, res.html() sau do co the tra rong) nen `text` LUON la
//   null; caller tu doc body bang res.text() / res.html() nhu thuong.
// - Wrapper dung defaultHeaders() cua fetch-helpers.js KHI co san (script
//   phai nap ca 2 file: fetch-helpers.js truoc, rate-limit.js sau).
//   Khong co thi dung headers toi thieu (Accept + Accept-Language).
// - KHONG goi fetchViaBrowser o day: browser fallback la viec cua caller,
//   theo shouldUseBrowserFallback() (405/429 thi bo qua).
// - Chi nghi jitter truoc request DAU TIEN; cac lan retry cach nhau bang
//   backoffMs() (nghi ca 2 se cho lau vo ich).
// - Gap 429/405 o lan cuoi thi tu ghi cooldown (mac dinh 60 phut, hoac
//   options.cooldownMs, hoac Retry-After neu co); 503 thi khong ghi cooldown
//   (503 thuong la loi server nhat thoi).
// options: {method, body, headers, referer, minDelayMs, maxDelayMs,
//           maxRetries (mac dinh 3), cooldownMs, timeout (ms, truyen thang
//           vao fetch — dung cho Smart Quick-Retry cua STV, vd. 6000)}

// Tach host (viet thuong) tu URL; tra "" neu khong tach duoc.
function pacedHostOf(url) {
    try {
        var m = String(url || "").match(/^https?:\/\/([^\/:?#]+)/i);
        return m ? m[1].toLowerCase() : "";
    } catch (e) {
        return "";
    }
}

// Nghi ms mili-giay (guard khi khong co sleep).
function rlSleepMs(ms) {
    try {
        if (typeof sleep !== "undefined" && sleep) sleep(ms);
    } catch (e) {
    }
}

// Headers cho fetch: dung defaultHeaders() cua fetch-helpers.js khi co san,
// khong co thi dung headers toi thieu; options.headers (neu co) ghi de len.
function pacedHeaders(referer, extraHeaders) {
    var h = null;
    try {
        if (typeof defaultHeaders === "function") h = defaultHeaders(referer);
    } catch (e) {
        h = null;
    }
    if (!h) {
        h = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
        };
        try {
            if (referer) {
                h["Referer"] = referer;
            } else if (typeof BASE_URL !== "undefined" && BASE_URL) {
                h["Referer"] = BASE_URL + "/";
            }
        } catch (e2) {
        }
    }
    if (extraHeaders) {
        for (var k in extraHeaders) {
            try { h[k] = extraHeaders[k]; } catch (e3) {}
        }
    }
    return h;
}

// Doc so giay Retry-After (so nguyen hoac HTTP date) ra mili-giay; -1 neu
// khong doc duoc / da qua han. Chi dung de tinh cooldown (backoff dung
// backoffMs()).
function rlParseRetryAfterMs(header) {
    if (header === null || header === undefined || header === "") return -1;
    var h = String(header);
    if (/^\s*\d+\s*$/.test(h)) return parseInt(h, 10) * 1000;
    var parsed = Date.parse(h);
    if (!isNaN(parsed)) {
        var wait = parsed - Date.now();
        return wait >= 0 ? wait : -1;
    }
    return -1;
}

function pacedFetch(url, options) {
    options = options || {};
    var host = pacedHostOf(url);
    var maxRetries = 3;
    if (typeof options.maxRetries === "number" && !isNaN(options.maxRetries) && options.maxRetries >= 0) {
        maxRetries = Math.floor(options.maxRetries);
    }
    // (a) Dang trong cooldown thi fail nhanh, KHONG gui request.
    if (host) {
        var remaining = cooldownRemainingMs(host);
        if (remaining > 0) {
            return { ok: false, status: 0, res: null, headers: {}, text: null, error: "cooldown", cooldownRemainingMs: remaining, attempts: 0 };
        }
    }
    var headers = pacedHeaders(options.referer, options.headers);
    var method = options.method || "GET";
    var attempt = 0;
    for (attempt = 0; attempt <= maxRetries; attempt++) {
        // (b) Jitter truoc request dau tien; retry cach nhau bang backoff.
        if (attempt === 0) {
            rateLimitDelay(host, options.minDelayMs, options.maxDelayMs);
        }
        var res = null;
        var fetchError = null;
        try {
            var reqOpts = { headers: headers, method: method };
            if (options.body !== undefined && options.body !== null) reqOpts.body = options.body;
            if (typeof options.timeout === "number" && !isNaN(options.timeout) && options.timeout > 0) reqOpts.timeout = Math.floor(options.timeout);
            res = fetch(url, reqOpts);
        } catch (e) {
            fetchError = String(e);
            res = null;
        }
        if (res) {
            var status = 0;
            try { status = res.status || 0; } catch (e2) { status = 0; }
            var resHeaders = {};
            try { resHeaders = res.headers || {}; } catch (e3) { resHeaders = {}; }
            var ok = false;
            try { ok = !!res.ok; } catch (e4) { ok = (status >= 200 && status < 300); }
            if (ok) {
                return { ok: true, status: status, res: res, headers: resHeaders, text: null, error: null, cooldownRemainingMs: 0, attempts: attempt + 1 };
            }
            // That bai co ma HTTP: retry neu duoc, roi dung.
            if (shouldRetryStatus(status) && attempt < maxRetries) {
                var ra = null;
                try { ra = resHeaders["Retry-After"] || resHeaders["retry-after"] || null; } catch (e5) {}
                rlSleepMs(backoffMs(attempt, ra));
                continue;
            }
            // Lan cuoi van loi: 429/405 thi ghi cooldown de lan sau fail nhanh.
            if (host && (status === 429 || status === 405)) {
                var cdMs = 60 * 60 * 1000;
                if (typeof options.cooldownMs === "number" && !isNaN(options.cooldownMs) && options.cooldownMs > 0) {
                    cdMs = Math.floor(options.cooldownMs);
                } else {
                    var raMs = -1;
                    try { raMs = rlParseRetryAfterMs(resHeaders["Retry-After"] || resHeaders["retry-after"]); } catch (e6) {}
                    if (raMs >= 0) {
                        cdMs = raMs;
                        if (cdMs < 60000) cdMs = 60000;
                        if (cdMs > 2 * 60 * 60 * 1000) cdMs = 2 * 60 * 60 * 1000;
                    }
                }
                setCooldown(host, cdMs);
            }
            return { ok: false, status: status, res: res, headers: resHeaders, text: null, error: "HTTP " + status, cooldownRemainingMs: cooldownRemainingMs(host), attempts: attempt + 1 };
        }
        // fetch() throw (loi mang): backoff roi retry neu con luot.
        if (attempt < maxRetries) {
            rlSleepMs(backoffMs(attempt, null));
            continue;
        }
        return { ok: false, status: 0, res: null, headers: {}, text: null, error: fetchError || "network error", cooldownRemainingMs: 0, attempts: attempt + 1 };
    }
    return { ok: false, status: 0, res: null, headers: {}, text: null, error: "unknown", cooldownRemainingMs: 0, attempts: attempt };
}
