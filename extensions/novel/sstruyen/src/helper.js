// helper.js — Ham dung chung cho SS Truyen (sstruyen.net).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day (load khong de quy). Script nao dung
// helper nay phai load truoc theo thu tu:
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file rate-limit.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
//
// Site sstruyen.net (kiem chung live 2026-11-10): HTML tinh, khong
// Cloudflare; danh sach dung `article.archive-story-card` (20/trang);
// phan trang danh sach dang `/page/N` (khong phai `?page=N`);
// muc luc phan trang `/truyen/<slug>/page/N` (20 chuong/trang).

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// fetchSsDoc them 1 vong retry RIENG cho 502/504 (qua tai tam thoi cua
// server — pacedFetch khong retry 2 ma nay): toi da 3 lan goi (1 lan dau
// + 2 lan thu lai), cho 2,5s roi 5s giua cac lan; neu site gui Retry-After
// thi ton trong header do (toi da 30s). 502/504 KHONG ghi cooldown 60 phut
// nhu 429/405 — day la qua tai tam thoi, khong phai bi chan theo IP, nen
// lan goi sau van duoc thu lai binh thuong. Het luot thi tra loi tieng Viet
// ro rang (da thu lai 3 lan) thay vi fail ngay nhu truoc.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
// Caller dung:
//     var r = fetchSsDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;

// So lan goi toi da cho 1 URL khi gap 502/504 (1 lan dau + 2 lan thu lai).
var SS_MAX_ATTEMPTS = 3;
// Thoi gian cho giua cac lan thu lai 502/504 (lan 1: 2,5s, lan 2: 5s).
var SS_RETRY_DELAYS_MS = [2500, 5000];

// Doc header Retry-After (so giay hoac HTTP date) ra mili-giay; -1 neu
// khong co header hoac khong doc duoc / da qua han. Tran 30 giay.
function ssRetryAfterMs(headers) {
    var raw = null;
    try {
        if (headers) raw = headers["Retry-After"] || headers["retry-after"] || null;
    } catch (e) {
        raw = null;
    }
    if (raw === null || raw === undefined || raw === "") return -1;
    var h = String(raw);
    var wait = -1;
    if (/^\s*\d+\s*$/.test(h)) {
        wait = parseInt(h, 10) * 1000;
    } else {
        var parsed = Date.parse(h);
        if (!isNaN(parsed)) wait = parsed - Date.now();
    }
    if (wait < 0) return -1;
    if (wait > 30000) wait = 30000;
    return wait;
}

// Thoi gian cho truoc lan thu lai thu `attempt` (attempt dem tu 0):
// uu tien Retry-After neu site gui, khong thi 2,5s roi 5s.
function ssRetryWaitMs(attempt, headers) {
    var raMs = ssRetryAfterMs(headers);
    if (raMs >= 0) return raMs;
    var idx = attempt;
    if (idx < 0) idx = 0;
    if (idx >= SS_RETRY_DELAYS_MS.length) idx = SS_RETRY_DELAYS_MS.length - 1;
    return SS_RETRY_DELAYS_MS[idx];
}

