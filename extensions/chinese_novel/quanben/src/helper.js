// helper.js — Ham dung chung cho QuanBen.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day (co che tai file khong de quy). Script nao
// dung helper nay phai tai truoc theo thu tu:
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file rate-limit.js;
//     file safe-first.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
//
// QUAN TRONG — 2 domain cung he thong, khac giao dien:
// - quanben.io: giao dien cu (/c/<slug>.html, /n/<slug>/list.html + JSONP
//   muc luc, search /index.php). TU MAY THAT (HONOR PTP-AN10) MOI REQUEST
//   DEU 403 + trang "HTTP Server Test Page powered by CentOS" (kiem chung
//   2026-11-12): may chu tra ve khong nhan host nay tu mang cua may —
//   doi UA / them Accept-Language deu van 403; tu VM thi 200 binh thuong.
//   Vi vay quanben.io CHI de trong config DOMAIN du phong, KHONG lam mac dinh.
// - quanben5.com: MAC DINH (moi request tu may that deu 200). Giao dien
//   moi ("app_quanben5"): the loai /category/<N>.html (16 muc, phan trang
//   /category/<N>_<P>.html), chi tiet /n/<slug>/ (h1, .pic_txt_list,
//   p.info 作者/类别/状态, div.description), muc luc TINH DU o
//   /n/<slug>/xiaoshuo.html (3.813 chuong/truyen mau, KHONG can JSONP),
//   tim kiem qua JSONP /?c=book&a=search.json (callback=search, b =
//   base64 rieng cua site), chuong <div id="content"> (co <span id="ad">).
//   Kiem chung live 2026-11-12 (VM + may that).

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchQBDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("QuanBen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("QuanBen", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = docFromResponse(res.res, url);
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    return { doc: doc };
}

// Fetch 1 URL tra ve TEXT tho (dung cho JSONP tim kiem) — cung pacing nhu
// fetchQBDoc. Tra ve { text: "..." } hoac { error: "tieng Viet" }.
function fetchQBText(url, referer) {
    var res = null;
    try {
        var opts = {};
        if (referer) opts.referer = referer;
        res = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("QuanBen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("QuanBen", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = res.res.text() || "";
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    return { text: text };
}

// Ham base64 rieng cua he thong quanben (nguyen ban tu script tren site):
// moi ky tu input dich +3 trong bang 62 ky tu, xen 2 ky tu ngau nhien.
// Server giai ma bang cach lay ky tu o vi tri 1, 4, 7, ... roi dich nguoc.
// Dung cho tham so b cua JSONP (tim kiem tren quanben5.com; muc luc tren
// quanben.io — server KIEM TRA b, gui sai se tra "参数错误！5").
function qbBase64(str) {
    var staticchars = "PXhw7UT1B0a9kQDKZsjIASmOezxYG4CHo5Jyfg2b8FLpEvRr3WtVnlqMidu6cN";
    var out = "";
    var i = 0;
    for (i = 0; i < str.length; i++) {
        var num0 = staticchars.indexOf(str.charAt(i));
        var code = num0 === -1 ? str.charAt(i) : staticchars.charAt((num0 + 3) % 62);
        var num1 = Math.floor(Math.random() * 62);
        var num2 = Math.floor(Math.random() * 62);
        out += staticchars.charAt(num1) + code + staticchars.charAt(num2);
    }
    return out;
}

// Parser MOT hang truyen div.pic_txt_list thanh doi tuong truyen
// { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: h3 > a (span ben trong, du phong text a).
//   - Bia: div.pic img (src https://img.c0m.io/...).
//   - Mo ta: p.description (bo span.read_ico "简" o dau).
//   - Tag: ten tac gia (span.author trong p.info).
function parseBookRow(row) {
    var titleEl = safeFirst(row.select("h3 > a"));
    if (titleEl === null) return null;
    var href = titleEl.attr("href") || "";
    var nameEl = safeFirst(titleEl.select("span"));
    var name = nameEl !== null ? cleanText(nameEl.text()) : cleanText(titleEl.text());
    if (!href || !name) return null;

    var cover = "";
    var img = safeFirst(row.select("div.pic img"));
    if (img === null) img = safeFirst(row.select("img"));
    if (img !== null) {
        cover = img.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var description = "";
    var descEl = safeFirst(row.select("p.description"));
    if (descEl !== null) {
        description = cleanText(descEl.text());
        if (description.indexOf("简") === 0) description = cleanText(description.substring(1));
    }

    var tag = "";
    var authorEl = safeFirst(row.select("span.author"));
    if (authorEl !== null) tag = cleanText(authorEl.text());

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: description,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach div.pic_txt_list (dung chung cho book/search).
// Dedupe theo link.
function parseBookList(doc) {
    var items = [];
    var seen = {};
    doc.select("div.pic_txt_list").forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang the loai ("" = het). Site dung link "下一页"
// (co the khong co o trang cuoi); link co the la dang tuong doi.
function qbNextPage(doc) {
    var nextUrl = "";
    doc.select("a").forEach(function (el) {
        if (cleanText(el.text()) === "下一页") {
            nextUrl = el.attr("href") || "";
        }
    });
    nextUrl = cleanText(nextUrl);
    if (!nextUrl || nextUrl === "#") return "";
    return absUrl(nextUrl);
}
