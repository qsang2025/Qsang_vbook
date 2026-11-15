// helper.js — Ham dung chung cho Jpxs123 (jpxs123.com).
//
// Site truyen chu tieng Trung, 精品小說網 / 精校小说网 (kiem chung live
// 2026-11-15, GBK):
// - Trang chu: nav 8 the loai /book/ (精品小說), /dsxs/ (都市小說), /xh/
//   (玄幻修真), /lishi/ (歷史軍事), /khjj/ (科幻競技), /cyjk/ (穿越架空),
//   /guihua/ (鬼話懸疑), /tongren/ (同人小說); /hot/ (排行榜).
//   Trang danh sach dung the div.bk > a (20 truyen/trang), phan trang
//   /<duong>/index_<N>.html (trang 1 la /<duong>/), link 下一页.
// - Trang truyen /<the loai>/<id>.html: h1 ten + hau to "(全本)" (da xong)
//   hoac "(1-279)" (so chuong da cu); anh bia div.pic img (/d/file/...);
//   tac gia trong div.date span a; mo ta la <p> ngay sau div.booktips;
//   muc luc DAY DU tren trang chi tiet (div.book_list ul li a, 402
//   chuong o sach mau — chuong 1 xuat hien 2 lan: "線上閱讀" + "第1节").
// - Trang chuong /<the loai>/<id>/<n>.html: noi dung div.read_chapterDetail
//   (cac <p>), tieu de h1 dang "Ten truyen 第N章"; nav 首章/下一章/尾章/目錄.
//   Khong co trang chia trong chuong.
// - Tim kiem: form POST /e/search/indexsearch.php (field keyboard,
//   show=title, classid=0), ket qua /e/search/result/index.php
//   ?page=<0-based>&searchid=<id> (kieu EmpireCMS). POST treo tu VM
//   (tarpit IP datacenter — tien le dingdian666/bixiange) nen search.js
//   dung WebView submit form nhu bixiange.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge; www la domain chinh, bare domain
//   la mirror (cung noi dung, 200).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 8 the loai (kiem chung live tu nav trang chu 2026-11-15).
var CATEGORIES = [
    { title: "精品小說", slug: "book", input: "/book/" },
    { title: "都市小說", slug: "dsxs", input: "/dsxs/" },
    { title: "玄幻修真", slug: "xh", input: "/xh/" },
    { title: "歷史軍事", slug: "lishi", input: "/lishi/" },
    { title: "科幻競技", slug: "khjj", input: "/khjj/" },
    { title: "穿越架空", slug: "cyjk", input: "/cyjk/" },
    { title: "鬼話懸疑", slug: "guihua", input: "/guihua/" },
    { title: "同人小說", slug: "tongren", input: "/tongren/" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// The loai theo URL truyen (/book/12277.html -> 精品小說). Khong neo
// dau chuoi vi URL day du bat dau bang https://... (loi gap o harness
// lan 1: genres=[]).
function categoryFromUrl(url) {
    var m = /\/(book|dsxs|xh|lishi|khjj|cyjk|guihua|tongren)\//.exec(String(url));
    if (m) return categoryBySlug(m[1]);
    return null;
}

// Cat hau to "(全本)" / "(1-279)" khoi ten sach.
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/\s*\((全本|完本|已完结|连载中?)\)\s*$/, "");
    n = n.replace(/\s*\(\d+-\d+\)\s*$/, "");
    return n;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchJxDoc(url) {
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
            return { error: rateLimitErrorMessage("Jpxs123", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Jpxs123", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Parse 1 the div.bk thanh muc truyen {name, cover, link,
// description, tag, host}. Tra null neu thieu ten hoac link.
function parseItemCard(card) {
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
    var imgEl = safeFirst(card.select("div.pic > img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src")) || "";
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

// Parse toan bo the div.bk tren 1 trang danh sach.
function parseItemList(doc) {
    var items = [];
    var cards = doc.select("div.bk");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var one = parseItemCard(cards.get(i));
        if (one !== null) items.push(one);
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
