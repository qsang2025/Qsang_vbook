// helper.js — ham phu cua extension 七猫免费小说 (qimao.com).
//
// Trang danh sach cua qimao (/shuku/... va /paihang/...) la SSR nhung
// class DOM chua xac dinh duoc tu VM (VM bi WAF chan — chi doc duoc qua
// trinh thuat/crawler), nen parser o day DUNG CHUNG, khong phu thuoc
// class cu the: tim link chi tiet /shuku/<so>/ roi leo len container
// chua anh + mo ta. Khi nao lay duoc HTML tho that (tren may) thi thu
// hep selector theo DOM that.
//   Dong truyen (khao sat qua crawler 2026-11-09):
//     <a href="/shuku/<bookid>/">Ten</a> + <a>Ten the loai</a> +
//     连载中/完结 + <so>万字 + gioi thieu + tac gia + <ngay>更新
//     Bia: cdn.qimao.com/bookimg/... hoac cdn.wtzw.com/bookimg/...
//     (anh mac dinh: .../default-book-cover.*.png -> bo, de trong)
//   Phan trang /shuku/: duoi URL dang ...-<sort>-<N>/, tang N.
//   Phan trang /paihang/: chua ro pattern — chi theo link "下一页" that.
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('config-helpers.js');
//     load('fetch-helpers.js');
//     load('helper.js');
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js +
// fetch-helpers.js TRUOC helper.js (cac ham duoi day dung BASE_URL,
// absUrl, cleanText, siteOrigin).
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

// --- Rieng cho qimao.com -------------------------------------------------
// Link chi tiet sach: /shuku/<bookid>/ (chi so, KHONG co dau "-" + so
// chuong). Link chuong co dang /shuku/<bookid>-<chapterid>/ nen phai
// loai bang regex chat (ket thuc bang "/shuku/<so>/").
function isDetailHref(href) {
    if (!href) return false;
    return /^\/shuku\/\d+\/?$/.test(href) || /^https?:\/\/[^\/]+\/shuku\/\d+\/?$/.test(href);
}

function isChapterHref(href) {
    if (!href) return false;
    return /\/shuku\/\d+-\d+\/?$/.test(href);
}

// Tim container chua anh bia: chi chinh element anchor (img nam TRONG anchor).
// LUU Y runtime vBook: Element KHONG co .parent() (goi se nem TypeError) nen
// khong leo len cha duoc; anh bia nam ngoai anchor se lay qua buildCoverMap
// (map alt -> src) o parseBookRows.
function findCoverContainer(el) {
    try {
        var img = el.select("img").first();
        if (img !== null) return el;
    } catch (e) {
    }
    return null;
}

// Map ten sach -> URL bia, lay tu moi <img> co alt (= ten sach) trong doc.
// Dung de dien bia cho cac dong ma anh khong nam trong anchor (vi khong leo
// len cha duoc). Bo qua anh mac dinh. Key = alt da cleanText.
function buildCoverMap(doc) {
    var map = {};
    try {
        doc.select("img").forEach(function (im) {
            var alt = cleanText(im.attr("alt") || "");
            if (!alt) return;
            var src = im.attr("data-src") || im.attr("src") || "";
            if (!src) return;
            if (src.indexOf("default-book-cover") !== -1) return;
            if (!map[alt]) map[alt] = absUrl(src);
        });
    } catch (e) {}
    return map;
}

