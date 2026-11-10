// helper.js — ham phu RIENG cua extension App Truyen Chu
// (apptruyenchu.pro). KHONG phai lib dung chung: cac ham duoi day
// (parseBookCard, parseListPage, unwrapCover, dedupeTitle...) chi dung
// cho giao dien rieng cua site nay, nen chi ton tai trong src/ cua ext
// nay, khong co ban goc trong lib/ o root repo. Neu ext khac muon dung
// lai thi copy co chon loc, khong dong bo md5 nhu file lib.
//
// Giu cac ham goc cua template (queryBuilder, htmlDecode, slugify) va them
// cac ham rieng cho site nay: boc anh qua proxy /_next/image, parse the
// truyen trong trang danh sach, tach so chuong/tong so chuong tu URL/text.
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file helper.js;
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js TRUOC helper.js vi cac ham duoi
// day dung BASE_URL (absUrl) va cleanText (config-helpers.js phai duoc
// load truoc helper.js neu script dung cleanText — cac script deu load
// config-helpers.js truoc helper.js). Build se copy file nay vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Ghe query tim kiem vao URL co san, dung dau "?" hay "&" tuy URL da co query.
function queryBuilder(base, params) {
    var url = base;
    var keys = Object.keys(params);
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = params[k];
        if (v === undefined || v === null || v === "") continue;
        url = url + (url.indexOf("?") === -1 ? "?" : "&") +
            encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
    }
    return url;
}

// Giai ma cac HTML entity pho bien trong tieu de/mo ta lay tu thuoc tinh HTML.
function htmlDecode(s) {
    var text = String(s === undefined || s === null ? "" : s);
    var map = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " "
    };
    var key = "";
    for (key in map) {
        text = text.split(key).join(map[key]);
    }
    text = text.replace(/&#(\d+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 10));
    });
    text = text.replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 16));
    });
    return text;
}

// Chuyen ten truyen tieng Viet co dau thanh slug khong dau (phuc vu tim
// kiem theo sitemap hoac so khop slug khi site khong co o tim kiem).
// Vi du: "De Che Vo Song" -> "de-che-vo-song".
function slugify(s) {
    var text = String(s === undefined || s === null ? "" : s).toLowerCase();
    var pairs = [
        [/[\u00e0\u00e1\u1ea1\u1ea3\u00e3\u00e2\u1ea7\u1ea5\u1ead\u1ea9\u1eab\u0103\u1eb1\u1eaf\u1eb7\u1eb3\u1eb5]/g, "a"],
        [/[\u00e8\u00e9\u1eb9\u1ebb\u1ebd\u00ea\u1ec1\u1ebf\u1ec7\u1ec3\u1ec5]/g, "e"],
        [/[\u00ec\u00ed\u1ecb\u1ec9\u0129]/g, "i"],
        [/[\u00f2\u00f3\u1ecd\u1ecf\u00f5\u00f4\u1ed3\u1ed1\u1ed9\u1ed5\u1ed7\u01a1\u1edd\u1edb\u1ee3\u1edf\u1ee1]/g, "o"],
        [/[\u00f9\u00fa\u1ee5\u1ee7\u0169\u01b0\u1eeb\u1ee9\u1ef1\u1eed\u1eef]/g, "u"],
        [/[\u1ef3\u00fd\u1ef5\u1ef7\u1ef9]/g, "y"],
        [/\u0111/g, "d"]
    ];
    var i = 0;
    for (i = 0; i < pairs.length; i++) {
        text = text.replace(pairs[i][0], pairs[i][1]);
    }
    text = text.replace(/[^a-z0-9]+/g, "-");
    text = text.replace(/^-+|-+$/g, "");
    return text;
}

// --- Rieng cho apptruyenchu.pro -------------------------------------------
// (Khao sat 2026-11-06: site Next.js; anh bia qua proxy /_next/image;
// the truyen la mot the <a> bao tron img + h3 + 2 div; site render 2 ban
// mobile/desktop nen cung mot the co the xuat hien 2 lan trong DOM.)

// Boc URL anh goc tu proxy /_next/image?url=<encoded>&w=..&q=..
// Vi du: /_next/image?url=https%3A%2F%2Fcdn.truyenonl.net%2F...jpg&w=3840&q=75
// -> https://cdn.truyenonl.net/...jpg . Neu khong phai dang proxy thi tra
// nguyen src (giai quyet thanh URL tuyet doi).
function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src);
    if (!s) return "";
    var m = s.match(/[?&]url=([^&]+)/);
    if (m) {
        try {
            return decodeURIComponent(m[1]);
        } catch (e) {
            return m[1];
        }
    }
    return absUrl(s);
}

