// config.js — Cau hinh goc cua extension QuyKhu (quykhu.com).
//
// Site truyen chu tieng Viet, noi bat Truyen Voz: truyen ma, tam linh,
// tu truyen. BASE_URL mac dinh https://quykhu.com; nguoi dung doi trong
// cai dat (config DOMAIN trong plugin.json) thi gia tri do se override qua
// bien DOMAIN duoc app inject, nam trong try/catch.
//
// LUU Y QUAN TRONG (kiem chung tu VM 2026-11-11): site tra 403 neu request
// khong co header Accept-Language (curl tran va UA trinh duyet deu 403;
// them "Accept-Language: vi-VN,vi;q=0.9" thi 200). Vi vay moi request
// deu phai di qua request() de gan header nay — KHONG goi fetch() tran.
// Day khong phai challenge JS cua Cloudflare: GET trang chu/chi tiet/
// tim kiem deu 200 tu VM khi co header; chi rieng POST /post/<id>/chapters
// va trang chuong bi treo (timeout) tu IP datacenter — kiem chung tren
// may that moi ket luan duoc.
//
// Khong xoay User-Agent (AGENTS.md quy tac 10).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://quykhu.com";
try { if (DOMAIN) BASE_URL = DOMAIN; } catch (e) {}
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

// vozer.io (domain cu trong regexp cua base) da chet (000 tu VM) nen
// khong co mirror du phong.
var MIRROR_LIST = [];

// Site tra 403 neu thieu Accept-Language.
var HEADERS = { "Accept-Language": "vi-VN,vi;q=0.9" };

function normalizeUrl(url) {
    return String(url).replace(/^https?:\/\/(www\.)?(vozer\.io|quykhu\.com)/, BASE_URL);
}

// Site gioi han toc do bang 429 + Retry-After; cho 1 lan roi thu lai.
function request(url, options) {
    options = options || {};
    options.headers = Object.assign({}, HEADERS, options.headers);
    var response = fetch(url, options);
    if (response.status === 429) {
        var wait = parseInt(response.header("retry-after")) || 3;
        sleep(Math.min(wait, 10) * 1000);
        response = fetch(url, options);
    }
    return response;
}

function fetchHtml(url) {
    var response = request(url);
    return response.ok ? response.html() : null;
}

function parseCards(doc) {
    var list = [];
    doc.select(".qk-post-card").forEach(function (e) {
        var title = e.select(".qk-post-card__title").first();
        list.push({
            name: title.text().trim(),
            link: title.attr("href"),
            cover: e.select(".qk-post-card__thumb img").attr("src"),
            description: e.select(".qk-post-card__info > p").first().text().trim(),
            host: BASE_URL
        });
    });
    var next = doc.select(".qk-home-pagination a[rel=next]").attr("href").match(/page=(\d+)/);
    return Response.success(list, next ? next[1] : "");
}

// CSRF token rang buoc theo session cookie, nen 1 token dung cho moi
// POST danh sach chuong. Token nam tren trang chi tiet (trang chu de trong).
function saveCsrf(doc) {
    var token = doc.select("meta[name=csrf-token]").attr("content");
    if (token) cacheStorage.setItem("csrf", token);
    return token;
}

function postChapters(endpoint, page, token) {
    return request(endpoint, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": token,
            Origin: BASE_URL
        },
        body: JSON.stringify({ page: page })
    });
}

// Truyen ngan render danh sach luoi (flow); truyen dai render catalog
// lazy, hang khoa khong co link.
function chapterLinks(html) {
    return Html.parse(html).select(".chapter-list-flow-item a, a.lazy-catalog-row[href]");
}

function chapterEndpoint(doc) {
    return doc.select("[data-chapter-list]").attr("data-endpoint");
}

// ---- first() an toan ----
// QUIRK RUNTIME vBook (kiem chung tren may that 2026-11-11): Elements.first()
// KHONG bao gio tra null — select rong van tra mot object rong truthy.
// Helper nay tra ve element that neu co, null neu khong co (kiem tra size()).
function qkFirst(els) {
    if (!els) return null;
    try {
        if (els.size() > 0) return els.first();
    } catch (e) {}
    return null;
}