// Parse MOT dong truyen tu anchor chi tiet <a href="/shuku/<id>/">.
// Lay ten tu anchor (hoac alt cua anh), bia tu container, mo ta/tag tu
// text cua container (trang thai 连载中/完结, so chu 万字, tac gia,
// ngay cap nhat). Tra ve item hoac null.
function parseBookRowFromAnchor(a) {
    var href = a.attr("href");
    if (!isDetailHref(href)) return null;
    var link = absUrl(href);

    var name = cleanText(a.attr("title")) || cleanText(a.text());
    var container = findCoverContainer(a);
    var cover = "";
    if (container !== null) {
        var img = container.select("img").first();
        if (img !== null) {
            cover = img.attr("data-src") || img.attr("src") || "";
            if (cover.indexOf("default-book-cover") !== -1) cover = "";
            else if (cover) cover = absUrl(cover);
        }
    }
    if (!name) {
        if (container !== null) {
            var img0 = container.select("img").first();
            if (img0 !== null) name = cleanText(img0.attr("alt"));
        }
    }
    if (!name) return null;

    var fullText = container !== null ? cleanText(container.text()) : "";
    // Mo ta: text cua container tru ten sach; cat ngan 400 ky tu.
    var desc = fullText;
    if (name && desc.indexOf(name) !== -1) {
        desc = cleanText(desc.replace(name, ""));
    }
    if (desc.length > 400) desc = desc.substring(0, 400);

    var tag = "";
    var statusMatch = fullText.match(/已完结|完结|连载中/);
    var sizeMatch = fullText.match(/[\d.]+万字/);
    if (statusMatch) tag = statusMatch[0];
    if (sizeMatch) tag = tag ? tag + " · " + sizeMatch[0] : sizeMatch[0];

    return {
        name: htmlDecode(name),
        cover: cover,
        link: link,
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Ten chi la so thu hang ("1".."9") — gap o bang xep hang /paihang/: moi sach co
// 2 anchor cung link (1 anchor so thu hang + anh bia, 1 anchor ten sach).
function isBareNumber(s) {
    var t = cleanText(s || "");
    return /^\d+$/.test(t);
}

// Gop 2 item cung link: lay ten that (khong phai so thu hang, uu tien ten dai hon),
// bia that (uu tien bia khong rong), mo ta dai hon, tag dau tien khong rong.
function mergeBookItems(oldItem, newItem) {
    var name = oldItem.name;
    if (isBareNumber(name) && !isBareNumber(newItem.name)) {
        name = newItem.name;
    } else if (!isBareNumber(newItem.name) && newItem.name.length > name.length) {
        name = newItem.name;
    }
    var cover = oldItem.cover || newItem.cover;
    var desc = oldItem.description || "";
    var desc2 = newItem.description || "";
    if (desc2.length > desc.length) desc = desc2;
    var tag = oldItem.tag || newItem.tag;
    return { name: name, cover: cover, link: oldItem.link, description: desc, tag: tag, host: oldItem.host };
}

// Parse ca danh sach trong doc: quet moi anchor chi tiet; cung link xuat hien
// nhieu lan thi GOP lai (ten that + bia that) thay vi giu anchor dau tien.
// Sau do dien bia con thieu tu map alt -> src (anh bia co the nam ngoai anchor).
function parseBookRows(doc) {
    var items = [];
    var indexByLink = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!isDetailHref(href)) return;
        var item = parseBookRowFromAnchor(el);
        if (!item) return;
        if (indexByLink[item.link] === undefined) {
            indexByLink[item.link] = items.length;
            items.push(item);
        } else {
            items[indexByLink[item.link]] = mergeBookItems(items[indexByLink[item.link]], item);
        }
    });
    var coverMap = buildCoverMap(doc);
    items.forEach(function (it) {
        if (!it.cover) {
            var c = coverMap[cleanText(it.name)];
            if (c) it.cover = c;
        }
    });
    return items;
}

// --- Trang thu thach Aliyun WAF ---------------------------------------------
// www.qimao.com dung Aliyun WAF: fetch thuong (khong chay JS) nhan ve trang
// thu thach HTTP 200 (meta aliyun_waf_aa + textarea#renderData, khong title/
// link/anh) thay cho trang that. Chi headless browser (chay JS, dat cookie)
// moi qua duoc. Phat hien bang dau hieu rieng cua trang WAF (khong trung voi
// trang that).
function isAliyunWafPage(raw) {
    if (!raw) return false;
    if (raw.indexOf("aliyun_waf_aa") !== -1) return true;
    if (raw.indexOf('id="renderData"') !== -1) return true;
    return false;
}

// Trang da qua WAF: co title hoac co link that.
function docLooksReal(doc) {
    try {
        var t = doc.select("title").text() || "";
        if (t && t.length > 0) return true;
        if (doc.select("a[href]").size() > 0) return true;
    } catch (e) {}
    return false;
}

