// helper.js — Ham dung chung cho Shumilouxs (shukuai99.org, 书迷楼).
//
// Site truyen chu tieng Trung, UTF-8, khong Cloudflare, khong dang nhap,
// khong VIP/preview (kiem chung live 2026-11-16):
// - Trang chu: nav 8 the loai /list/<slug>/1.html, 排行榜 /rank/allvisit/,
//   danh sach moi nhat #newscontent (60 truyen, "最近更新").
// - Trang danh sach /list/<slug>/<N>.html: the #newscontent .l li (32
//   truyen/trang), .s1 the loai, .s2 a ten + link chi tiet, .s5 tac gia;
//   phan trang #pagelink (so trang + ">>" sang trang ke).
// - Trang 排行榜 /rank/allvisit/: the div.item (30 truyen, 1 trang, khong
//   phan trang) — cung dang the voi trang ket qua tim kiem.
// - Tim kiem: GET /searche6.html?searchkey=<tu khoa> (form tren trang
//   chu), the div.item, 1 trang duy nhat (82 ket qua cho "梦魇"), khong
//   phan trang.
// - Trang truyen /<id>/: the #info (h1 ten, p "作者：" + link tac gia,
//   p trang thai "状态：连载/完结", chu so, chuong moi nhat, cap nhat cuoi),
//   mo ta #intro (cuoi co cau mau "《X》是作者精心创作的<the loai>。"),
//   anh bia #fmimg img (data-original, src la nocover.jpg), muc luc rut
//   gon #list (100 chuong moi nhat, thu tu moi -> cu).
// - Muc luc day du: /indexlist/<id>/ (100 chuong/trang, thu tu doc dung),
//   #indexselect cho biet cac trang (vd 8 trang cho 748 chuong).
// - Trang chuong /<id>/<chapid>.html: noi dung trong #booktxt (cac <p>);
//   chuong chia nhieu trang: link a[rel="next"] toi _2.html, _3.html...
//   (ch.1 欢迎进入梦魇直播间 co 2 trang, tong ~4.600 ky tu); trang cuoi
//   cua chuong co a[rel="next"] tro toi chuong KE TIEP nen vong lap chi
//   tiep tuc khi URL ke van chua phan goc cua chuong hien tai. Cuoi trang
//   chia co dong mau "本章未完，点击下一页继续阅读。" va cuoi chuong co
//   dong quang cao transcode "最近转码严重，让我们更有动力…" — chap.js
//   cat ca hai.
// - Anh bia: img.shukuai99.org (http), lazy-load qua data-original.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 8 the loai (kiem chung live tu nav trang chu 2026-11-16).
var GENRES = [
    { title: "玄幻魔法", input: "/list/xuanhuanmofa/1.html" },
    { title: "仙侠修真", input: "/list/xianxiaxiuzhen/1.html" },
    { title: "都市言情", input: "/list/dushuyanqing/1.html" },
    { title: "历史军事", input: "/list/lishijunshi/1.html" },
    { title: "网游动漫", input: "/list/wangyoudongman/1.html" },
    { title: "科幻小说", input: "/list/kehuanxiaoshuo/1.html" },
    { title: "女生小说", input: "/list/nvshengxiaoshuo/1.html" },
    { title: "其他小说", input: "/list/qitaxiaoshuo/1.html" }
];

// Duong dan the loai theo ten day du (dung cho detail.js).
function genrePathByName(name) {
    var n = cleanText(name);
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        if (GENRES[i].title === n) return GENRES[i].input;
    }
    return "";
}

// Fetch 1 trang HTML co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchSkDoc(url) {
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
            return { error: rateLimitErrorMessage("Shumilouxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Shumilouxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
        if (isChallengeText(doc.html())) {
            lastError = "Trang đang hiện kiểm tra Cloudflare, thử lại sau: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Anh bia that cua site dung lazy-load: data-original moi la anh that,
// src chi la anh nocover.jpg giu cho. Tra "" neu khong co anh that.
function realCover(imgEl) {
    if (imgEl === null) return "";
    var src = imgEl.attr("data-original") || imgEl.attr("data-src") || "";
    if (!src) src = imgEl.attr("src") || "";
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    return absUrl(src);
}

// Parse 1 the div.item (trang tim kiem / 排行榜) thanh muc truyen
// {name, cover, link, description, tag, host}. Tra null neu thieu ten
// hoac link.
function parseItemCard(card) {
    var linkEl = safeFirst(card.select("dl dt a"));
    if (linkEl === null) linkEl = safeFirst(card.select("div.image a"));
    if (linkEl === null) return null;
    var name = cleanText(linkEl.text()) || cleanText(linkEl.attr("title"));
    var link = absUrl(linkEl.attr("href"));
    if (!name || !link) return null;
    var cover = realCover(safeFirst(card.select("div.image img")));
    var ddEl = safeFirst(card.select("dl dd"));
    var desc = ddEl !== null ? cleanText(ddEl.text()) : "";
    var authorEl = safeFirst(card.select("div.btm a"));
    var author = authorEl !== null ? cleanText(authorEl.text()) : "";
    if (author) desc = desc ? (author + " · " + desc) : author;
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse 1 dong #newscontent .l li (trang chu / trang the loai) thanh muc
// truyen. Tra null neu thieu ten hoac link.
function parseNewsRow(li) {
    var linkEl = safeFirst(li.select(".s2 a"));
    if (linkEl === null) return null;
    var name = cleanText(linkEl.text()) || cleanText(linkEl.attr("title"));
    var link = absUrl(linkEl.attr("href"));
    if (!name || !link) return null;
    var catEl = safeFirst(li.select(".s1"));
    var cat = catEl !== null ? cleanText(catEl.text()) : "";
    var auEl = safeFirst(li.select(".s5"));
    var author = auEl !== null ? cleanText(auEl.text()) : "";
    var desc = cat;
    if (author) desc = desc ? (desc + " · " + author) : author;
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: cat,
        host: siteOrigin()
    };
}

// Parse toan bo danh sach tren 1 trang: uu tien dang #newscontent
// (trang chu / the loai), neu khong co thi dang div.item (tim kiem /
// 排行榜). Tra mang rong neu khong nhan ra dang nao.
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var i = 0;
    var rows = doc.select("#newscontent .l li");
    if (rows.size() > 0) {
        for (i = 0; i < rows.size(); i++) {
            var one = parseNewsRow(rows.get(i));
            if (one !== null && !seen[one.link]) {
                seen[one.link] = true;
                items.push(one);
            }
        }
        return items;
    }
    var cards = doc.select("div.item");
    for (i = 0; i < cards.size(); i++) {
        var two = parseItemCard(cards.get(i));
        if (two !== null && !seen[two.link]) {
            seen[two.link] = true;
            items.push(two);
        }
    }
    return items;
}

// Tim link ">>" (trang ke) trong #pagelink; tra ve duong dan tuyet doi
// (hoac "" neu het trang).
function nextPageHref(doc) {
    var links = doc.select("#pagelink a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === ">>") {
            var href = a.attr("href");
            if (!href) return "";
            return absUrl(href);
        }
    }
    return "";
}
