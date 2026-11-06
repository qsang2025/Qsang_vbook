// fetch-helpers.js — LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Quy tac build (xem thiet ke khung xuong muc 6.9): file nay chi la nguon mau
// o repo root. Buoc build PHAI copy/inline no vao thu muc src/ cua tung
// extension truoc khi dong plugin.zip, vi load() cua vBook chi load file o
// top level src/ trong cung extension, khong de quy, va file duoc load
// khong duoc load them file khac. Trong script dung no, viet o dau file:
//     load('config.js');
//     load('fetch-helpers.js');
// (Chi can config.js khi muon Referer mac dinh la BASE_URL; neu khong co
// BASE_URL thi Referer duoc bo qua, ham van chay.)
//
// Y tuong: fallback Engine.newBrowser co guard cua kychitoge/kyhchitoge +
// chong chan Cloudflare (cho title "Just a moment" + "Chờ một chút") cua
// mizhm; retry 429, ton trong Retry-After, delay jitter.
// KHONG xoay User-Agent (ban goc khung xuong co xoay, da bo o ban sao nay
// ngay 2026-11-06): Cloudflare gan cookie cf_clearance voi UA cua trinh
// duyet da qua xac minh; fetch dung UA xoay se khong khop cookie va lai
// bi 403 ngay ca khi nguoi dung da qua xac minh trong trinh duyet cua app
// (extension cua mizhm dung UA mac dinh thi chay duoc tren may that).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function defaultHeaders(referer) {
    var headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
    };
    if (referer) {
        headers["Referer"] = referer;
    } else if (typeof BASE_URL !== "undefined" && BASE_URL) {
        headers["Referer"] = BASE_URL + "/";
    }
    return headers;
}

// --- Sleep / delay ---------------------------------------------------------
function sleepMs(ms) {
    try {
        sleep(ms);
    } catch (e) {
    }
}

// Delay jitter nho (300-800ms) giua cac request de khong bi coi la bot.
// Goi truoc moi request trong vong lap phan trang/tai nhieu chuong.
function jitterDelay() {
    var ms = 300 + Math.floor(Math.random() * 500);
    sleepMs(ms);
}

// --- Retry-After -----------------------------------------------------------
function retryAfterMs(response, attempt) {
    var wait = 1000 * (attempt + 1);
    try {
        var header = null;
        if (response && response.headers) {
            header = response.headers["Retry-After"] || response.headers["retry-after"];
        }
        if (header) {
            var seconds = parseInt(String(header), 10);
            if (!isNaN(seconds) && seconds > 0) {
                wait = seconds * 1000;
            }
        }
    } catch (e) {
    }
    // Tran cho qua lau (toi da 30 giay) ke ca khi server doi lau hon.
    if (wait > 30000) wait = 30000;
    return wait;
}

// --- Fallback browser ------------------------------------------------------
// Chi chay khi fetch thuong that bai. Tra ve Document (doc) hoac null.
// Mau: kychitoge (guard typeof Engine) + mizhm (doi "Just a moment").
//
// Nhan dien trang challenge cua Cloudflare: tieu de tieng Anh "Just a
// moment..." HOAC ban dich tieng Viet "Chờ một chút..." (Cloudflare
// localize tieu de theo Accept-Language/IP — gap that tren novels.com.tw
// 2026-11-06: may that tra title tieng Viet, vong doi cu chi kiem
// "Just a moment" nen tra ngay trang challenge ve nhu doc that).
// Du phong: neu tieu de trong thi kiem chuoi challenges.cloudflare.com
// trong HTML.
function isChallengeDoc(doc) {
    if (!doc) return true;
    var title = "";
    try { title = String(doc.select("title").text()); } catch (e) { title = ""; }
    if (/just a moment/i.test(title)) return true;
    if (title.indexOf("Chờ một chút") !== -1) return true;
    if (!title) {
        try {
            if (String(doc.html()).indexOf("challenges.cloudflare.com") !== -1) return true;
        } catch (e2) {}
    }
    return false;
}

