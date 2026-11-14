// search.js — Tim kiem (execute(key, page) -> items, nextToken).
//
// Endpoint: GET /search?k=<tu khoa> (da xac minh ton tai: tu VM tra 403
// trang Cloudflare "Just a moment..." — chi endpoint tim kiem bi CF,
// cac trang khac khong bi). Neu fetch thuong gap trang CF thi thu qua
// trinh duyet headless cua app (Engine.newBrowser); neu van khong qua
// duoc thi bao loi tieng Viet ro rang (khong fake ket qua).
// Ket qua dung cung bo cuc danh sach nhu gen.js.
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function execute(key, page) {
    var url = page || (BASE_URL + "/search?k=" + encodeURIComponent(key || ""));
    if (!key && !page) return Response.error("Thiếu từ khóa tìm kiếm.");
    var doc = null;
    var r = pacedFetch(normalizeInput(url), {
        headers: { "Accept-Language": "zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7" },
        minDelayMs: 30000,
        maxDelayMs: 30500,
        maxRetries: 0
    });
    if (r.ok) {
        try {
            doc = r.res.html();
        } catch (e) {
            doc = null;
        }
    }
    if (!doc || isCloudflarePage(doc)) {
        doc = loadSearchDocument(normalizeInput(url));
    }
    if (!doc) {
        return Response.error("Tìm kiếm trên 85 Novel đang bị chặn bởi xác minh Cloudflare. Vui lòng thử lại sau, hoặc mở mục lục/trang chi tiết để đọc truyện.");
    }
    var data = parseSearchBooks(doc);
    if (!data.length) return Response.success([], "");
    var next = nextListToken(doc);
    return Response.success(data, next);
}

// Trang Cloudflare "Just a moment..." — nhan dien bang title.
// (Base cu kiem tra them #head-search — phan tu nay khong ton tai o bat
// ky trang nao cua site nen luon bao sai; da bo.)
function isCloudflarePage(doc) {
    var title = "";
    try {
        var titleEl = safeFirst(doc.select("title"));
        if (titleEl) title = cleanText(titleEl.text());
    } catch (e) {
    }
    return /Just a moment|Attention Required|Cloudflare/i.test(title);
}

function loadSearchDocument(url) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") return null;
    var browser = null;
    try {
        browser = Engine.newBrowser();
        var doc = browser.launch(url, 15000);
        if (doc && isCloudflarePage(doc)) {
            sleep85(8000);
            if (typeof browser.html === "function") doc = browser.html();
        }
        if (doc && doc.select && !isCloudflarePage(doc)) return doc;
    } catch (e) {
    } finally {
        try {
            if (browser && browser.close) browser.close();
        } catch (e2) {
        }
    }
    return null;
}
