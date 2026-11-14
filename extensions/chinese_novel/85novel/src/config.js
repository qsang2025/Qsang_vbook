// config.js — Cau hinh goc cua 85 Novel (www.85novel.com, 85小說網).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch.
//
// PACING (canh bao cua site, ghi trong mo ta base: "Tai nhanh se bi ban
// IP, set 1 luong 30s"): moi execute() goi pace85() mot lan truoc request
// dau tien — nghi 30-30,5 giay. Trong toc.js, cac slice API cach nhau 3
// giay (base dung 2500ms). Khong request song song tren cung host.
// File rate-limit.js phai duoc load truoc khi goi pace85().
//
// MIRROR_LIST rong: chua co mirror nao duoc kiem chung (bare 85novel.com
// chua thu; www la domain duy nhat da xac minh 200).
//
// LUU Y: file nay duoc load() boi cac script khac, nen KHONG duoc load()
// them file nao khac o day. Script nao can helper thi tu load() file lib
// do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.85novel.com";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var MIRROR_LIST = [];

var SITE_HOST = "www.85novel.com";
var PACE_MIN_MS = 30000;
var PACE_MAX_MS = 30500;
var NO_COVER = BASE_URL + "/img/nocover.jpg";

// Nghi 30-30,5 giay truoc request dau tien cua moi execute().
function pace85() {
    try {
        rateLimitDelay(SITE_HOST, PACE_MIN_MS, PACE_MAX_MS);
    } catch (e) {
    }
}

// Nghi ms mili-giay (guard khi khong co sleep).
function sleep85(ms) {
    try {
        if (typeof sleep !== "undefined" && sleep) sleep(ms);
    } catch (e) {
    }
}

function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function absUrl(url) {
    if (!url) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http") === 0) return url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return BASE_URL + url;
}

function normalizeInput(url) {
    if (!url) return BASE_URL + "/";
    if (url.indexOf("http") === 0) return url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return BASE_URL + url;
}

// Fetch co pacing (goi pace85() truoc), tra ve response tho hoac null khi
// loi mang. options: {method, body, headers} — headers ghi de len header
// mac dinh. Dung UA mac dinh cua runtime (desktop UA da tra du trang tu
// VM, khong can ngoai le UA).
function fetch85(url, options) {
    options = options || {};
    pace85();
    var headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7",
        "Referer": BASE_URL + "/"
    };
    var extra = options.headers || {};
    for (var k in extra) {
        try { headers[k] = extra[k]; } catch (e) {}
    }
    var reqOpts = { headers: headers };
    if (options.method) reqOpts.method = options.method;
    if (options.body !== undefined && options.body !== null) reqOpts.body = options.body;
    var res = null;
    try {
        res = fetch(url, reqOpts);
    } catch (e) {
        return null;
    }
    return res;
}

// Fetch co pacing, tra {ok, status, text, res, error}. Chu y: doc body
// bang res.text() o day — caller KHONG goi them res.html() tren cung
// response (body chi doc duoc 1 lan).
function fetch85Text(url, options) {
    var res = fetch85(url, options);
    if (!res) return { ok: false, status: 0, text: "", res: null, error: "network" };
    var ok = false;
    try { ok = !!res.ok; } catch (e) { ok = false; }
    var status = 0;
    try { status = res.status || 0; } catch (e2) { status = 0; }
    var text = "";
    try { text = res.text() || ""; } catch (e3) { text = ""; }
    return { ok: ok, status: status, text: text, res: res, error: ok ? "" : "HTTP " + status };
}

// Lay cookie phien tu response (runtime giu cookie trong request headers
// cua response). Tra "" neu khong lay duoc.
function requestCookie(res) {
    try {
        if (res && res.request && res.request.headers && res.request.headers.cookie) {
            return res.request.headers.cookie;
        }
    } catch (e) {
    }
    try {
        if (typeof localCookie !== "undefined" && localCookie && localCookie.getCookie) {
            return localCookie.getCookie() || "";
        }
    } catch (e2) {
    }
    return "";
}

// Tach token XSRF tu HTML trang chi tiet: Login(..., '<token>').
// Token doi moi lan tai trang — phai lay moi truoc moi chuoi POST API.
function extractXsrfToken(html) {
    var m = /Login\([^,]+,\s*'([^']+)'/.exec(html || "");
    if (m) return m[1];
    var marker = "Login(";
    var index = (html || "").indexOf(marker);
    if (index < 0) return "";
    var start = html.indexOf("'", index);
    if (start < 0) return "";
    var end = html.indexOf("'", start + 1);
    if (end < 0) return "";
    return html.substring(start + 1, end);
}

