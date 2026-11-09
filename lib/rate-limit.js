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
//     load('config.js');
//     load('rate-limit.js');
// (Khong can config.js neu khong dung BASE_URL.)
//
// GIOI HAN QUAN TRONG (doc ky truoc khi dung):
// 1. Cooldown luu trong localStorage — ma localStorage cua vBook la THEO TUNG
//    EXTENSION, nen cooldown chi co tac dung trong cung mot extension (vd. chi
//    qimao nho duoc qimao dang bi chan; extension khac khong biet). Khong dung
//    de chia se trang thai giua cac extension.
// 2. Ham nay KHONG tu dong goi fetch — no chi tinh toan thoi gian nghi / kiem tra
//    trang thai. Caller van phai goi sleep/backoff va tu fetch lai.
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
