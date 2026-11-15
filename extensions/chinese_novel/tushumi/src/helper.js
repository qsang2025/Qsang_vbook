// helper.js — Ham dung chung cho 图书迷 (tushumi.cc).
//
// Site HTML tinh phia server, UTF-8 (kiem chung live 2026-11-15):
// - Trang chu 200, 62 KB: nav co 5 bang xep hang (/lastupdate/,
//   /postdate/, /monthvisit/, /goodnum/, /goodnew/) + 10 the loai
//   (/leibie1_1.html ... /leibie10_1.html).
// - Trang danh sach: 50 muc/trang, moi muc la div#alistbox
//   (.pic a > img bia; .title h2 a ten + link /shu/<id>/;
//   .title span "作者：X"; .sys li a chuong moi nhat). Phan trang
//   .articlepage a.next (vd "/lastupdate/2/", "/leibie1_2.html").
// - Chi tiet /shu/<id>/: meta og:novel:* (ten, tac gia, the loai,
//   og:image bia, og:description) + #info h1/p + #fmimg img +
//   #intro .introtxt. KHONG co truong trang thai (og:novel:status
//   hay chu "连载/完本" nao tren trang) — ongoing suy ra tu chuong
//   "完本感言" trong muc luc (xem detail.js).
// - Muc luc: #list co 2 dt ("结局" + "正文"); site liet ke N chuong
//   moi nhat truoc (moi -> cu), roi toan bo danh sach tu chuong 1
//   tro di (tang dan), roi cac muc phu o cuoi — toc.js giu lai ban
//   xuat hien CUOI cua moi link de co thu tu doc dung.
// - Chuong /shu/<id>/<chapterid>.html: noi dung o #content, CHI co
//   the <p> (khong script/quang cao), khong chia trang (khong co
//   "下一页"). Chuong doc DU, KHONG can dang nhap, khong VIP,
//   khong preview (kiem chung ch.1 大奉打更人: 100 doan <p>, mo dau
//   "大奉京兆府，监牢。许七安幽幽醒来…"; ch.2: 89 doan <p>).
// - Tim kiem: POST /search.html, searchkey + searchtype=all, site
//   UTF-8 nen POST UTF-8 truc tiep duoc (khong can WebView nhu
//   biqugezz). LUU Y: POST nay TREO tu VM (khong tra loi trong 10-20s,
//   2 lan thu 2026-11-15) — co the la tarpit voi IP datacenter
//   (tien le tangthuvien: VM treo, may that chay); test tren may
//   that se quyet dinh giu hay bo search.js.
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
// retry 429/405/503, tu ghi cooldown khi bi chan. Neu domain chinh
// loi mang/5xx thi thu lan luot cac mirror trong MIRROR_LIST
// (cung pacing). Tra ve { doc: Document } khi thanh cong, hoac
// { error: "tieng Viet" }.
function fetchTmDoc(url) {
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
            return { error: rateLimitErrorMessage("图书迷", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("图书迷", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
            doc = res.res.html();
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

// Tach id truyen (so) tu URL dang /shu/<id>/, /info-<id>.html hoac
// bat ky URL nao cua site co chua /shu/<id>/ hay info-<id>.html.
// Tra "" neu khong tach duoc.
function bookId(url) {
    var m = String(url || "").match(/(?:shu\/|info-)(\d+)/i);
    return m ? m[1] : "";
}

// Parser 1 o truyen trong div#alistbox (trang danh sach / ket qua
// tim kiem). Cau truc that (kiem chung live 2026-11-15):
//   div.pic > a[href="/info-<id>.html" hoac "/shu/<id>/"] > img bia
//   div.info > div.title > h2 > a[href="/shu/<id>/"] ten (trong 《》)
//   div.title > span "作者：X"
//   div.sys > li > a chuong moi nhat
// Link tra ve luon dang /shu/<id>/ (co dau "/" cuoi).
function parseBookBox(el) {
    var titleEl = safeFirst(el.select(".title h2 a"));
    if (titleEl === null) titleEl = safeFirst(el.select(".title a"));
    if (titleEl === null) return null;
    var name = cleanText(titleEl.text()).replace(/^《/, "").replace(/》$/, "");
    if (!name) return null;
    var link = absUrl(titleEl.attr("href"));
    if (!link) return null;
    if (link.slice(-1) !== "/") link = link + "/";
    var cover = "";
    var imgEl = safeFirst(el.select(".pic img"));
    if (imgEl !== null) cover = imgEl.attr("src") || "";
    var author = "";
    var spanEl = safeFirst(el.select(".title span"));
    if (spanEl !== null) author = cleanText(spanEl.text()).replace(/^作者：/, "");
    var latest = "";
    var sysEl = safeFirst(el.select(".sys li a"));
    if (sysEl !== null) latest = cleanText(sysEl.text());
    var desc = author;
    if (latest) desc = author ? author + " — 最新：" + latest : "最新：" + latest;
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        host: siteOrigin()
    };
}

// Parser ca danh sach div#alistbox: duyet cac o, bo trung theo link.
function parseBookBoxes(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("#alist #alistbox");
    if (rows.size() === 0) rows = doc.select("#alistbox");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseBookBox(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}