// Parse danh sach truyen tu trang /list/... (20 muc/trang).
// LUU Y BO CUC DOI THEO UA (kiem chung 2026-11-14): tu VM (desktop) khoi
// muc la div.flex.mt-2 chua anh bia + div.flex.flex-col.gap-2 noi dung;
// tu may that (runtime) khoi muc la div.flex.flex-col.gap-2 boc ca hang
// (anh bia + div.flex.flex-col.gap-1 noi dung). Vi vay lay ca hai
// selector, gop theo link, uu tien muc co anh bia.
function parseBookList(doc) {
    var byLink = {};
    var order = [];
    collectBookBlocks(doc.select("div.flex.flex-col.gap-2"), byLink, order);
    collectBookBlocks(doc.select("div.flex.mt-2"), byLink, order);
    var data = [];
    var i = 0;
    for (i = 0; i < order.length; i++) data.push(byLink[order[i]]);
    return data;
}

function collectBookBlocks(items, byLink, order) {
    var i = 0;
    for (i = 0; i < items.size(); i++) {
        var e = items.get(i);
        var coverEl = safeFirst(e.select("img"));
        var cover = coverEl ? absUrl(coverEl.attr("src")) : "";
        if (/nocover\.jpg$/i.test(cover)) cover = "";
        var links = e.select("a[href^=/book/]");
        var titleA = null;
        var j = 0;
        for (j = 0; j < links.size(); j++) {
            var a = links.get(j);
            if (a.select("h3").size() > 0) { titleA = a; break; }
        }
        if (!titleA) continue;
        var href = titleA.attr("href");
        if (!/\/book\/\d+\.html$/.test(href || "")) continue;
        var h3El = safeFirst(titleA.select("h3"));
        var title = h3El ? cleanText(h3El.text()) : "";
        if (!title) continue;
        var link = absUrl(href);
        var author = "";
        var authorEl = safeFirst(e.select(".ms-2"));
        if (authorEl) {
            author = cleanText(authorEl.text()).replace(/著$/, "").trim();
        } else {
            var authorDiv = safeFirst(e.select("div.flex.text-center.text-base-700"));
            if (authorDiv) {
                var aSpan = safeFirst(authorDiv.select("span"));
                if (aSpan) {
                    author = cleanText(aSpan.text()).replace(/\u270D/g, "").replace(/^[\u2014\u2013\-\u00B7\s]+/, "").trim();
                }
            }
        }
        var meta = "";
        var status = "";
        var metaEls = e.select(".text-base-700");
        var mi = 0;
        for (mi = 0; mi < metaEls.size(); mi++) {
            var mEl = metaEls.get(mi);
            var mText = cleanText(mEl.text());
            if (!mText) continue;
            if (mText.indexOf("✍") >= 0) {
                var sSpans = mEl.select("span");
                if (sSpans.size() > 1) status = cleanText(sSpans.get(1).text());
                continue;
            }
            if (!meta) meta = mText.replace(/[\s\u2027\u00B7]+$/, "");
        }
        var latestEl = safeFirst(e.select("a.text-primary-400"));
        var latest = latestEl ? cleanText(latestEl.text()) : "";
        var updatedEl = safeFirst(e.select(".text-base-600"));
        var updated = updatedEl ? cleanText(updatedEl.text()) : "";
        var descEl = safeFirst(e.select("p.line-clamp-3"));
        if (!descEl) descEl = safeFirst(e.select("p.line-clamp-2"));
        var desc = descEl ? cleanText(descEl.text()) : "";
        var detailParts = [];
        if (meta) detailParts.push(meta);
        if (status && meta.indexOf(status) < 0) detailParts.push("狀態: " + status);
        if (latest) detailParts.push("最新章節: " + latest);
        if (updated) detailParts.push(updated);
        var item = {
            name: title,
            link: link,
            cover: cover,
            description: desc,
            author: author,
            detail: detailParts.join("<br>"),
            host: BASE_URL
        };
        if (!byLink[link]) {
            byLink[link] = item;
            order.push(link);
        } else if (!byLink[link].cover && cover) {
            byLink[link].cover = cover;
        }
    }
}

// Ket qua tim kiem dung cung bo cuc danh sach — tai su dung parseBookList.
function parseSearchBooks(doc) {
    return parseBookList(doc);
}

// Thong bao loi tieng Viet cho ket qua pacedFetch that bai.
// (rateLimitErrorMessage nam trong file rate-limit.js — script goi ham
// nay phai load file rate-limit.js.)
function pacedErrorMessage(r) {
    if (r && r.error === "cooldown") {
        return rateLimitErrorMessage("85 Novel", SITE_HOST, r.cooldownRemainingMs || 0);
    }
    if (r && (r.status === 429 || r.status === 405)) {
        return rateLimitErrorMessage("85 Novel", SITE_HOST, 0);
    }
    if (r && r.status) return "Không tải được trang từ 85 Novel (HTTP " + r.status + ").";
    return "Không tải được trang từ 85 Novel (lỗi mạng).";
}

// Token trang ke cua danh sach: href cua nut next
// (a.pagination-btn.rounded-r-lg); "" khi het trang.
function nextListToken(doc) {
    var nextEl = safeFirst(doc.select("a.pagination-btn.rounded-r-lg"));
    if (!nextEl) return "";
    var href = nextEl.attr("href");
    return href || "";
}