// Thu lay trang that qua headless browser (chay JS cua WAF roi moi doc).
// Tra ve Document that hoac null. Chi goi khi Engine co san.
function fetchRealPageViaBrowser(url) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") return null;
    var browser = null;
    try {
        browser = Engine.newBrowser();
        var doc = browser.launch(url, 20000);
        var tries = 0;
        while (doc && tries < 5 && !docLooksReal(doc)) {
            doc = browser.html(4000);
            tries = tries + 1;
        }
        if (!doc || !docLooksReal(doc)) {
            if (browser.close) browser.close();
            return null;
        }
        if (browser.close) browser.close();
        return doc;
    } catch (e) {
        try { if (browser && browser.close) browser.close(); } catch (e2) {}
        return null;
    }
}

// Lay duong dan trang ke:
//  1. Link "下一页" that trong pager (uu tien nhat).
//  2. URL /shuku/ dang ...-<sort>-<N>/ -> tang N.
//  3. /paihang/... khong co pattern phan trang xac minh -> "".
// Tra ve path (bat dau "/") hoac "".
function nextPagePath(doc, pageUrl) {
    var links = doc.select("a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var t = cleanText(el.text()) || "";
        var title = el.attr("title") || "";
        if (t === "下一页" || title.indexOf("下一页") !== -1) {
            var href = el.attr("href");
            if (!href) return "";
            if (href.indexOf("http") === 0) {
                var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
                return m ? m[1] : "";
            }
            if (href.charAt(0) === "/") return href;
            return "";
        }
    }
    if (pageUrl) {
        var mm = pageUrl.match(/^(.*\/shuku\/.*-)(\d+)(\/.*)$/);
        if (mm) {
            var next = parseInt(mm[2], 10) + 1;
            return mm[1] + next + mm[3];
        }
        // /shuku/... khong co dau "/" cuoi (app co the strip): ...-<N>
        var mm2 = pageUrl.match(/^(.*\/shuku\/.*-)(\d+)$/);
        if (mm2) {
            var next2 = parseInt(mm2[2], 10) + 1;
            return mm2[1] + next2 + "/";
        }
    }
    return "";
}

// Parse cac link chuong /shuku/<bookid>-<chapterid>/ trong mot doc (dung
// cho toc.js): tra ve mang {href, name} theo dung thu tu DOM, bo trung.
function parseChapterLinks(doc, bookId) {
    var out = [];
    var seen = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        if (href.indexOf("/shuku/" + bookId + "-") === -1) return;
        if (!isChapterHref(href)) return;
        var name = cleanText(el.text());
        if (!name) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        out.push({ href: href, name: name });
    });
    return out;
}

// --- __NUXT__ state: nguon chinh cho trang danh sach ----------------------
// Trang danh sach cua qimao (/shuku/... va /paihang/...) la Nuxt SSR:
// HTML tho chua day du text (ten sach, tac gia, mo ta) nhung gan nhu
// KHONG co link that nao (trang chi tiet chi co 1 anchor
// javascript:void(0)). Du lieu that nam trong window.__NUXT__ — mang
// sach o mot trong cac key duoi (ten key doi theo tung trang, nen thu
// lan luot). Ham nay tra ve mang item {name, cover, link, description,
// tag, host} da chuan hoa, hoac [] khi khong tim thay mang sach nao.
// Ghi chu: key "list" la key chung — chi chap nhan mang co it nhat 1
// object co id so + title, de tranh vo phai mang khac (vi du danh sach
// chuong cua trang chi tiet).
// LUU Y /paihang/ (kiem chung 2026-11-10): __NUXT__ khong co mang nao trong
// cac key duoi — ca tren trang WAF (khong co __NUXT__ luon) lan trang that
// (co __NUXT__ nhung khong co key nao trong danh sach) — nen DOM
// (parseBookRows, gop anchor trung link) la nguon chinh o bang xep hang.
function unescapeJsonStr(s) {
    if (!s) return "";
    var out = s;
    out = out.replace(/\\u([0-9a-fA-F]{4})/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 16));
    });
    out = out.replace(/\\"/g, '"').replace(/\\\//g, "/").replace(/\\n/g, " ").replace(/\\r/g, " ");
    return out;
}

