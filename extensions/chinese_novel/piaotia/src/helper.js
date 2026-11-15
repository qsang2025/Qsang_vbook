// helper.js — Ham dung chung cho 飘天文学 (piaotia.com).
//
// Site HTML tinh phia server, ma GBK (kiem chung live 2026-11-15):
// - Trang chu https://www.piaotia.com/ 200, 43 KB: nav co /booksort<N>/
//   (9 the loai) + cac bang xep hang /booktop*/0/1.html.
// - Danh sach /booksort<N>/0/<page>.html: table.grid, 30 muc/trang
//   (td.odd a[bookinfo] ten, td.even a chuong moi, td.odd tac gia,
//   字数/更新/状态), phan trang /booksort<N>/0/<N>.html (cat 1 co 141 trang).
//   Bang xep hang (/booktopallvisit/...) cung mau table.grid.
// - Tim kiem: POST /modules/article/search.php, searchkey MA GBK +
//   searchtype=articlename (radio 书名 mac dinh checked). 1 ket qua duy
//   nhat -> 302 thang ve trang chi tiet; nhieu ket qua -> trang "搜索结果"
//   cung mau table.grid (7 muc voi "九重天"); phan trang bang link
//   search.php?searchkey=<GBK percent>&searchtype=articlename&page=N.
//   POST UTF-8 tra 0 ket qua (tien le biqugezz/bixiange) nen search.js
//   submit form cua chinh site qua WebView de trinh duyet encode GBK.
// - Chi tiet /bookinfo/<cat>/<id>.html: h1 ten; bang thong tin trong
//   #centerm (#content): 类别/作者/全文长度/最后更新/文章状态/收藏数;
//   bia /files/article/image/<cat>/<id>/<id>s.jpg; mo ta sau
//   "内容简介：" trong td 80%; link chuong moi nhat.
// - Muc luc /html/<cat>/<id>/index.html: .centent ul li a, DAY DU tren
//   1 trang (傲世九重天 2694 chuong), khong phan trang, khong lap lai
//   chuong moi nhat o dau (khac base cu — base cat 12 muc dau la SAI o day).
// - Chuong /html/<cat>/<id>/<cid>.html: noi dung la text tran truc tiep
//   duoi <body> (khong co #content, khong co <p>), bat dau bang dong tieu
//   de chuong + "(《》)", ket thuc truoc <div class="bottomlink">.
//   Tieu de lay tu <title>: "书名最新章节,第X部 卷名 第Y章 标题,PT文学".
//   Khong thay chuong chia trang (ch.1 + ch.2 deu 1 trang, khong co
//   link "下一页"); van giu vong lap phong thu cho link "下一页".
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Mirror: m.piaotia.com tra rong (000) tu VM — khong co mirror.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// giai ma GBK. Duong chinh: pacedFetch() (file rate-limit.js) — kiem
// tra cooldown, nghi jitter, retry 429/405/503, tu ghi cooldown khi bi
// chan. Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing). Tra ve { doc: Document} khi thanh cong, hoac
// { error: "tieng Viet"}.
function fetchPtDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var res = null;
        try {
            res = pacedFetch(candidates[i], {});
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!res) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (res.error === "cooldown") {
            return { error: rateLimitErrorMessage("飘天文学", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("飘天文学", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
                continue;
            }
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        var doc = null;
        try {
            doc = res.res.html("gbk");
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Giai link tuong doi dang "762992.html" theo URL trang muc luc
// (vd https://www.piaotia.com/html/1/1705/index.html + "762992.html").
// absUrl() dung chung ghep ve goc site nen KHONG dung duoc o day
// (bai hoc biqugezz: normalizeUrl doi host lam hong link tuong doi).
function resolvePtUrl(baseUrl, href) {
    if (!href) return "";
    href = String(href);
    if (/^https?:\/\//i.test(href)) return normalizeUrl(href);
    if (href.charAt(0) === "/") return siteOrigin() + href;
    var base = String(baseUrl || "");
    var cut = base.lastIndexOf("/");
    var dir = cut >= 0 ? base.substring(0, cut + 1) : base + "/";
    return dir + href;
}

// Bia suy ra tu URL chi tiet /bookinfo/<cat>/<id>.html:
// /files/article/image/<cat>/<id>/<id>s.jpg (khop anh that tren trang
// chi tiet, kiem chung live voi 傲世九重天 1/1705).
function coverFromBookUrl(url) {
    var m = String(url || "").match(/\/bookinfo\/(\d+)\/(\d+)\.html/i);
    if (!m) return "";
    return siteOrigin() + "/files/article/image/" + m[1] + "/" + m[2] + "/" + m[2] + "s.jpg";
}

// Map ten the loai (tieng Trung) -> so sort tren site.
var CATEGORY_MAP = {
    "玄幻魔法": 1, "武侠修真": 2, "都市言情": 3, "历史军事": 4,
    "网游竞技": 5, "科幻小说": 6, "恐怖灵异": 7, "同人漫画": 8, "其他类型": 9
};

// Parser 1 dong truyen trong bang table.grid (trang the loai, bang xep
// hang, ket qua tim kiem — cung mot mau dong):
//   td.odd a[bookinfo] ten + link | td.even a chuong moi nhat |
//   td.odd tac gia | td.even 字数 | td.odd 更新 | td.even 状态.
function parseGridRow(tr) {
    var tds = tr.select("td");
    if (tds.size() < 3) return null;
    var linkEl = safeFirst(tr.select("td a[href*='bookinfo']"));
    if (linkEl === null) return null;
    var link = absUrl(linkEl.attr("href"));
    if (!link) return null;
    var name = cleanText(linkEl.text());
    if (!name) return null;
    var author = cleanText(tds.get(2).text());
    var latest = "";
    var latestEl = safeFirst(tds.get(1).select("a"));
    if (latestEl !== null) latest = cleanText(latestEl.text());
    var status = tds.size() >= 6 ? cleanText(tds.get(5).text()) : "";
    var desc = "";
    if (latest) desc = "Mới nhất: " + latest;
    if (status) desc = desc ? desc + " · " + status : status;
    return {
        name: name,
        cover: coverFromBookUrl(link),
        link: link,
        author: author,
        description: desc,
        host: siteOrigin()
    };
}

// Parser ca bang table.grid: duyet cac <tr> co link bookinfo, bo trung.
function parseGridRows(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("table.grid tr");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseGridRow(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}

// Tach tieu de chuong tu <title> cua trang chuong.
// Dang that: "傲世九重天最新章节,第一部 天外之楼 第一章 若是有来生，伴君天下舞,PT文学"
// -> lay phan giua 2 dau phay, roi cat tu "第...章" tro di; neu khong
// co dang do thi tra nguyen phan giua.
function parseChapterTitle(doc) {
    var full = "";
    var titleEl = safeFirst(doc.select("title"));
    if (titleEl !== null) full = cleanText(titleEl.text());
    if (!full) return "";
    var parts = full.split(",");
    var mid = parts.length >= 2 ? parts[1] : full;
    mid = cleanText(mid);
    // Lay cum "第...章" CUOI CUNG (tieu de co ca "第一部 ..." dung truoc,
    // regex tham lam se an tu "第一部" — phai lay cum cuoi).
    var all = mid.match(/第[^,，第]*章/g);
    if (all && all.length > 0) {
        var last = all[all.length - 1];
        return cleanText(mid.substring(mid.lastIndexOf(last)));
    }
    // Chuong khong co "第X章" (vd "上架感言"): cat tien to "第X部 卷名 ".
    var m2 = mid.match(/^第[^ ]+部\s+[^ ]+\s+(.+)$/);
    if (m2) return cleanText(m2[1]);
    return mid;
}
