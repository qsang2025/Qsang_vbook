// config.js — cau hinh goc cua Bixiange (m.bixiange.top, 笔仙阁).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Ca hai phep override deu nam trong try/catch.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// Mirror da kiem chung: www.bixiange.top (cung site, 200). m.bixiange.me
// chet tu VM (000) nen khong dua vao.
//
// LUU Y: file nay duoc load() boi cac script khac, nen KHONG duoc load()
// them file nao khac o day. Script nao can helper thi tu load() file lib
// do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://m.bixiange.top";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = parts[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = String(value[i]).replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

var MIRROR_LIST = ["https://www.bixiange.top"];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

var HOST = BASE_URL;

// 12 slug the loai cua site (kiem chung live 2026-11-14: deu 200).
var CAT_SLUGS = ["dsyq", "wxxz", "xhqh", "cyjk", "khjj", "ghxy", "jsls", "guanchang", "xtfq", "dmtr", "trxs", "jqxs"];

// Map slug the loai -> ten hien thi tieng Trung (theo nav cua site).
var GENRE_MAP = {
    dsyq: "都市言情",
    wxxz: "武侠修真",
    xhqh: "玄幻奇幻",
    cyjk: "穿越架空",
    khjj: "科幻竞技",
    ghxy: "鬼话悬疑",
    jsls: "军事历史",
    guanchang: "官场商战",
    xtfq: "乡土风情",
    dmtr: "耽美小说",
    trxs: "同人小说",
    jqxs: "精品小说"
};

var STORY_URL_RE = /^\/(dsyq|wxxz|xhqh|cyjk|khjj|ghxy|jsls|guanchang|xtfq|dmtr|trxs|jqxs)\/\d+/;
var LIST_SKIP_NAME_RE = /^在线阅读$|^目录$|^上一章$|^下一章$|^上一节$|^下一节$|^上一页$|^下一页$|^首节$|^尾节$/;

// Cat hau to so chuong o cuoi ten truyen: "(1-728)", "(全本)".
function cleanBookName(name) {
    var n = String(name || "").replace(/[\s\u3000]+/g, " ").trim();
    n = n.replace(/[（(]\s*\d+\s*-\s*\d+\s*[）)]\s*$/, "");
    n = n.replace(/[（(]\s*全本\s*[）)]\s*$/, "");
    return n.trim();
}

// Giai quyet URL thanh tuyet doi (bo slash cuoi).
function resolveUrl(url) {
    if (!url) return "";
    var u = String(url).trim();
    if (u.indexOf("http") === 0) return u.replace(/\/$/, "");
    if (u.charAt(0) !== "/") u = "/" + u;
    return BASE_URL + u.replace(/\/$/, "");
}

// Chuan hoa href ve dang path (bo domain neu cung site, bo slash cuoi).
function normalizeHref(href) {
    if (!href) return "";
    var h = String(href).trim();
    if (h.indexOf("http") === 0) {
        if (!/bixiange\.top/.test(h)) return "";
        h = h.replace(/https?:\/\/[^\/]+/, "");
    }
    return h.replace(/\/$/, "");
}

function escapeRegExp(text) {
    return (text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Path truyen tu URL day du: "/xhqh/23552/" -> "/xhqh/23552".
// Ca URL trang TOC "/xhqh/23552/index_2.html" cung ve "/xhqh/23552".
function storyPathFromUrl(url) {
    var v = String(url || "");
    if (v.indexOf("http") === 0) v = v.replace(/https?:\/\/[^\/]+/, "");
    v = v.replace(/\/index_\d+(\.html)?$/, "");
    return v.replace(/\.html$/, "").replace(/\/$/, "");
}

// Nhan dien link chuong thuoc truyen storyPath.
// Dang A: /cat/id/123_2.html (trang con cua chuong 123); dang B: /cat/id/index/123.html.
function getChapterHrefInfo(href, storyPath) {
    if (!href) return null;
    var h = String(href);
    if (h.indexOf("http") === 0) {
        if (!/bixiange\.top/.test(h)) return null;
        h = h.replace(/https?:\/\/[^\/]+/, "");
    }
    h = h.replace(/\/$/, "");
    var storyBase = storyPathFromUrl(storyPath);
    var chapReA = new RegExp("^" + escapeRegExp(storyBase) + "\\/(\\d+)(?:_(\\d+))?\\.html$");
    var chapReB = new RegExp("^" + escapeRegExp(storyBase) + "\\/index\\/(\\d+)\\.html$");
    var matchA = chapReA.exec(h);
    if (matchA) {
        return { path: h, number: parseInt(matchA[1], 10), part: matchA[2] ? parseInt(matchA[2], 10) : 1 };
    }
    var matchB = chapReB.exec(h);
    if (matchB) {
        return { path: h, number: parseInt(matchB[1], 10), part: 1 };
    }
    return null;
}

// URL phan trang danh sach — Bixiange dung /index_{N}.html:
//   trang 1: BASE_URL/{section}/
//   trang N: BASE_URL/{section}/index_{N}.html
function paginateUrl(section, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var base = BASE_URL + "/" + section;
    if (p <= 1) return base + "/";
    return base + "/index_" + p + ".html";
}

// Trang tiep theo cua danh sach: tim link /index_{N+1}.html, fallback nut 下一页.
function getNextPage(doc, current) {
    var nextNum = (current || 1) + 1;
    var nextLink = safeFirst(doc.select("a[href*='index_" + nextNum + ".html']"));
    if (nextLink) return String(nextNum);
    var pageLinks = doc.select("a[href*='index_']");
    for (var i = 0; i < pageLinks.size(); i++) {
        var txt = String(pageLinks.get(i).text() || "").trim();
        if (txt === "下一页" || txt.indexOf("下一页") === 0) return String(nextNum);
    }
    return "";
}

// Strip HTML -> text thuong (giu xuong dong doan).
var ENTITY_MAP = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&quot;": '"', "&#039;": "'", "&nbsp;": " ", "&#160;": " "
};
function stripHtml(html) {
    if (!html) return "";
    return String(html)
        .replace(/(<br[^>]*>\s*(<\/br>)?\s*)+/gi, "\n\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/(div|section|article|blockquote)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z#0-9]+;/gi, function (e) { return ENTITY_MAP[e] || e; })
        .replace(/[ \t\r]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