function fetchSsDoc(url) {
    var attempt = 0;
    for (attempt = 0; attempt < SS_MAX_ATTEMPTS; attempt++) {
        var res = null;
        try {
            res = pacedFetch(url, {});
        } catch (e) {
            return { error: "Không tải được trang (lỗi mạng): " + url };
        }
        if (!res) return { error: "Không tải được trang: " + url };
        if (res.error === "cooldown") {
            return { error: rateLimitErrorMessage("SSTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (res.ok) {
            var doc = null;
            try {
                doc = docFromResponse(res.res, url);
            } catch (e2) {
                return { error: "Không đọc được nội dung trang: " + url };
            }
            if (!doc) return { error: "Không đọc được nội dung trang: " + url };
            return { doc: doc };
        }
        var st = res.status || 0;
        // 502/504: qua tai tam thoi — cho roi thu lai (con luot).
        if ((st === 502 || st === 504) && attempt + 1 < SS_MAX_ATTEMPTS) {
            var wait = ssRetryWaitMs(attempt, res.headers);
            console.log("fetchSsDoc HTTP " + st + " lan " + (attempt + 1) + "/" + SS_MAX_ATTEMPTS + ", cho " + wait + "ms roi thu lai: " + url);
            rlSleepMs(wait);
            continue;
        }
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("SSTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st === 502 || st === 504) {
            return { error: "Website SS Truyện đang quá tải (HTTP " + st + ") — đã thử lại " + SS_MAX_ATTEMPTS + " lần nhưng server vẫn chưa phản hồi. Vui lòng thử lại sau ít phút, hoặc đổi mạng Wi-Fi/4G rồi thử lại." };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    return { error: "Không tải được trang: " + url };
}

// Parser MOT card truyen `article.archive-story-card` thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
function parseStoryCard(el) {
    var titleA = el.select("h2.archive-story-card__title a").first();
    var link = "";
    var name = "";
    if (titleA !== null) {
        link = absUrl(titleA.attr("href"));
        name = cleanText(titleA.text());
    }
    if (!link) {
        var anyA = el.select("a[href*='/truyen/']").first();
        if (anyA !== null) link = absUrl(anyA.attr("href"));
    }
    if (!link) return null;
    if (!name) {
        var img0 = el.select("img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var img = safeFirst(el.select("a.archive-story-card__cover img"));
    if (img === null) img = safeFirst(el.select("img"));
    var cover = "";
    if (img !== null) {
        cover = img.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var genres = [];
    el.select("a[itemprop=genre]").forEach(function (g) {
        var t = cleanText(g.text());
        if (t) genres.push(t);
    });
    var latestA = el.select(".archive-story-card__chapter a").first();
    var latest = latestA !== null ? cleanText(latestA.text()) : "";
    var statusEl = el.select(".archive-story-card__status").first();
    var status = statusEl !== null ? cleanText(statusEl.text()) : "";
    var descParts = [];
    if (genres.length > 0) descParts.push("Thể loại: " + genres.join(", "));
    if (latest) descParts.push(latest);
    if (status) descParts.push(status);

    return {
        name: name,
        cover: cover,
        link: link,
        description: descParts.join(" • "),
        tag: status,
        host: siteOrigin()
    };
}

// Parser ca danh sach card tren 1 trang: tra ve mang truyen (dedupe theo link).
function parseStoryList(doc) {
    var items = [];
    var seen = {};
    doc.select("article.archive-story-card").forEach(function (el) {
        var item = parseStoryCard(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang N cua mot trang danh sach (site dung `/page/N` chen truoc query).
// Trang 1 tra ve URL goc khong doi.
function ssPagedUrl(url, page) {
    var p = 1;
    try { p = parseInt(page, 10); } catch (e) { p = 1; }
    if (isNaN(p) || p <= 1) return url;
    var q = url.indexOf("?");
    var base = q === -1 ? url : url.substring(0, q);
    var query = q === -1 ? "" : url.substring(q);
    base = base.replace(/\/page\/\d+\/?$/, "").replace(/\/+$/, "");
    return base + "/page/" + p + query;
}

// So trang ke tiep ("") = het. Doc pager `nav.archive-pagination`:
// so trang lon nhat tu cac link `/page/N`, so trang hien tai tu `li.active`.
function ssNextPage(doc) {
    var maxPage = 1;
    var current = 1;
    var links = doc.select("nav.archive-pagination ul.pagination li a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/\/page\/(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxPage) maxPage = n;
        }
    }
    var active = doc.select("nav.archive-pagination ul.pagination li.active a").first();
    if (active !== null) {
        var c = parseInt(cleanText(active.text()), 10);
        if (!isNaN(c) && c >= 1) current = c;
    }
    if (current < maxPage) return String(current + 1);
    return "";
}

// Tong so chuong cua mot truyen, doc tu trang chi tiet:
// (a) meta description "…tổng số 295 chương…"; (b) du phong: so chuong lon
// nhat trong cac link `/chuong-N` tren trang (truyen danh so tuan tu tu 1).
// Tra ve so nguyen > 0, hoac 0 neu khong doc duoc.
function totalChaptersFromDetail(doc) {
    var meta = doc.select("meta[name=description]").first();
    if (meta !== null) {
        var desc = meta.attr("content") || "";
        var m = desc.match(/tổng số\s*(\d+)\s*chương/);
        if (m) {
            var total = parseInt(m[1], 10);
            if (!isNaN(total) && total > 0) return total;
        }
    }
    var maxCh = 0;
    doc.select("a[href*='/chuong-']").forEach(function (a) {
        var href = a.attr("href") || "";
        var m2 = href.match(/\/chuong-(\d+)/);
        if (m2) {
            var n = parseInt(m2[1], 10);
            if (!isNaN(n) && n > maxCh) maxCh = n;
        }
    });
    return maxCh;
}

// Danh sach URL cac trang muc luc cua 1 truyen (20 chuong/trang).
// Trang 1 la URL goc; cac trang sau la `<url>/page/N`.
function tocPageUrls(detailUrl, total) {
    var pages = [detailUrl];
    if (!total || total <= 20) return pages;
    var count = Math.ceil(total / 20);
    var i = 0;
    for (i = 2; i <= count; i++) {
        pages.push(detailUrl.replace(/\/+$/, "") + "/page/" + i);
    }
    return pages;
}
