// helper.js — Ham dung chung cho Ffxs8 (ffxs8.com).
//
// Site truyen chu tieng Trung, 饭饭小说 (kiem chung live 2026-11-15, GBK):
// - Trang chu: nav 12 the loai (/dsyq/ /xhmf/ /wxxz/ /cyjk/ /khjj/
//   /jsls/ /ghxy/ /smtr/ /trxs/ /gcsz/ /xtfq/) + /sort/ (总排行榜) +
//   /newest/ (最新小说). Trang chu co khoi 推荐小说 (div.tui_book, co anh
//   bia /d/file/...) va khoi moi nhat .books div.bk (20 truyen, khong anh).
// - Trang danh sach the loai (/cyjk/ ...): the ul.clearfix li (20
//   truyen/trang), strong > a ten + hau to "(1-540)", .tips tac gia +
//   kich thuoc + ngay, .descript mo ta; phan trang /<duong>/index_<N>.html,
//   link 下一页 trong div.page. Khong co anh bia tren trang danh sach.
// - Trang truyen /<the loai>/<id>.html: h1 ten + hau to "(1-1440)" (so
//   chuong da cu) hoac "(全本)" (da xong); KHONG co anh bia tren trang
//   chi tiet; tac gia .descTip p.author span ("作者：..."); mo ta
//   .descInfo p (nam trong dau ngoac kep); muc luc DAY DU tren trang chi
//   tiet (ul.clearfix li a, 1791 chuong o sach mau, 1..1791 lien tuc,
//   khong trung lap).
// - Trang chuong /book/<catid>-<id>-<n>.html: noi dung div.content
//   (cac <p>); tieu de h1 dang "Ten truyen 第N节"; chuong 1 co them khoi
//   dau trang (ten sach + tac gia + 简介 + tom tat trong ngoac kep, roi
//   dong "<p>第N章 ...</p>") — chap.js cat bo; cac chuong sau bat dau
//   thang vao noi dung. Khong co trang chia trong chuong (nav mPage chi
//   co 首节/上一节/下一节/尾节/目录).
// - Tim kiem: form POST /e/search/index.php (field keyboard, show=title,
//   classid=0), ket qua /e/search/result/index.php?page=<0-based>
//   &searchid=<id> (kieu EmpireCMS). POST truc tiep treo tu VM (tarpit IP
//   datacenter — tien le dingdian666/bixiange/jpxs123) nen search.js dung
//   WebView submit form nhu bixiange.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge; www la domain chinh, m.ffxs8.com va
//   bare ffxs8.com la mirror (cung noi dung, 200).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 12 the loai (kiem chung live tu nav trang chu 2026-11-15).
var CATEGORIES = [
    { title: "都市言情", slug: "dsyq", input: "/dsyq/" },
    { title: "玄幻魔法", slug: "xhmf", input: "/xhmf/" },
    { title: "武侠修真", slug: "wxxz", input: "/wxxz/" },
    { title: "穿越架空", slug: "cyjk", input: "/cyjk/" },
    { title: "科幻竞技", slug: "khjj", input: "/khjj/" },
    { title: "军事历史", slug: "jsls", input: "/jsls/" },
    { title: "鬼话悬疑", slug: "ghxy", input: "/ghxy/" },
    { title: "耽美小说", slug: "smtr", input: "/smtr/" },
    { title: "同人小说", slug: "trxs", input: "/trxs/" },
    { title: "官场商战", slug: "gcsz", input: "/gcsz/" },
    { title: "乡土风情", slug: "xtfq", input: "/xtfq/" },
    { title: "总排行榜", slug: "sort", input: "/sort/" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// The loai theo URL truyen (/cyjk/19634.html -> 穿越架空). Khong neo
// dau chuoi vi URL day du bat dau bang https://... .
function categoryFromUrl(url) {
    var m = /\/(dsyq|xhmf|wxxz|cyjk|khjj|jsls|ghxy|smtr|trxs|gcsz|xtfq|sort)\//.exec(String(url));
    if (m) return categoryBySlug(m[1]);
    return null;
}

// Chuan hoa URL truyen: link dang /<the loai>/<id> (khong duoi) thi them
// "/" cuoi — site 301 ve dang nay (/xhmf/23289 -> /xhmf/23289/, 200),
// trong khi dang .html tra 404 voi sach kieu moi. Link .html cu giu
// nguyen (/cyjk/19634.html 200, dang "/" tra 403 voi sach cu).
function normalizeStoryUrl(url) {
    var u = String(url || "");
    if (/\/[a-z]+\/\d+$/.test(u)) return u + "/";
    return u;
}

// Cat hau to "(全本)" / "(1-1440)" khoi ten sach.
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/\s*\((全本|完本|已完结|连载中?)\)\s*$/, "");
    n = n.replace(/\s*\(\d+-\d+\)\s*$/, "");
    return n;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchFfDoc(url) {
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
            return { error: rateLimitErrorMessage("Ffxs8", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Ffxs8", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Parse 1 the div.bk (trang chu) thanh muc truyen {name, cover, link,
// description, tag, host}. Tra null neu thieu ten hoac link.
function parseHomeCard(card) {
    var linkEl = safeFirst(card.select("a"));
    if (linkEl === null) return null;
    var link = normalizeStoryUrl(absUrl(linkEl.attr("href")));
    if (!link) return null;
    var name = "";
    var h3 = safeFirst(card.select("div.infos > h3"));
    if (h3 !== null) name = cleanBookName(h3.text());
    if (!name) name = cleanText(linkEl.attr("title"));
    if (!name) return null;
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
        cover: "",
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse 1 the ul.clearfix li (trang the loai / xep hang / moi nhat /
// ket qua tim kiem) thanh muc truyen. Tra null neu thieu ten hoac link.
function parseListCard(li) {
    var linkEl = safeFirst(li.select("div.title strong > a"));
    if (linkEl === null) linkEl = safeFirst(li.select("a"));
    if (linkEl === null) return null;
    var link = normalizeStoryUrl(absUrl(linkEl.attr("href")));
    if (!link) return null;
    var name = cleanBookName(linkEl.text());
    if (!name) return null;
    var author = "";
    var tipsEl = safeFirst(li.select("div.tips"));
    if (tipsEl !== null) {
        var tips = cleanText(tipsEl.text());
        var am = /作者[:：]\s*([^ ]+)/.exec(tips);
        if (am) author = am[1];
    }
    var desc = "";
    var dEl = safeFirst(li.select("div.descript"));
    if (dEl !== null) desc = cleanText(stripTags(dEl.html()));
    if (!desc && author) desc = "作者：" + author;
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse toan bo the danh sach tren 1 trang: thu .books div.bk (trang
// chu) truoc, roi ul.clearfix li (trang the loai / xep hang / moi nhat).
function parseItemList(doc) {
    var items = [];
    var i = 0;
    var cards = doc.select(".books div.bk");
    for (i = 0; i < cards.size(); i++) {
        var one = parseHomeCard(cards.get(i));
        if (one !== null) items.push(one);
    }
    if (items.length > 0) return items;
    var lis = doc.select("ul.clearfix li");
    for (i = 0; i < lis.size(); i++) {
        var two = parseListCard(lis.get(i));
        if (two !== null) items.push(two);
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