function fetchViaBrowser(url) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") {
        return null;
    }
    var browser = null;
    try {
        browser = Engine.newBrowser();
        var doc = browser.launch(url, 15000);
        var tries = 0;
        while (doc && tries < 4 && isChallengeDoc(doc)) {
            doc = browser.html(3000);
            tries = tries + 1;
        }
        if (!doc || isChallengeDoc(doc)) {
            if (browser.close) browser.close();
            return null;
        }
        if (browser.close) browser.close();
        return doc;
    } catch (e) {
        try {
            if (browser && browser.close) browser.close();
        } catch (e2) {
        }
        Console.log("fetchViaBrowser loi: " + e);
        return null;
    }
}

// --- Fetch chinh -----------------------------------------------------------
// fetchPage(url) tra ve response cua fetch() (de goi .html()/.text()/.json()),
// hoac tra ve doi tuong { doc: Document } khi phai dung browser fallback
// (khi do goi .html() khong con y nghia — dung ket qua.doc truc tiep).
// Dung fetchDoc(url) neu chi can Document va khong muon phan biet 2 dang.
function fetchPage(url, options) {
    options = options || {};
    var maxRetries = 3;
    var attempt = 0;
    var lastError = null;

    for (attempt = 0; attempt < maxRetries; attempt++) {
        try {
            var headers = defaultHeaders(options.referer);
            var res = fetch(url, { headers: headers });
            if (res && res.ok) return res;
            var status = res ? res.status : 0;
            Console.log("fetchPage HTTP " + status + " lan " + (attempt + 1) + ": " + url);
            lastError = "HTTP " + status;
            // 429: ton trong Retry-After, doi roi thu lai. Loi khac thi dung ngay.
            if (status === 429) {
                sleepMs(retryAfterMs(res, attempt));
                continue;
            }
            break;
        } catch (e) {
            Console.log("fetchPage loi lan " + (attempt + 1) + ": " + e);
            lastError = String(e);
            sleepMs(500 * (attempt + 1));
        }
    }

    // Fetch thuong that bai het -> thu browser (site nang JS / Cloudflare).
    if (options.browserFallback !== false) {
        var doc = fetchViaBrowser(url);
        if (doc) return { doc: doc, ok: true, status: 200, browser: true };
    }

    Console.log("fetchPage that bai: " + url + " (" + lastError + ")");
    return null;
}

// Tien ich: lay Document, khong can biet duong fetch hay browser.
// Tra ve Document hoac null.
function fetchDoc(url, options) {
    var res = fetchPage(url, options);
    if (!res) return null;
    if (res.browser) return res.doc;
    try {
        return res.html();
    } catch (e) {
        Console.log("fetchDoc .html() loi: " + e);
        return null;
    }
}

// --- Mirror failover -------------------------------------------------------
// Thu lan luot danh sach mirror (mang cac base URL day du, vi du
// ["https://site.com", "https://mirror.site.com"]) cho toi khi thanh cong.
// Tra ve giong fetchPage: response, hoac { doc:  } neu qua browser.
function fetchWithFallback(url, mirrors) {
    var list = mirrors || [];
    var i = 0;
    // Luon thu URL goc truoc.
    var res = fetchPage(url);
    if (res) return res;

    for (i = 0; i < list.length; i++) {
        var mirror = String(list[i]).replace(/\/+$/, "");
        if (!mirror) continue;
        var altUrl = url.replace(/^https?:\/\/[^\/]+/, mirror);
        Console.log("fetchWithFallback thu mirror: " + mirror);
        var r2 = fetchPage(altUrl);
        if (r2) {
            try {
                if (typeof BASE_URL !== "undefined") {
                    BASE_URL = mirror;
                }
            } catch (e) {
            }
            return r2;
        }
    }
    return null;
}