// Cat mang JSON bat dau tai vi tri key: "key":[...], ton trong chuoi
// (co escape) va dem ngoac vuong/nhon dung cap. Tra ve chuoi mang hoac "".
function nuxtArrayText(raw, key) {
    var idx = raw.indexOf('"' + key + '":[');
    if (idx === -1) return "";
    var start = raw.indexOf('[', idx);
    if (start === -1) return "";
    var depth = 0;
    var inStr = false;
    var esc = false;
    var i = 0;
    for (i = start; i < raw.length; i++) {
        var ch = raw.charAt(i);
        if (inStr) {
            if (esc) esc = false;
            else if (ch === "\\") esc = true;
            else if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === '[' || ch === '{') depth++;
        else if (ch === ']' || ch === '}') {
            depth--;
            if (depth === 0) return raw.substring(start, i + 1);
        }
    }
    return "";
}

// Cat tung object top-level trong mot chuoi mang JSON "[{...},{...}]".
function splitTopObjects(arrText) {
    var objs = [];
    var braceDepth = 0;
    var inStr = false;
    var esc = false;
    var start = -1;
    var i = 0;
    for (i = 0; i < arrText.length; i++) {
        var ch = arrText.charAt(i);
        if (inStr) {
            if (esc) esc = false;
            else if (ch === "\\") esc = true;
            else if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === '{') {
            if (braceDepth === 0) start = i;
            braceDepth++;
        } else if (ch === '}') {
            braceDepth--;
            if (braceDepth === 0 && start !== -1) {
                objs.push(arrText.substring(start, i + 1));
                start = -1;
            }
        }
    }
    return objs;
}

function nuxtField(objText, names, isNum) {
    var i = 0;
    for (i = 0; i < names.length; i++) {
        var key = names[i];
        var m = null;
        if (isNum) {
            m = objText.match(new RegExp('"' + key + '"\\s*:\\s*"?([0-9]+)"?'));
        } else {
            m = objText.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
        }
        if (m && m[1]) return unescapeJsonStr(m[1]);
    }
    return "";
}

function nuxtBookFromObject(objText) {
    var id = nuxtField(objText, ["book_id", "id"], true);
    if (!id || !/^\d+$/.test(id)) return null;
    var title = nuxtField(objText, ["title", "book_name", "book_title"], false);
    if (!title) return null;
    var author = nuxtField(objText, ["author", "author_name"], false);
    var cover = nuxtField(objText, ["image_link", "cover", "thumb_url", "img"], false);
    if (cover) {
        if (cover.indexOf("default-book-cover") !== -1) cover = "";
        else cover = absUrl(cover);
    }
    var intro = nuxtField(objText, ["intro", "abstract", "desc"], false);
    var desc = cleanText(intro);
    if (author) desc = author + (desc ? " — " + desc : "");
    var tag = "";
    var words = nuxtField(objText, ["words_num"], false);
    if (!words) {
        var wm = objText.match(/"words_num"\s*:\s*\{[^}]*?"value"\s*:\s*"([^"]*)"/);
        if (wm) words = unescapeJsonStr(wm[1]);
    }
    var score = "";
    var sm = objText.match(/"score"\s*:\s*\{[^}]*?"value"\s*:\s*"([^"]*)"/);
    if (sm) score = unescapeJsonStr(sm[1]);
    if (!score) score = nuxtField(objText, ["score"], false);
    if (score) tag = score + "分";
    if (words) tag = tag ? tag + " · " + words : words;
    return {
        name: htmlDecode(title),
        cover: cover,
        link: BASE_URL + "/shuku/" + id + "/",
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Thu cac key mang sach pho bien trong __NUXT__ state. Tra ve mang item
// (co the rong). Key duoc thu theo thu tu uu tien; lay mang dau tien co
// it nhat 1 sach hop le.
function extractNuxtBooks(raw) {
    if (!raw) return [];
    var keys = ["book_list", "books", "list", "data_list", "bookList", "bookData", "recommend_list", "hot_list", "new_list", "rank_list"];
    var k = 0;
    for (k = 0; k < keys.length; k++) {
        var arrText = nuxtArrayText(raw, keys[k]);
        if (!arrText) continue;
        var objs = splitTopObjects(arrText);
        var items = [];
        var seen = {};
        var i = 0;
        for (i = 0; i < objs.length; i++) {
            var item = nuxtBookFromObject(objs[i]);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        }
        if (items.length > 0) return items;
    }
    return [];
}