// Site hien tieu de 2 lan lien tiep trong cung mot phan tu (ban day du +
// ban cat ngan co "..."). Cat bo phan lap lai: neu 20 ky tu dau xuat hien
// lan nua o sau vi tri 20 thi chi giu phan truoc do.
function dedupeTitle(s) {
    var t = String(s === undefined || s === null ? "" : s);
    if (t.length < 40) return t;
    var head = t.substring(0, 20);
    var again = t.indexOf(head, 20);
    if (again > 20) return t.substring(0, again).replace(/\s+$/g, "");
    return t;
}

// Slug truyen tu URL dang /truyen/<slug> (bo query).
function bookSlug(url) {
    var m = String(url || "").match(/\/truyen\/([^\/\?#]+)/);
    return m ? m[1] : "";
}

// So chuong tu URL dang /truyen/<slug>/chuong-<so>[-<slug-ten-chuong>].
// Tra ve 0 neu khong tach duoc.
function chapterNumber(url) {
    var m = String(url || "").match(/\/chuong-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

// Ten chuong hien thi tu URL + text cua link (neu co).
// Link "Doc truyen" co text khong phai ten chuong -> dung "Chuong N".
// Link "Chuong moi nhat" co text "Chuong 2479: ..." -> giu nguyen text.
function chapterName(url, linkText) {
    var n = chapterNumber(url);
    var t = cleanText(linkText || "");
    if (t && /^ch\u01b0\u01a1ng\s+\d+/i.test(t)) return dedupeTitle(t);
    if (n > 0) return "Ch\u01b0\u01a1ng " + n;
    return t || url;
}

// Tong so chuong tu text cua trang chi tiet, dang "2.479 chuong" / "71 chuong".
function totalChapters(text) {
    var m = String(text || "").match(/([\d\.]+)\s*ch\u01b0\u01a1ng/i);
    if (!m) return 0;
    var n = parseInt(m[1].replace(/\./g, ""), 10);
    return isNaN(n) ? 0 : n;
}

// Parse MOT the truyen trong trang danh sach /truyen.
// The la mot <a href="/truyen/<slug>"> bao tron <img> (alt = ten day du),
// <h3> ten truyen, div tac gia, div "N ch · X sao".
// Tra ve doi tuong item hoac null neu khong phai the truyen.
function parseBookCard(a) {
    var href = a.attr("href");
    if (!href) return null;
    if (!/^\/truyen\/[^\/\?#]+\/?$/.test(href)) return null;

    var img = a.select("img").first();
    var name = "";
    if (img !== null) name = cleanText(img.attr("alt"));
    if (!name) {
        var h3 = a.select("h3").first();
        if (h3 !== null) name = dedupeTitle(cleanText(h3.text()));
    }
    if (!name) return null;

    var cover = "";
    if (img !== null) cover = unwrapCover(img.attr("src"));

    // Tac gia + thong tin nam trong 2 the <p> (khao sat tren may that
    // 2026-11-06: the <a> chi co 2 <div> — div vo anh bia (rong) va div
    // ngoai — nen doc <div> se ra tac gia rong). Du phong: <div>.
    var ps = a.select("p");
    var author = ps.size() > 0 ? cleanText(ps.get(0).text()) : "";
    var info = ps.size() > 1 ? cleanText(ps.get(1).text()) : "";
    if (ps.size() === 0) {
        var divs = a.select("div");
        author = divs.size() > 0 ? cleanText(divs.get(0).text()) : "";
        info = divs.size() > 1 ? cleanText(divs.get(1).text()) : "";
    }

    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: author,
        tag: info,
        host: siteOrigin()
    };
}

// Parse ca trang danh sach /truyen (dung chung cho home/genre/search).
// currentPage: so trang hien tai (mac dinh 1). Tra ve { items, next }.
// next = so trang ke ("") = het; tinh tu link phan trang co page=N lon nhat.
function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    doc.select("a[href]").forEach(function (a) {
        var item = parseBookCard(a);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var maxPage = cur;
    doc.select("a[href]").forEach(function (a) {
        var m = String(a.attr("href")).match(/[?&]page=(\d+)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    });

    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}
