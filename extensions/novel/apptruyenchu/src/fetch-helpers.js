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
// 2026-11-08: phat hien ca trang challenge Cloudflare tra ve HTTP 200
// (isChallengeText quet marker trong body + header cf-mitigated o
// fetchPage + fetchDoc/fetchDocWithFallback thu browser thay vi parse
// trang challenge nhu trang that); them fetchDocWithFallback() (gom
// retry www hardcode) va fetchJson() (kiem challenge truoc JSON.parse).
// KHONG xoay User-Agent (ban goc khung xuong co xoay, da bo ngay
// 2026-11-06): Cloudflare gan cookie cf_clearance voi UA cua trinh duyet
// da qua xac minh; fetch dung UA xoay se khong khop cookie va lai bi 403
// ngay ca khi nguoi dung da qua xac minh trong trinh duyet cua app
// (extension cua mizhm dung UA mac dinh thi chay duoc tren may that;
// xem AGENTS.md muc 6 quy tac 10).
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
// Trang challenge co the tra ve HTTP 200 (khong phai 503) nen KHONG duoc
// tin res.ok: phai kiem ca marker challenge trong body (isChallengeText)
// truoc khi parse nhu trang thuong — sua 2026-11-08 (truyenc): ban cu chi
// kiem "challenges.cloudflare.com" khi title RONG, mot trang challenge
// 200 co title khac (vi du "Attention Required! | Cloudflare") se lot
// qua va bi parse nhu trang that, tra du lieu sai voi success.
function isChallengeText(text) {
    if (!text) return false;
    var t = String(text);
    if (t.indexOf("challenges.cloudflare.com") !== -1) return true;
    if (t.indexOf("__cf_chl") !== -1) return true;
    if (t.indexOf("cf-challenge") !== -1) return true;
    if (t.indexOf("cf-turnstile") !== -1) return true;
    if (t.indexOf("turnstile") !== -1 && t.indexOf("cloudflare") !== -1) return true;
    if (t.indexOf("Attention Required") !== -1) return true;
    if (t.indexOf("Please verify you are a human") !== -1) return true;
    if (/checking your browser/i.test(t)) return true;
    if (t.indexOf("cf-error-code") !== -1) return true;
    return false;
}

function isChallengeDoc(doc) {
    if (!doc) return true;
    var title = "";
    try { title = String(doc.select("title").text()); } catch (e) { title = ""; }
    if (/just a moment/i.test(title)) return true;
    if (title.indexOf("Chờ một chút") !== -1) return true;
    if (title.indexOf("Attention Required") !== -1) return true;
    // Luon quet ca body (khong chi khi title rong): trang challenge HTTP
    // 200 co title "binh thuong" van lo marker challenge trong body.
    try {
        if (isChallengeText(doc.html())) return true;
    } catch (e2) {}
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
        console.log("fetchViaBrowser loi: " + e);
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
            if (res && res.ok) {
                // Challenge Cloudflare co the tra HTTP 200: header
                // cf-mitigated=challenge thi coi nhu that bai de roi xuong
                // browser fallback, khong tra response challenge ve nhu
                // trang that (sua 2026-11-08).
                var mitigated = null;
                try {
                    if (res.headers) {
                        mitigated = res.headers["cf-mitigated"] || res.headers["Cf-Mitigated"] || null;
                    }
                } catch (e0) {
                }
                if (mitigated && String(mitigated).toLowerCase().indexOf("challenge") !== -1) {
                    console.log("fetchPage: Cloudflare challenge (HTTP 200, cf-mitigated): " + url);
                    lastError = "Cloudflare challenge";
                    break;
                }
                return res;
            }
            var status = res ? res.status : 0;
            console.log("fetchPage HTTP " + status + " lan " + (attempt + 1) + ": " + url);
            lastError = "HTTP " + status;
            // 429: ton trong Retry-After, doi roi thu lai. Loi khac thi dung ngay.
            if (status === 429) {
                sleepMs(retryAfterMs(res, attempt));
                continue;
            }
            break;
        } catch (e) {
            console.log("fetchPage loi lan " + (attempt + 1) + ": " + e);
            lastError = String(e);
            sleepMs(500 * (attempt + 1));
        }
    }

    // Fetch thuong that bai het -> thu browser (site nang JS / Cloudflare).
    if (options.browserFallback !== false) {
        var doc = fetchViaBrowser(url);
        if (doc) return { doc: doc, ok: true, status: 200, browser: true };
    }

    console.log("fetchPage that bai: " + url + " (" + lastError + ")");
    return null;
}

// Chuyen response (fetch thuong hoac browser fallback) thanh Document.
// Neu body la trang challenge Cloudflare tra ve HTTP 200 thi KHONG parse
// nhu trang thuong: thu browser fallback, neu browser cung khong qua thi
// tra null de caller bao loi tieng Viet ro rang.
function docFromResponse(res, url) {
    if (!res) return null;
    if (res.browser) return res.doc;
    var doc = null;
    try {
        doc = res.html();
    } catch (e) {
        console.log("docFromResponse .html() loi: " + e);
        return null;
    }
    if (isChallengeDoc(doc)) {
        console.log("docFromResponse: trang challenge Cloudflare (HTTP 200), thu browser: " + url);
        return fetchViaBrowser(url);
    }
    return doc;
}

// Tien ich: lay Document, khong can biet duong fetch hay browser.
// Tra ve Document hoac null.
function fetchDoc(url, options) {
    var res = fetchPage(url, options);
    return docFromResponse(res, url);
}

// Lay Document co failover qua mirror (danh sach base URL day du).
// Dung chung cho detail/toc/chap/search/gen thay cho moi doan retry www
// hardcode "https://truyenc.net" -> "https://www.truyenc.net" rieng le.
// Tra ve Document hoac null.
function fetchDocWithFallback(url, mirrors) {
    var res = fetchWithFallback(url, mirrors);
    return docFromResponse(res, url);
}

// Lay JSON tu API (vi du /api/stories/{slug}/chapters). Doc text truoc
// roi kiem marker challenge (isChallengeText) truoc khi JSON.parse —
// trang challenge HTTP 200 co body HTML se khong bi parse thanh JSON loi
// mo ho ma tra null ro rang. Thu toi da 2 lan cho loi mang/HTTP. Tra ve
// object da parse hoac null.
function fetchJson(url, options) {
    options = options || {};
    var tries = 0;
    for (tries = 0; tries < 2; tries++) {
        try {
            var res = fetch(url, { headers: defaultHeaders(options.referer) });
            if (!res || !res.ok) {
                console.log("fetchJson HTTP " + (res ? res.status : 0) + " lan " + (tries + 1) + ": " + url);
                sleepMs(500 * (tries + 1));
                continue;
            }
            var text = "";
            try {
                text = res.text();
            } catch (e2) {
                console.log("fetchJson .text() loi: " + e2);
                return null;
            }
            if (!text) return null;
            if (isChallengeText(text)) {
                console.log("fetchJson: trang challenge Cloudflare (HTTP 200): " + url);
                return null;
            }
            try {
                return JSON.parse(text);
            } catch (e3) {
                console.log("fetchJson JSON.parse loi: " + e3);
                return null;
            }
        } catch (e) {
            console.log("fetchJson loi lan " + (tries + 1) + ": " + e);
            sleepMs(500 * (tries + 1));
        }
    }
    return null;
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
        console.log("fetchWithFallback thu mirror: " + mirror);
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
