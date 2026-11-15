// helper.js — Ham dung chung cho 墨坛文学网 (22mt.net).
//
// Site HTML tinh phia server, UTF-8 (kiem chung live 2026-11-15):
// - Trang chu 200, 44 KB: nav co 8 the loai (/list/1.html ... /list/8.html,
//   TEN THAT lay tu <title> moi trang list: 1 玄幻, 2 修真, 3 都市,
//   4 历史, 5 网游, 6 科幻, 7 言情, 8 其它 — nhan nav cu "武侠" o
//   /list/2.html la SAI) + form tim kiem GET /search.php?q=.
//   2 muc trang chu: 最新入库 (/lastpost/) va 最新更新 (/lastupdate/),
//   moi muc la .box.new .row.tab-content.
// - Trang danh sach /list/<N>.html, /top/, /full/, /lastupdate/,
//   /lastpost/: 20 muc/trang (top/full 30 muc), moi muc la
//   .box.hot .row .col-12.col-md-6 dl (dt img bia, dd h3 a ten +
//   link /<slug>/, dd.book_other: tac gia / trang thai / ngay cap
//   nhat / chuong moi nhat). Phan trang: div.pages ul.pagination,
//   link ">" sang trang ke (/list/1/2.html, /lastupdate/2.html,
//   /top/all_0_2.html, /full/0_2.html).
// - Ket qua tim kiem GET /search.php?q=<kw>&p=<N>: cung cau truc
//   the dl nhu tren; tieu de "共N条记录".
// - Chi tiet /<slug>/: meta og:novel:* (book_name, author, category,
//   status 连载/完本, update_time, latest_chapter_name, description,
//   image) + h1 ten + .book_info img bia (duong dan tuong doi) +
//   #intro_pc gioi thieu + .options li (tac gia / ngay cap nhat /
//   trang thai / chuong moi nhat) + .info_other tac pham khac.
// - Muc luc tren trang chi tiet: .book_list.book_list2 ul.row li a,
//   100 chuong/trang; phan trang /<slug>/index_<N>.html (vd 624
//   chuong = 7 trang). TRANG 1 CO QUIRK: 12 chuong MOI NHAT dung
//   dau (giam dan), roi moi den ch.1..100 tang dan — toc.js cat
//   bo 12 muc dau do de muc luc doc theo thu tu tang dan; 12 chuong
//   moi nhat van co mat o dung vi tri tren trang cuoi (trung link),
//   chi mat cac muc thong bao (完本感言, quang cao sach moi) khong
//   phai chuong truyen.
// - Trang muc luc index_<N>.html: tu VM tra 502 Cloudflare lien tuc
//   3 lan (2026-11-15) trong khi trang chi tiet tra 200 — co the la
//   tarpit IP datacenter; test tren may that se xac nhan.
// - Chuong /<slug>/<id>/ (trang 1) va /<slug>/<id>_<N>/ (trang N):
//   noi dung o article.font_max; dau/cuoi co dong "第(N/M)页" can
//   cat; chap.js ghep du cac trang _2.._M theo marker do.
//   Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview
//   (kiem chung ch.1 绝境黑夜: 3 trang, ~8000 ky tu, mo dau
//   "依依..." giac mo; chuong cuoi 625后记 cung doc du).
// - Khong co mirror dung duoc (m. va bare domain deu 301 ve www).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// giai ma UTF-8 (site dung UTF-8, khong phai GBK). Duong chinh:
// pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi jitter,
// retry 429/405/503, tu ghi cooldown khi bi chan. Rieng HTTP 502
// (Cloudflare hay tra cho trang phan trang tu IP datacenter — gap
// 3 lan lien tuc ngay 2026-11-15) thi thu lai 1 lan nua tren cung URL.
// Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing). Tra ve { doc: Document } khi thanh cong,
// hoac { error: "tieng Viet" }.
function fetchMtDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var attempt = 0;
        for (attempt = 0; attempt < 2; attempt++) {
            var res = null;
            try {
                res = pacedFetch(candidates[i], {});
            } catch (e) {
                lastError = "Không tải được trang (lỗi mạng): " + url;
                break;
            }
            if (!res) {
                lastError = "Không tải được trang: " + url;
                break;
            }
            if (res.error === "cooldown") {
                return { error: rateLimitErrorMessage("墨坛文学网", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
            }
            if (!res.ok) {
                var st = res.status || 0;
                if (st === 429 || st === 405) {
                    return { error: rateLimitErrorMessage("墨坛文学网", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
                }
                if (st === 502 && attempt === 0) {
                    lastError = "Không tải được trang (HTTP 502): " + url;
                    continue;
                }
                if (st) {
                    lastError = "Không tải được trang (HTTP " + st + "): " + url;
                    break;
                }
                lastError = "Không tải được trang (lỗi mạng): " + url;
                break;
            }
            var doc = null;
            try {
                doc = res.res.html();
            } catch (e2) {
                lastError = "Không đọc được nội dung trang: " + url;
                break;
            }
            if (!doc) {
                lastError = "Không đọc được nội dung trang: " + url;
                break;
            }
            return { doc: doc };
        }
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Tach slug truyen tu URL dang /<slug>/, /<slug>/<id>/,
// /<slug>/<id>_<N>/, /<slug>/index_<N>.html. Tra "" neu khong tach duoc.
function bookSlug(url) {
    var m = String(url || "").match(/22mt\.net\/([^\/\?#]+)/i);
    return m ? m[1] : "";
}

// URL trang chi tiet chuan: doi host ve BASE_URL, dam bao co dau "/"
// cuoi (app cat dau "/" cuoi khoi arg khi chay that).
function detailUrlOf(url) {
    var u = normalizeUrl(url);
    if (!u) return "";
    if (u.slice(-1) !== "/") u = u + "/";
    return u;
}

// So trang cua mot URL danh sach: ?p=N, _N.html, /N.html; mac dinh 1.
function pageNumOf(u) {
    var s = String(u || "");
    var m = s.match(/[?&]p=(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/_(\d+)\.html$/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/\/(\d+)\.html$/);
    if (m) return parseInt(m[1], 10);
    return 1;
}

// Token trang ke tu link ">" (hoac "下一页") trong div.pages.
// Chi nhan khi so trang moi lon hon so trang hien tai; het thi "".
// Fallback: mot so trang list (/list/N.html, /top/, /full/) KHONG co
// link ">" (no nam trong comment HTML) ma chi hien link so 1,2,3 —
// khi do lay href cua link so = trang hien tai + 1.
function nextPageToken(doc, currentUrl) {
    var cur = pageNumOf(currentUrl);
    var links = doc.select(".pages ul.pagination a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var t = cleanText(a.text());
        if (t === ">" || t === "下一页" || t === "下页") {
            var href = a.attr("href") || "";
            if (href && pageNumOf(href) > cur) return href;
            return "";
        }
    }
    for (i = 0; i < links.size(); i++) {
        var a2 = links.get(i);
        var href2 = a2.attr("href") || "";
        var n = parseInt(cleanText(a2.text()), 10);
        if (!isNaN(n) && n === cur + 1 && href2 && pageNumOf(href2) === n) return href2;
    }
    return "";
}

// Parser 1 the truyen dang the dl (trang /list/, /top/, /full/,
// /lastupdate/, /lastpost/, ket qua tim kiem). Cau truc that:
// dt a img (bia) + dd h3 a (ten + link /<slug>/) +
// dd.book_other: tac gia / trang thai / ngay cap nhat / chuong moi.
function parseCardRow(el) {
    var titleEl = safeFirst(el.select("dd h3 a"));
    if (titleEl === null) return null;
    var name = cleanText(titleEl.text());
    if (!name) return null;
    var link = absUrl(titleEl.attr("href"));
    if (!link) return null;
    if (link.slice(-1) !== "/") link = link + "/";
    var cover = "";
    var img = safeFirst(el.select("dt a img"));
    if (img !== null) {
        var src = img.attr("src") || "";
        if (src.indexOf("//") === 0) src = "https:" + src;
        cover = absUrl(src);
    }
    var author = "";
    var status = "";
    var latest = "";
    var others = el.select("dd.book_other");
    var j = 0;
    for (j = 0; j < others.size(); j++) {
        var line = cleanText(others.get(j).text());
        if (line.indexOf("作者") === 0) author = line.replace(/^作者[：:]\s*/, "");
        else if (line.indexOf("状态") === 0) status = line.replace(/^状态[：:]\s*/, "");
        else if (line.indexOf("最新章节") === 0) latest = line.replace(/^最新章节[：:]\s*/, "");
    }
    var desc = author;
    if (latest) desc = author ? author + " — Mới: " + latest : "Mới: " + latest;
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: status,
        host: siteOrigin()
    };
}

// Parser 1 dong truyen dang hang .row.tab-content (muc trang chu
// 最新入库 / 最新更新): .kind the loai, .bookname a ten + link,
// .chap a chuong moi, .author tac gia, .time ngay cap nhat.
function parseTabRow(el) {
    var titleEl = safeFirst(el.select(".bookname a"));
    if (titleEl === null) return null;
    var name = cleanText(titleEl.text());
    if (!name) return null;
    var link = absUrl(titleEl.attr("href"));
    if (!link) return null;
    if (link.slice(-1) !== "/") link = link + "/";
    var author = "";
    var authorEl = safeFirst(el.select(".author"));
    if (authorEl !== null) author = cleanText(authorEl.text());
    var latest = "";
    var chapEl = safeFirst(el.select(".chap a"));
    if (chapEl !== null) latest = cleanText(chapEl.text());
    var cat = "";
    var kindEl = safeFirst(el.select(".kind a"));
    if (kindEl !== null) cat = cleanText(kindEl.text()).replace(/[\[\]]/g, "");
    var desc = author;
    if (latest) desc = author ? author + " — Mới: " + latest : "Mới: " + latest;
    return {
        name: name,
        link: link,
        description: desc,
        tag: cat,
        host: siteOrigin()
    };
}

// Parser ca danh sach: thu the dl truoc, roi hang tab-content;
// bo trung theo link.
function parseListRows(doc) {
    var items = [];
    var seen = {};
    var i = 0;
    var cards = doc.select(".box.hot dl");
    for (i = 0; i < cards.size(); i++) {
        var item = parseCardRow(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    if (items.length > 0) return items;
    var rows = doc.select(".box.new .row.tab-content");
    for (i = 0; i < rows.size(); i++) {
        var item2 = parseTabRow(rows.get(i));
        if (item2 && !seen[item2.link]) {
            seen[item2.link] = true;
            items.push(item2);
        }
    }
    return items;
}

// Tach so chuong o dau ten chuong: "001诡影 一" -> 1, "第1章 父子" -> 1,
// "625后记" -> 625, "完本感言" -> null.
function chapNum(title) {
    var m = String(title || "").match(/^(?:第)?(\d+)/);
    if (!m) return null;
    return parseInt(m[1], 10);
}
