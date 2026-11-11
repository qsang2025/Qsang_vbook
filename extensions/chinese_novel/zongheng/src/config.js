// config.js — Cau hinh goc cua extension Zongheng (zongheng.com).
//
// BASE_URL mac dinh https://www.zongheng.com; nguoi dung doi trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch.
//
// Site dung nhieu subdomain cung he thong: www (trang chinh Nuxt),
// book (chi tiet/muc luc nam tan), huayu (nu tan, template cu),
// read (trang doc chuong), search (tim kiem API), static (anh bia).
// Chung deu thuoc zongheng.com nen normalizeUrl GIU NGUYEN host
// zongheng.com thay vi viet lai ve BASE_URL (khac voi cac nguon
// mot-host); chi viet lai host la khi URL khong phai zongheng.com.
//
// KHONG xoay User-Agent (AGENTS.md quy tac 10): fetch dung UA mac dinh
// cua runtime. Site khong co Cloudflare (kiem chung 2026-11-11).
//
// KHONG co mirror doc lap: MIRROR_LIST mac dinh rong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://www.zongheng.com";
try { if (DOMAIN) BASE_URL = DOMAIN; } catch (e) {}
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

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

var MIRROR_LIST = [];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {}

(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// ---- first() an toan ----
// QUIRK RUNTIME vBook (kiem chung tren may that 2026-11-11): Elements.first()
// KHONG bao gio tra null — select rong van tra mot object rong truthy
// (attr/text deu rong). Vi vay khong duoc dung kieu `if (!el.select(...).first())`
// de kiem tra ton tai hay lam fallback. Helper nay tra ve element that
// neu co, null neu khong co — kiem tra bang size() thay vi tin first().
function zhFirst(els) {
    if (!els) return null;
    try {
        if (els.size() > 0) return els.first();
    } catch (e) {}
    return null;
}

// Giu nguyen moi URL thuoc *.zongheng.com (ke ca http -> https);
// URL ngoai thi viet ve BASE_URL; URL tuong doi thi ghep vao BASE_URL.
function zhNormalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        if (/^https?:\/\/([a-z0-9-]+\.)*zongheng\.com(\/|$|\?|#)/i.test(url)) {
            return url.replace(/^http:\/\//i, "https://");
        }
        return url;
    }
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

// Ghep href tuong doi theo host cua trang dang doc (vd. anh bia, link chuong).
function zhResolve(href, pageUrl) {
    if (!href) return "";
    href = String(href).trim();
    if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0) return zhNormalizeUrl(href);
    if (href.indexOf("//") === 0) return "https:" + href;
    var host = "https://www.zongheng.com";
    if (pageUrl) {
        var m = String(pageUrl).match(/^https?:\/\/[^\/]+/i);
        if (m) host = m[0];
    }
    if (href.indexOf("/") === 0) return host + href;
    return host + "/" + href;
}

function zhHeaders(referer) {
    var h = {
        // BAT BUOC dung UA desktop (ngoai le quy tac 10, co bang chung):
        // UA mobile bi site 302 ve m.zongheng.com, ma m-site tra HTTP 500
        // (kiem chung 2026-11-11: mobile UA -> 302 -> m.zongheng.com 500;
        // desktop UA -> 200). Khong phai xoay UA, chi co dinh 1 UA desktop.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    };
    if (referer) h["Referer"] = referer;
    return h;
}

// Giai ma cac escape \uXXXX (ca dang \\uXXXX bi escape kep trong payload
// __NUXT__) ve ky tu that; "<br>" dang \u003Cbr\u003E ve lai thanh <br>.
function zhUnescape(s) {
    if (!s) return "";
    s = String(s);
    s = s.replace(/\\\\u([0-9a-fA-F]{4})/g, function (m, hex) {
        return String.fromCharCode(parseInt(hex, 16));
    });
    s = s.replace(/\\u([0-9a-fA-F]{4})/g, function (m, hex) {
        return String.fromCharCode(parseInt(hex, 16));
    });
    s = s.replace(/\\"/g, '"').replace(/\\\//g, "/").replace(/\\\\/g, "\\");
    return s;
}

function zhCleanText(s) {
    if (!s) return "";
    return String(s).replace(/[\s\u3000]+/g, " ").replace(/^\s+|\s+$/g, "");
}
