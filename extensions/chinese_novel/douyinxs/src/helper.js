// helper.js — Ham dung chung cho 抖音小说 (douyinxs.com).
//
// Site HTML tinh phia server, UTF-8 (kiem chung live 2026-11-15):
// - Trang chu m.douyinxs.com 200, 11 KB: nav co /fenlei/ (书库),
//   /rank/, /quanben/fenlei/; danh sach hot_sale.
// - Danh sach /fenlei/: 10 muc/trang, moi muc la div.hot_sale > a
//   (p.title ten, p.author "作者：X （ngay）", p.review "简介：...").
//   Phan trang 2 kieu: /fenlei/<N>/ la trang N cua danh sach TAT CA
//   (next /fenlei/<N+1>/); /fenlei/<cat>/<page>/ la trang cua the loai
//   (next /fenlei/<cat>/<page+1>/). The loai that tren nav
//   .sortChannel_nav: 1 玄奇, 2 高武, 3 修仙, 4 都市, 5 军事, 6 历史,
//   7 游体, 8 科幻, 9 恐怖, 10 次元, 11 女生 (base cu sai: 次元 ghi
//   /fenlei/0/, 女生 ghi /fenlei/ — da sua theo trang live).
// - Tim kiem: GET /search/?searchkey=<kw> tra ket qua that (kiem chung
//   live: "万族之劫" tra 16 muc .bookbox, co ca 万族之劫 /bqg/223080/);
//   POST /search/ treo tu VM (000, tarpit IP datacenter) nen dung GET.
//   Ket qua: .read_book .bookbox (h4.bookname a ten + link /bqg/<id>/,
//   .bookimg a img bia, .author tac gia/the loai, .update a chuong moi).
// - Chi tiet /bqg/<id>/: meta og:novel:* (ten, tac gia, the loai,
//   trang thai 连载/完结, chuong moi, anh bia og:image) + .review mo ta.
//   Muc luc phan trang: #indexselect option (50 trang x 20 chuong voi
//   万族之劫, 966 chuong); gia tri option la URL day du tren host
//   ba-dg.ddyyxs.cc — lay path roi gan BASE_URL (duong dan
//   /bqg/<id>_<n>/ chay duoc tren m, kiem chung live).
//   Trang chi tiet co 2 khoi .directoryArea: khoi 1 id="chapterlist"
//   (5 chuong moi nhat), khoi 2 la muc luc chinh (20 chuong/trang)
//   — toc.js lay khoi CUOI CUNG, khong dem 5 muc dau nhu base cu
//   (mong manh neu site doi so muc moi nhat).
// - Chuong /bqg/<id>/<cid>.html: noi dung o #chaptercontent (cac <p>),
//   chia trang kieu _2.html qua a#pt_next chu "下一页" (ch.1 万族之劫:
//   2 trang, tong ~3425 ky tu, mo dau "安平历350年。大夏府，南元城。").
//   Trang cuoi co a#pt_next chu "下一章" (link chuong ke) nen vong lap
//   chi noi trang khi chu la "下一页".
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Mirror www.douyinxs.com tra 200, cung duong dan (kiem chung live).
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
// (cung pacing). Tra ve { doc: Document} khi thanh cong, hoac
// { error: "tieng Viet"}.
function fetchDyDoc(url) {
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
            return { error: rateLimitErrorMessage("抖音小说", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("抖音小说", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Tach id truyen (so) tu URL dang /bqg/<id>/, /bqg/<id>_<n>/,
// /bqg/<id>/<cid>.html. Tra "" neu khong tach duoc.
function bookId(url) {
    var m = String(url || "").match(/\/bqg\/(\d+)/i);
    return m ? m[1] : "";
}

// Parser 1 muc truyen trong danh sach the loai: div.hot_sale > a
// (p.title ten, p.author "作者：X （ngay）", p.review "简介：...").
// Danh sach khong co anh bia nen khong tra cover.
function parseHotSaleRow(el) {
    var aEl = safeFirst(el.select("a"));
    if (aEl === null) return null;
    var link = absUrl(aEl.attr("href"));
    if (!link) return null;
    if (link.slice(-1) !== "/") link = link + "/";
    var name = "";
    var titleEl = safeFirst(el.select(".title"));
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) return null;
    var author = "";
    var authorEl = safeFirst(el.select(".author"));
    if (authorEl !== null) {
        author = cleanText(authorEl.text()).replace(/^作者：/, "").replace(/\s*（[^）]*）\s*$/, "");
    }
    var desc = "";
    var reviewEl = safeFirst(el.select(".review"));
    if (reviewEl !== null) desc = cleanText(reviewEl.text()).replace(/^简介：/, "");
    return {
        name: name,
        link: link,
        author: author,
        description: desc,
        host: siteOrigin()
    };
}

// Parser ca danh sach the loai: duyet #main .hot_sale, bo trung theo link.
function parseHotSaleRows(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("#main .hot_sale");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseHotSaleRow(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}

// Parser 1 muc ket qua tim kiem: .read_book .bookbox
// (h4.bookname a ten + link /bqg/<id>/, .bookimg a img bia,
// .author tac gia/the loai, .update a chuong moi nhat).
function parseBookBoxRow(el) {
    var titleEl = safeFirst(el.select("h4 a"));
    if (titleEl === null) return null;
    var name = cleanText(titleEl.text());
    if (!name) return null;
    var link = absUrl(titleEl.attr("href"));
    if (!link) return null;
    if (link.slice(-1) !== "/") link = link + "/";
    var cover = "";
    var imgEl = safeFirst(el.select(".bookimg a img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src") || "");
    var desc = "";
    var updateEl = safeFirst(el.select(".update"));
    if (updateEl !== null) desc = cleanText(updateEl.text());
    var author = "";
    var authorEls = el.select(".author");
    if (authorEls.size() > 0) {
        author = cleanText(authorEls.get(0).text()).replace(/^作者：/, "");
    }
    return {
        name: name,
        cover: cover,
        link: link,
        author: author,
        description: desc,
        host: siteOrigin()
    };
}

// Parser ca ket qua tim kiem: duyet .read_book .bookbox, bo trung theo link.
function parseBookBoxRows(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select(".read_book .bookbox");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseBookBoxRow(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}
