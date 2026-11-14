// config.js — cau hinh goc cua extension Banshanren (banshanren.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// Site: 搬山人小说网 — truyen chu tieng Trung, SSR, khong Cloudflare,
// khong can dang nhap de doc chuong. Du lieu lay qua API JSON rieng
// (/api/search, /api/rank) + scrape HTML cho danh sach /all/, chi tiet,
// muc luc, chuong. Khong co mirror biet duoc nen MIRROR_LIST mac dinh rong.
//
// Anh bia: site ma hoa AES moi anh cover (data-src tra ve byte ma hoa,
// khong phai anh that — kiem chung live 2026-11-14) nen extension khong
// lay cover (cover ""). He thong thumb ngau nhien cua base (goi worker
// ben thu ba + anh NSFW) da bo hoan toan, khong port theo.
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc tai
// them file nao khac o day. Script nao can pacing thi tu tai file
// rate-limit.js o dau file cua chinh no; script nao can lay phan tu
// dau tien an toan thi tai file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.banshanren.com";

try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Site la truyen nguoi lon (tag H / 高H / 肉文 / 乱伦 / NTR...), manifest
// gan co nsfw: true. Theo tien le valvrareteam (loai Incest/Netorare
// khoi danh sach the loai khi chua co quyet dinh cua Anh, dao nguoc duoc
// khi Anh noi): 4 tag nay khong hien trong genre.js va detail genres,
// nhung truyen mang tag do van tim duoc qua tim kiem / danh sach.
var HIDDEN_TAGS = ["乱伦", "骨科", "NTR", "NTL"];

function isHiddenTag(title) {
    for (var i = 0; i < HIDDEN_TAGS.length; i++) {
        if (title === HIDDEN_TAGS[i]) return true;
    }
    return false;
}

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
var MIRROR_LIST = [];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// Tach chuoi mirror cach nhau bang dau phay (hoac mang co san) thanh mang
// cac base URL sach (bo khoang trang va dau "/" cuoi).
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

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Chuan hoa URL ve host hien tai (doi domain/mirror van doc duoc link cu).
function normalizeUrl(url) {
    var u = String(url || "");
    if (!u) return u;
    if (u.indexOf("http") !== 0) {
        return BASE_URL + (u.charAt(0) === "/" ? "" : "/") + u;
    }
    return u.replace(/^(https?:\/\/)[^\/]+/, "$1" + BASE_URL.replace(/^https?:\/\//, ""));
}

function absUrl(href) {
    if (!href) return "";
    href = String(href);
    if (/^https?:\/\//i.test(href)) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function cleanText(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/[\s\u3000]+/g, " ")
        .trim();
}

function statusTag(meta) {
    if (meta.indexOf("连载") !== -1) return "连载中";
    if (meta.indexOf("完结") !== -1) return "完结";
    return "";
}

// Mot muc cua trang danh sach (`.novel_list .novel_li`).
function bookItem(el) {
    var link = safeFirst(el.select("a.title"));
    if (link === null) return null;
    var href = link.attr("href");
    var name = cleanText(link.text());
    if (!name || !href) return null;

    // Hai dong `.info_box` la "推荐度 N%" va "作者 · 状态 · N章 · N万字".
    var meta = "";
    var boxes = el.select(".title_box .info_box");
    for (var i = 0; i < boxes.size(); i++) {
        var text = cleanText(boxes.get(i).text());
        if (text && text.indexOf("推荐度") === -1) {
            meta = text;
            break;
        }
    }

    return {
        name: name,
        link: absUrl(href),
        description: meta,
        tag: statusTag(meta)
    };
}

// Tat ca muc cua trang danh sach. Bo qua o "热搜记录" (ul co class
// search_hot_box): 10 truyen hot do lap lai giong nhau tren moi trang.
function parseList(doc) {
    var items = [];
    var lists = doc.select("ul.novel_list");
    for (var i = 0; i < lists.size(); i++) {
        var ul = lists.get(i);
        if (String(ul.attr("class")).indexOf("search_hot_box") !== -1) continue;
        var rows = ul.select("li.novel_li");
        for (var j = 0; j < rows.size(); j++) {
            var item = bookItem(rows.get(j));
            if (item) items.push(item);
        }
    }
    return items;
}

// So trang tiep theo tu pager; trang la truong cuoi cua doan 7 trong
// "/all/<filters>-<sort>-<page>/".
function nextPageNumber(doc) {
    var links = doc.select(".pagination_box a");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href");
        var match = String(href).match(/\/all\/([0-9-]+)\//);
        if (match && cleanText(links.get(i).attr("title")) === "下一页") {
            var parts = match[1].split("-");
            return parts.length > 7 ? parts[7] : "";
        }
    }
    return "";
}

// Dung URL danh sach /all/. Cac filter la mot token noi bang dau gach
// ngang, hai truong cuoi la sort va page, vd /all/0-3-0-0-0-0-1-1/ la
// the loai 3, sort 1, trang 1; trang 2 sort 2 la /all/0-3-0-0-0-0-2-2/.
function allUrl(query, page) {
    var path = String(query || "/all/0-0-0-0-0-0-1-1/");
    var match = path.match(/\/all\/([0-9-]+)/);
    var parts = match ? match[1].split("-") : [];
    while (parts.length < 8) parts.push("0");
    parts[6] = (!parts[6] || parts[6] === "0") ? "1" : parts[6];
    parts[7] = "1";
    if (page && parseInt(page, 10) > 0) parts[7] = String(parseInt(page, 10));
    return BASE_URL + "/all/" + parts.slice(0, 8).join("-") + "/";
}

// Mot muc tu API JSON cua site (/api/search, /api/rank).
function apiItem(it) {
    var finished = String(it.finished) === "1";
    var meta = [];
    if (it.authors) meta.push(it.authors);
    meta.push(finished ? "完结" : "连载中");
    if (it.chapterCount) meta.push(it.chapterCount + "章");
    if (it.wordCountFormat) meta.push(it.wordCountFormat + "字");

    return {
        name: it.title,
        link: BASE_URL + "/novel/" + it.slug,
        description: meta.join(" · "),
        tag: finished ? "完结" : "连载中"
    };
}
