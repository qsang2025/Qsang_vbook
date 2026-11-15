// helper.js — Ham dung chung cho TongRenShe (m.tongrenshe.cc).
//
// Site truyen dong nhan (fanfic) tieng Trung, 同人社 (kiem chung live
// 2026-11-16, GBK, chi domain m. tra 200 tu VM; www/bare tra 000):
// - Trang chu: 20 truyen .books div.bk (co anh bia /d/file/...), phan
//   trang /tongren/index_<N>.html; nav: 同人 /tongren/, 排行榜单 /hot/,
//   全本同人 /tags-150-0.html, 连载同人 /tags-151-0.html. Tag 漫威
//   (/tags-154-0.html) tra 200 nhung TRONG (0 truyen) nen bo khoi
//   genre.js.
// - Trang danh sach (/tongren/, /hot/, /tags-150-0.html): 20 truyen/
//   trang, cung khoi div.bk nhu trang chu; phan trang: /tongren/
//   index_<N>.html, /hot/index_<N>.html, /tags-150-<N>.html (0-based),
//   link 下一页 trong div.page.
// - Trang truyen /tongren/<id>.html: h1 ten + hau to "(全本)" (da xong)
//   hoac "(1-1355)" (dang ra); anh bia div.pic img (/d/file/...); tac
//   gia div.infos div.date span a; mo ta div.infos p; muc luc DAY DU
//   tren trang chi tiet (div.book_list ul li a, 426 chuong o sach mau,
//   1..426 lien tuc, dung thu tu doc).
// - Trang chuong /tongren/<id>/<n>.html: noi dung div.read_chapterDetail
//   (cac <p>); tieu de h1 dang "Ten truyen 第N章"; chuong 1 co khoi dau
//   trang (ten sach + 作者： + 简介： x2 + toan bo mo ta + dong "第N章
//   ten chuong" trong noi dung) — chap.js cat bo; chuong 2 tro di bat
//   dau thang vao noi dung. Khong co trang chia trong chuong.
// - Tim kiem: form POST /e/search/index.php (field keyboard, show=title,
//   classid=0, class formSearch), ket qua /e/search/result/index.php?
//   page=<0-based>&searchid=<id> (kieu EmpireCMS, tien le ffxs8).
//   POST truc tiep treo tu VM (tarpit IP datacenter) nen search.js dung
//   WebView submit form.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge.
// - The loai: site chi co 3 muc that (同人 / 全本同人 / 连载同人),
//   khong co the loai nguoi lon nao de loc; trang la dong nhan binh
//   thuong, khong danh dau nsfw.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 3 muc danh sach that cua site (kiem chung live 2026-11-16).
// 漫威 (/tags-154-0.html) bo vi trang tra 200 nhung khong co truyen nao.
var CATEGORIES = [
    { title: "同人小说", slug: "tongren", input: "/tongren/" },
    { title: "全本同人", slug: "tags-150", input: "/tags-150-0.html" },
    { title: "连载同人", slug: "tags-151", input: "/tags-151-0.html" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// Cat hau to "(全本)" / "(1-1355)" khoi ten sach.
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/\s*\((全本|完本|已完结|连载中?)\)\s*$/, "");
    n = n.replace(/\s*\(\d+-\d+\)\s*$/, "");
    return n;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchTrDoc(url) {
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
            return { error: rateLimitErrorMessage("TongRenShe", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("TongRenShe", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
        if (isChallengeText(doc.html())) {
            lastError = "Trang đang hiện kiểm tra Cloudflare, thử lại sau: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Parse 1 the div.bk (trang chu / danh sach / ket qua tim kiem) thanh
// muc truyen {name, cover, link, description, tag, host}.
// Tra null neu thieu ten hoac link.
function parseBookCard(card) {
    var linkEl = safeFirst(card.select("a"));
    if (linkEl === null) return null;
    var link = absUrl(linkEl.attr("href"));
    if (!link) return null;
    var name = "";
    var h3 = safeFirst(card.select("div.infos > h3"));
    if (h3 !== null) name = cleanBookName(h3.text());
    if (!name) name = cleanText(linkEl.attr("title"));
    if (!name) return null;
    var cover = "";
    var imgEl = safeFirst(card.select("div.pic img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src"));
    var author = "";
    var newsEl = safeFirst(card.select("div.booknews"));
    if (newsEl !== null) {
        var news = cleanText(newsEl.text());
        var am = /作者[:：]\s*([^ ]+)/.exec(news);
        if (am) author = am[1];
    }
    var desc = "";
    var pEl = safeFirst(card.select("div.infos > p"));
    if (pEl !== null) desc = cleanText(stripTags(pEl.html()));
    if (!desc && author) desc = "作者：" + author;
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse toan bo the danh sach tren 1 trang: thu .books div.bk (trang
// chu / danh sach), roi ul.clearfix li (phong trang ket qua tim kiem
// dung layout khac — chua kiem chung tu VM, device test se quyet dinh).
function parseItemList(doc) {
    var items = [];
    var i = 0;
    var cards = doc.select(".books div.bk");
    for (i = 0; i < cards.size(); i++) {
        var one = parseBookCard(cards.get(i));
        if (one !== null) items.push(one);
    }
    if (items.length > 0) return items;
    var lis = doc.select("ul.clearfix li");
    for (i = 0; i < lis.size(); i++) {
        var li = lis.get(i);
        var linkEl = safeFirst(li.select("a"));
        if (linkEl === null) continue;
        var link = absUrl(linkEl.attr("href"));
        if (!link) continue;
        var nm = cleanBookName(linkEl.text());
        if (!nm) continue;
        items.push({ name: nm, cover: "", link: link, description: "", tag: "", host: siteOrigin() });
    }
    return items;
}

// Tim link "下一页" tren trang danh sach; tra ve URL tuyet doi
// (hoac "" neu het trang).
function nextPageHref(doc) {
    var links = doc.select("div.page a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href");
            if (!href) return "";
            return absUrl(href);
        }
    }
    return "";
}
